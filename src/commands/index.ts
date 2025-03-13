// Combines all command modules
import { Context } from "telegraf";
import * as balance from "./balance";
import * as login from "./login";
import * as send from "./send";
import * as withdraw from "./withdraw";
import { bot, MyContext } from "../bot";

export function setupCommands() {
  // Login command
  bot.command("login", login.handleLogin);

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
