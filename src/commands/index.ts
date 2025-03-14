// Combines all command modules
import { Context } from "telegraf";
import * as balance from "./balance";
import * as login from "./login";
import * as send from "./send";
import * as withdraw from "./withdraw";
import { bot, MyContext } from "../bot";
import { checkTokenExpiration } from "../utils/middleware";

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

  // General message handler.  This needs to come *after* specific command handlers.
  bot.on("text", (ctx: MyContext) => {
    switch (ctx.session.step) {
      case "awaitingEmail":
        login.handleEmailInput(ctx);
        break;
      case "awaitingOtp":
        login.handleOtpInput(ctx);
        break;
      default:
        // Show a default message.
        ctx.reply("Sorry, I didn't understand that command.");
    }
  });
}
