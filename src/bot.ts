// Bot setup and initialization
import { Telegraf, Context, session } from "telegraf";
import dotenv from "dotenv";
import { setupDepositNotifications } from "./events/deposit";
import Redis from "ioredis";
import RedisSession from "telegraf-session-redis";

dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is not defined in .env");
  process.exit(1);
}

// --- Redis Session Setup ---
const redisClient = new Redis(process.env.REDIS_URL!); // Use ioredis.  Make sure REDIS_URL is set!
const redisSession = new RedisSession({
  store: {
    host: process.env.REDIS_URL!, //Connection string
    port: process.env.REDIS_PORT!, //Port
    // You can add other Redis options here if needed (e.g., password)
  },
  getSessionKey: (ctx) => {
    // Use both chat ID and user ID to create a unique session key.
    // This handles cases where a user might use the bot in a group and privately.
    return ctx.from && ctx.chat
      ? `<span class="math-inline">\{ctx\.from\.id\}\:</span>{ctx.chat.id}`
      : undefined;
  },
});

// --- In-Memory Storage (for single user, no persistence) ---
let currentOrganizationId: string | null = null;
let currentChatId: number | null = null;
// let cleanupPusher: (() => void) | null = null;

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
  recipientEmail?: string; //Store recipient email for send to email
  amount?: string; // Can be string or number
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
  sid?: string;
}
export interface MyContext extends Context {
  session: SessionData;
  tokenData?: {
    // Add tokenData to MyContext, make it optional
    token: string;
    expiresAt: number;
  };
}

const bot = new Telegraf<MyContext>(process.env.TELEGRAM_BOT_TOKEN);

// // In-memory session (replace with Redis later)
// bot.use(session());

// Use Redis for session storage
bot.use(redisSession.middleware());

// Initialize session middleware and set default
bot.use(async (ctx, next) => {
  if (!ctx.session) {
    ctx.session = { step: "idle" }; // Set default values.
  }
  await next();
});

//Keep track of cleanup tasks
const cleanupTasks = new Map<number, () => void>();

// Function to store cleanup tasks
export async function initializeUserSession(
  chatId: number,
  token: string,
  organizationId: string,
) {
  // Check for existing cleanup tasks and execute them
  if (cleanupTasks.has(chatId)) {
    const cleanup = cleanupTasks.get(chatId);
    if (cleanup) {
      cleanup(); // cleanup any existing subscriptions
    }
  }
  //Set up new pusher subscription.
  const cleanupPusher = await setupDepositNotifications(token, organizationId, chatId);
  !!cleanupPusher && cleanupTasks.set(chatId, cleanupPusher); // Store cleanup function.
}

// /start command
bot.start((ctx: Context) => {
  ctx.reply("Welcome to the Copperx Telegram Bot! Use /help to see available commands.");
});

// /help command
bot.help((ctx: Context) => {
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
process.once("SIGINT", () => {
  for (const cleanup of cleanupTasks.values()) {
    cleanup(); // Execute all cleanup functions.
  }
  bot.stop("SIGINT");
  redisClient.quit(); // Quit the Redis connection *AFTER* stopping the bot
});
process.once("SIGTERM", () => {
  for (const cleanup of cleanupTasks.values()) {
    cleanup(); // Execute all cleanup functions.
  }
  bot.stop("SIGTERM");
  redisClient.quit(); // Quit the Redis connection *AFTER* stopping the bot
});

export { bot };
