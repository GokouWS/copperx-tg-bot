// src/utils/menu.ts
import { Markup } from "telegraf";
import { MyContext } from "../bot";
import { isTokenExpired } from "../api";

export function buildMenu(ctx: MyContext) {
  const isLoggedIn = ctx.session.tokenData && !isTokenExpired(ctx.session.tokenData);

  const buttons = [];

  if (isLoggedIn) {
    // Logged-in user: Show basic commands
    buttons.push([
      Markup.button.callback("Balance", "balance_button"),
      Markup.button.callback("Send", "send_button"),
      Markup.button.callback("Withdraw", "withdraw_button"),
    ]);
    buttons.push([Markup.button.callback("Default Wallet", "default_wallet_button")]);
    buttons.push([Markup.button.callback("Logout", "logout_button")]);
  } else {
    // Logged-out user: Show login button
    buttons.push([Markup.button.callback("Login", "login_button")]);
  }

  // Always show the Help button
  buttons.push([Markup.button.callback("Help", "help_button")]);

  return Markup.inlineKeyboard(buttons as any, { columns: 3 });
}
