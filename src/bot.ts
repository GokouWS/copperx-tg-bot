// Bot setup and initialization
import { Telegraf, Context, session } from "telegraf";
import dotenv from "dotenv";
import { setupDepositNotifications } from "./events/deposit";

dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is not defined in .env");
  process.exit(1);
}

// --- In-Memory Storage (for single user, no persistence) ---
let currentOrganizationId: string | null = null;
let currentChatId: number | null = null;
let cleanupPusher: (() => void) | null = null;

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

// In-memory session (replace with Redis later)
bot.use(session());
// Initialize session middleware and set default
bot.use(async (ctx, next) => {
  if (!ctx.session) {
    ctx.session = { step: "idle" }; // Set default values.
  }
  await next();
});

// Function to initialize the Pusher connection (called after login)
export async function initializeUserSession(
  chatId: number,
  token: string,
  organizationId: string,
) {
  // Cleanup any existing Pusher connection
  if (cleanupPusher) {
    cleanupPusher();
    cleanupPusher = null; // Clear the old cleanup function
  }

  // Store the current session information
  currentOrganizationId = organizationId;
  currentChatId = chatId;

  // Set up the Pusher connection
  cleanupPusher =
    (await setupDepositNotifications(token, organizationId, chatId)) ?? null;
}

// Function to clear the session (for logout or restart)
export function clearUserSession() {
  if (cleanupPusher) {
    cleanupPusher();
  }
  currentOrganizationId = null;
  currentChatId = null;
  cleanupPusher = null;
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
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

export { bot };
