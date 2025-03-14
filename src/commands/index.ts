// Combines all command modules
import { Context } from "telegraf";
import * as balance from "./balance";
import * as login from "./login";
import * as send from "./send";
import * as withdraw from "./withdraw";
import { bot, MyContext } from "../bot";
import { checkTokenExpiration } from "../utils/middleware";
import { sendToEmail, sendToWallet } from "../api";
import { getCallbackQueryData } from "../utils/helpers";
import { handleApiError } from "../utils/errorHandler";

export function setupCommands() {
  // Login command - Does NOT need the middleware, as it's for authentication
  bot.command("login", login.handleLogin);

  // --- Commands that require authentication (and token check) ---
  // Use the middleware for all commands that require a valid token

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
            `Successfully sent ${pending.amount} ${pending.currency} to ${pending.email}.  Transaction ID: ${result.id}`,
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
            `Successfully sent ${pending.amount} ${pending.currency} to ${pending.walletAddress}. Transaction ID: ${result.id}`,
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
    ctx.session.pendingTransaction = null;
    await ctx.editMessageText("Transaction cancelled.");
    ctx.session.step = "idle";
  });

  // General message handler.  This needs to come *after* specific command handlers.
  bot.on("text", (ctx: MyContext) => {
    switch (ctx.session.step) {
      case "awaitingEmail":
        login.handleEmailInput(ctx);
        break;
      case "awaitingOtp":
        login.handleOtpInput(ctx);
        break;
      case "awaitingRecipientEmail":
        send.handleRecipientEmailInput(ctx);
        break;
      case "awaitingAmount":
        send.handleAmountInput(ctx);
        break;
      case "awaitingCurrency":
        send.handleCurrencyInput(ctx);
        break;
      case "awaitingWalletAddress":
        send.handleWalletAddressInput(ctx);
        break;
      case "awaitingWalletAmount":
        send.handleWalletAmountInput(ctx);
        break;
      case "awaitingWalletCurrency":
        send.handleWalletCurrencyInput(ctx);
        break;
      default:
        // Show a default message.
        ctx.reply("Sorry, I didn't understand that command.");
    }
  });
}
