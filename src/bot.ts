// Bot setup and initialization
import { Telegraf, Context, session } from "telegraf";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is not defined in .env");
  process.exit(1);
}

//Extend the telegraf context
interface SessionData {
  step: "idle" | "awaitingEmail" | "awaitingOtp"; //Add additional steps as needed.
  email?: string; //Store email
  sid?: string;
  tokenData?: {
    token: string;
    expiresAt: number; //store the entire token data.
  };
}
export interface MyContext extends Context {
  session: SessionData;
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
/default_wallet - View your default wallet
/change_default_wallet - Change your default wallet
/send - Send funds
/send_email - Send funds to an email address
/send_wallet - Send funds to a wallet address
/last10transactions - View your last 10 transactions
/withdraw - Withdraw funds to your bank account
  `);
});

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

export { bot };
