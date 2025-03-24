// Bot setup and initialization
import { Telegraf, Context } from "telegraf";
import dotenv from "dotenv";
import { setupDepositNotifications } from "./events/deposit";
import Redis, { RedisOptions } from "ioredis";
import RedisSession from "telegraf-session-redis";
import Pusher from "pusher";
import { UserProfile } from "./types";

dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is not defined in .env");
  process.exit(1);
}

// --- Pusher Setup ---
export const pusher = new Pusher({
  appId: process.env.VITE_PUSHER_APP_ID!,
  key: process.env.VITE_PUSHER_KEY!,
  secret: process.env.VITE_PUSHER_SECRET!,
  cluster: process.env.VITE_PUSHER_CLUSTER!,
  useTLS: true,
});

// --- Redis Session Setup ---
let redisClient: Redis;
let redisSession: RedisSession;

if (process.env.REDIS_URL) {
  try {
    const parsedUrl = new URL(process.env.REDIS_URL);
    const host = parsedUrl.hostname;
    const port = parseInt(parsedUrl.port, 10);
    const password = parsedUrl.password
      ? decodeURIComponent(parsedUrl.password)
      : undefined; // Handle undefined
    const username = parsedUrl.username
      ? decodeURIComponent(parsedUrl.username)
      : undefined;

    // Check for required values *before* creating the client
    if (!host || isNaN(port)) {
      throw new Error("Invalid REDIS_URL: Hostname or port is missing or invalid.");
    }

    redisClient = new Redis({
      host: host,
      port: port,
      password: password, // Can be undefined
      username: username,
    });

    redisSession = new RedisSession({
      store: {
        host: host, // Pass values directly
        port: port,
        password: password, // Can be undefined
      },
      getSessionKey: (ctx) => {
        return ctx.from && ctx.chat ? `${ctx.from.id}:${ctx.chat.id}` : undefined;
      },
    });
    console.log("Redis client initialized.");
  } catch (error) {
    console.error("Error initializing Redis:", error);
    process.exit(1); // Exit on Redis connection failure
  }
} else {
  console.error("REDIS_URL is not defined in .env");
  process.exit(1); // Exit if REDIS_URL is not set
}

//Extend the telegraf context
interface SessionData {
  step:
    | "idle"
    | "awaitingEmail"
    | "awaitingOtp"
    | "awaitingWalletChoice"
    | "awaitingRecipientEmail"
    | "awaitingWalletAddress"
    | "awaitingAmount"
    | "awaitingCurrency"
    | "awaitingWalletAmount"
    | "awaitingWalletCurrency"
    | "awaitingBankAccountId"
    | "awaitingWithdrawalAmount"
    | "awaitingWithdrawalCurrency"
    | "awaitingWithdrawalPurposeCode"; //Add additional steps as needed.
  email?: string; //Store logged in email
  userDetails?: UserProfile;
  kycStatus?: string;
  recipientEmail?: string; //Store recipient email for send to email
  emailAmount?: string; // Can be string or number
  currency?: string;
  recipientWalletAddress?: string;
  walletAmount?: string;
  pendingTransaction?: // Add pendingTransaction to session
  | {
        type: "sendemail";
        token: string;
        email: string;
        amount: string;
        currency: string;
        purposeCode: string;
      }
    | {
        type: "sendwallet";
        token: string;
        walletAddress: string;
        amount: string;
        currency: string;
        purposeCode: string;
      }
    | { type: "withdraw" /* ... withdraw fields ... */ }
    | null;
  tokenData?: {
    token: string;
    expireAt: number; //store the entire token data.
  };
  context?: {};
  sid?: string;
}
export interface MyContext extends Context {
  session: SessionData;
}

const bot = new Telegraf<MyContext>(process.env.TELEGRAM_BOT_TOKEN);

// Use Redis for session storage
bot.use(redisSession.middleware());

// Initialize session middleware and set default
bot.use(async (ctx, next) => {
  try {
    if (!ctx.session) {
      ctx.session = { step: "idle", context: {} };
    }
    if (!ctx.session.context) {
      ctx.session.context = {};
    }

    await next();
  } catch (error) {
    console.error("Error in session middleware:", error);
    // Handle the error appropriately (e.g., log it, skip the next middleware, etc.)
  }
});

//Keep track of cleanup tasks
export const cleanupTasks = new Map<number, () => void>();
export const pusherConnections = new Map<number, boolean>(); // Track Pusher connections

// Function to store cleanup tasks
export async function initializeUserSession(
  chatId: number,
  token: string,
  organizationId: string,
) {
  // Check if Pusher is already connected for this chat ID
  if (pusherConnections.get(chatId)) {
    // console.log(`Pusher already connected for chat ID ${chatId}.`);
    return; // Skip if already connected
  }

  // Check for existing cleanup tasks and execute them
  if (cleanupTasks.has(chatId)) {
    const cleanup = cleanupTasks.get(chatId);
    if (cleanup) {
      cleanup(); // cleanup any existing subscriptions
    }
  }
  //Set up new pusher subscription.
  console.log("Setting up deposit notifications");
  const cleanupPusher = await setupDepositNotifications(token, organizationId, chatId);
  if (cleanupPusher) {
    cleanupTasks.set(chatId, cleanupPusher); // Store cleanup function.
    pusherConnections.set(chatId, true); // Mark as connected
  }
}

// /help command
bot.help((ctx: MyContext) => {
  ctx.reply(`
Available Commands:

/start - Start the bot
/help - Show this help message
/login - Log in to your Copperx account
/balance - Check your wallet balances
/defaultwallet - View your default wallet
/changedefaultwallet - Change your default wallet
/send - Send funds
/sendemail - Send funds to an email address
/sendwallet - Send funds to a wallet address
/last10transactions - View your last 10 transactions
/withdraw - Withdraw funds to your bank account
  `);
});

// Graceful shutdown
process.once("SIGINT", async () => {
  // Make sure to handle promises.
  for (const cleanup of cleanupTasks.values()) {
    try {
      cleanup();
    } catch (error) {
      console.error("Error during cleanup", error);
    }
  }
  try {
    await bot.stop("SIGINT"); // bot.stop is async
    console.log("Bot stopped.");
  } catch (error) {
    console.error("Error stopping bot:", error);
  }
  try {
    await redisClient.quit();
    console.log("Redis client disconnected");
  } catch (error) {
    console.error("Error closing redis client", error);
  }
  process.exit(0); // Exit after all cleanup
});
process.once("SIGTERM", async () => {
  // Make sure to handle promises.
  for (const cleanup of cleanupTasks.values()) {
    try {
      cleanup();
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }
  try {
    await bot.stop("SIGTERM");
    console.log("Bot stopped");
  } catch (error) {
    console.error("Error stopping bot:", error);
  }
  try {
    await redisClient.quit();
    console.log("Redis Client Disconnected");
  } catch (error) {
    console.error("Error closing redis connection");
  }
  process.exit(0); // Exit after all cleanup
});
export { bot };
