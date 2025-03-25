import { Markup } from "telegraf";
import { MyContext } from "../bot";
import { initializeUserSession } from "../bot"; // Import
import { getUserProfile, isTokenExpired } from "../api";
import { buildMenu } from "../utils/menu";
import { handleFetchProfile } from "./login";
import { escapeInput } from "../utils/helpers";

export async function handleStart(ctx: MyContext) {
  const menu = buildMenu(ctx);
  // Guard Clause: Check for session and token validity
  if (!ctx.session.tokenData || isTokenExpired(ctx.session.tokenData)) {
    // Not logged in - show welcome message with buttons
    let message = "*Welcome to the Copperx Payout Bot\\!*\n\n";
    message += "I'm here to provide quick and easy access to your Copperx account\n\n";
    message += "To get started, please log in using the button below";
    await ctx.replyWithMarkdownV2(message, menu);
    return; // Exit early if not logged in
  }

  // If we get here, the user *is* logged in
  try {
    const token = ctx.session.tokenData.token;

    const userProfile = await handleFetchProfile(ctx);
    const email = ctx.session.email!;
    const message = `Welcome back! You are logged in as ${email}`;
    await ctx.reply(message, menu);
  } catch (error) {
    await ctx.reply("Failed to initialize user session.");
  }
}

/**
 * Shows the help message with available commands.
 *
 * @param ctx - The Telegram bot context, which includes session data
 * and functions for interacting with the Telegram API.
 */
export async function handleHelp(ctx: MyContext) {
  const menu = buildMenu(ctx);
  const message = `
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
  `;
  await ctx.replyWithMarkdownV2(escapeInput(message), menu);
}
