// src/utils/menu.ts
import { Markup } from "telegraf";
import { MyContext } from "../bot";
import { isTokenExpired } from "../api";

/**
 * Builds an inline keyboard menu for the Telegram bot interface.
 *
 * The menu options differ based on the user's login status:
 * - For logged-in users: Displays options for viewing profile, wallet, balance, sending funds, withdrawing, and logging out.
 * - For logged-out users: Displays an option to log in.
 * - In both cases, a Help button is always included.
 *
 * @param ctx - The Telegram bot context, which includes session data and functions for interacting with the Telegram API.
 * @returns An inline keyboard markup with the appropriate buttons displayed.
 */
export function buildMenu(ctx: MyContext) {
  const isLoggedIn = ctx.session.tokenData && !isTokenExpired(ctx.session.tokenData);

  const buttons = [];

  if (isLoggedIn) {
    // Logged-in user: Show basic commands
    buttons.push([
      Markup.button.callback("👤 Profile", "profile_button"),
      Markup.button.callback("👛 Wallet", "default_wallet_button"),
    ]);
    buttons.push([
      Markup.button.callback("💰 Balance", "balance_button"),
      Markup.button.callback("💸 Send", "send_button"),
      Markup.button.callback("🏦 Withdraw", "withdraw_button"),
    ]);
    buttons.push([Markup.button.callback("🗝 Logout", "logout_button")]);
  } else {
    // Logged-out user: Show login button
    buttons.push([Markup.button.callback("🔑 Login", "login_button")]);
  }

  // Always show the Help button
  buttons.push([Markup.button.callback("🆘 Help", "help_button")]);

  return Markup.inlineKeyboard(buttons as any, { columns: 3 });
}

/**
 * Builds an inline keyboard menu for sending funds.
 *
 * For logged-in users, it displays options for sending funds to an email address, sending funds to a wallet address, and viewing the last 10 transactions.
 * For both logged-in and logged-out users, a Help button is always included.
 *
 * @param ctx - The Telegram bot context, which includes session data and functions for interacting with the Telegram API.
 * @returns An inline keyboard markup with the appropriate buttons displayed.
 */
export function buildSendMenu(ctx: MyContext) {
  const isLoggedIn = ctx.session.tokenData && !isTokenExpired(ctx.session.tokenData);
  const buttons = [];

  if (isLoggedIn) {
    // Logged-in user: Show send commands
    buttons.push([
      Markup.button.callback("📧 Send To Email", "sendemail_button"),
      Markup.button.callback("💸 Send To Wallet", "sendwallet_button"),
    ]);
    buttons.push([
      Markup.button.callback("📊 View last 10 transactions", "last10transactions_button"),
    ]);
  }
  buttons.push([Markup.button.callback("🆘 Help", "help_button")]);

  return Markup.inlineKeyboard(buttons as any, { columns: 3 });
}

/**
 * Builds a single "Cancel" button.
 *
 * @param ctx - The Telegram bot context, which includes session data and functions for interacting with the Telegram API.
 * @returns An inline keyboard markup containing a single "Cancel" button.
 */
export function cancelButton(ctx: MyContext) {
  return Markup.button.callback("🚫 Cancel", "cancel_button");
}

/**
 * Builds a reply keyboard menu for basic commands.
 *
 * For logged-in users, it displays four rows of buttons with the following commands:
 *  - /balance
 *  - /defaultwallet
 *  - /send
 *  - /withdraw
 *  - /last10transactions
 *  - /logout
 *  - /help
 *
 * For logged-out users, it displays a single row with two buttons:
 *  - /login
 *  - /help
 *
 * @param ctx - The Telegram bot context, which includes session data and functions for interacting with the Telegram API.
 * @returns A reply keyboard markup with the appropriate buttons displayed.
 */
export function buildReplyKeyboard(ctx: MyContext) {
  const isLoggedIn = ctx.session.tokenData && !isTokenExpired(ctx.session.tokenData);

  let keyboard: any;
  if (isLoggedIn) {
    keyboard = Markup.keyboard([
      ["/balance", "/defaultwallet"],
      ["/send", "/withdraw"],
      ["/last10transactions", "/logout"],
      ["/help"],
    ]).resize(); // Add resize() for a better look
  } else {
    keyboard = Markup.keyboard([["/login", "/help"]]).resize();
  }

  return keyboard;
}
