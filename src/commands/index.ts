// Combines all command modules
import { Context } from "telegraf";
import * as balance from "./balance";
import * as login from "./login";
import * as logout from "./logout";
import * as send from "./send";
import * as start from "./start";
import * as withdraw from "./withdraw";
import { bot, cleanupTasks, MyContext } from "../bot";
import { checkTokenExpiration } from "../utils/middleware";
import { sendToEmail, sendToWallet } from "../api";
import { getCallbackQueryData } from "../utils/helpers";
import { handleApiError } from "../utils/errorHandler";
import { handlers } from "./handlers";

/**
 * Sets up all command handlers and action handlers for the bot.
 *
 * The command handlers are:
 * - `/start` command (in its own file)
 * - `/login` command
 * - `/profile` command
 * - `/balance` command
 * - `/defaultwallet` command
 * - `/changedefaultwallet` command
 * - `/send` command
 * - `/sendemail` command
 * - `/sendwallet` command
 * - `/last10transactions` command
 * - `/withdraw` command
 * - `/logout` command
 *
 * The action handlers are:
 * - Confirmation actions for transactions
 * - Action handlers for buttons in the `/start` menu
 * - Action handlers for buttons in the command menus
 *
 * This function should be called before launching the bot.
 */
export function setupCommands() {
  console.log("setupCommands: START");
  // --- Command Handlers ---

  // Start command
  bot.command("start", start.handleStart);

  // Help command
  bot.command("help", start.handleHelp);

  // Login command
  bot.command("login", login.handleLogin);

  // --- Commands that require authentication (and token check) ---
  // Use the middleware for all commands that require a valid token

  // Profile command
  bot.command("profile", checkTokenExpiration, login.handleDisplayProfile);

  // Balance commands
  bot.command("balance", checkTokenExpiration, balance.handleBalance);
  bot.command("defaultwallet", checkTokenExpiration, balance.handleDefaultWallet);
  bot.command(
    "changedefaultwallet",
    checkTokenExpiration,
    balance.handleChangeDefaultWallet,
  );
  bot.action(/^set_default:.+$/, checkTokenExpiration, balance.handleWalletChoice);

  // Send commands
  bot.command("send", checkTokenExpiration, send.handleSend); // Add middleware
  bot.command("sendemail", checkTokenExpiration, send.handleSendEmail); // Add middleware
  bot.command("sendwallet", checkTokenExpiration, send.handleSendWallet); // Add middleware
  bot.command("last10transactions", checkTokenExpiration, send.handleLast10Transactions); // Add middleware

  // Withdraw commands
  bot.command("withdraw", checkTokenExpiration, withdraw.handleWithdraw);

  //Logout command
  bot.command("logout", logout.handleLogout);

  // --- Confirmation Actions ---
  bot.action("confirm_transaction", checkTokenExpiration, async (ctx) => {
    const callbackData = getCallbackQueryData(ctx);
    if (!callbackData) {
      return; // Exit early if invalid callback query
    }
    await ctx.answerCbQuery();

    const pending = ctx.session.pendingTransaction;
    if (!pending) {
      return ctx.editMessageText("No pending transaction.");
    }

    try {
      let result;
      switch (pending.type) {
        case "sendemail":
          // Use correct parameters based on updated Swagger
          result = await sendToEmail(
            pending.token,
            pending.email,
            pending.amount,
            pending.currency,
            pending.purposeCode,
          );
          await ctx.editMessageText(
            `🟢 Successfully sent ${pending.amount} ${pending.currency} \nTo: ${pending.email}  \nTransaction ID: ${result.id}`,
          );
          break;
        case "sendwallet":
          // Use correct parameters based on updated Swagger
          result = await sendToWallet(
            pending.token,
            pending.walletAddress,
            pending.amount,
            pending.currency,
            pending.purposeCode,
          );
          await ctx.editMessageText(
            `🟢 Successfully sent ${pending.amount} ${pending.currency} \nTo: ${pending.walletAddress} \nTransaction ID: ${result.id}`,
          );
          break;
        default:
          await ctx.editMessageText("Invalid pending transaction.");
          return;
      }
    } catch (error) {
      handleApiError(ctx, error);
    } finally {
      ctx.session.pendingTransaction = null;
      ctx.session.step = "idle";
    }
  });

  bot.action("cancel_transaction", async (ctx) => {
    const callbackData = getCallbackQueryData(ctx);
    if (!callbackData) {
      return; // Exit early if invalid callback query
    }
    await ctx.answerCbQuery();
    ctx.session.pendingTransaction = null; // Clear pending transaction from session
    await ctx.editMessageText("🚫 Transaction cancelled.");
    ctx.session.step = "idle";
  });

  bot.action("cancel_button", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText("🚫 Action Cancelled.");
    ctx.session.step = "idle";
  });

  // --- Action Handlers for /start buttons ---
  bot.action("login_button", async (ctx: MyContext) => {
    await ctx.answerCbQuery();
    await login.handleLogin(ctx); // Directly call handleLogin
  });

  bot.action("help_button", async (ctx: MyContext) => {
    await ctx.answerCbQuery();
    await start.handleHelp(ctx); // Your help message
  });

  // --- Action Handlers for commands buttons ---
  bot.action("profile_button", checkTokenExpiration, async (ctx: MyContext) => {
    await ctx.answerCbQuery();
    await login.handleDisplayProfile(ctx);
  });
  bot.action("balance_button", checkTokenExpiration, async (ctx: MyContext) => {
    await ctx.answerCbQuery();
    await balance.handleBalance(ctx);
  });
  bot.action("send_button", checkTokenExpiration, async (ctx: MyContext) => {
    await ctx.answerCbQuery();
    await send.handleSend(ctx);
  });
  bot.action("sendemail_button", checkTokenExpiration, async (ctx: MyContext) => {
    await ctx.answerCbQuery();
    await send.handleSendEmail(ctx);
  });
  bot.action("sendwallet_button", checkTokenExpiration, async (ctx: MyContext) => {
    await ctx.answerCbQuery();
    await send.handleSendWallet(ctx);
  });
  bot.action(
    "last10transactions_button",
    checkTokenExpiration,
    async (ctx: MyContext) => {
      await ctx.answerCbQuery();
      await send.handleLast10Transactions(ctx);
    },
  );
  bot.action("withdraw_button", checkTokenExpiration, async (ctx: MyContext) => {
    await ctx.answerCbQuery();
    await withdraw.handleWithdraw(ctx);
  });
  bot.action("default_wallet_button", checkTokenExpiration, async (ctx: MyContext) => {
    await ctx.answerCbQuery();
    await balance.handleDefaultWallet(ctx);
  });
  bot.action("logout_button", async (ctx: MyContext) => {
    await ctx.answerCbQuery();
    await logout.handleLogout(ctx);
  });
  // Currency selection
  bot.action(/^select_currency:.+$/, checkTokenExpiration, send.handleCurrencySelection);

  // Message handler
  bot.on("text", async (ctx: MyContext) => {
    const handler = handlers.get(ctx.session.step); // Use .get()
    if (handler) {
      await handler(ctx);
    } else {
      ctx.reply("Sorry, I didn't understand that command.");
    }
  });

  console.log("setupCommands: END");
}
