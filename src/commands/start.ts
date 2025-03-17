import { Markup } from "telegraf";
import { MyContext } from "../bot";
import { initializeUserSession } from "../bot"; // Import
import { getUserProfile, isTokenExpired } from "../api";

export async function handleStart(ctx: MyContext) {
  // Guard Clause: Check for session and token validity
  if (!ctx.session.tokenData || isTokenExpired(ctx.session.tokenData)) {
    // Not logged in - show welcome message with buttons
    let message = "*Welcome to the Copperx Payout Bot\\!*\n\n";
    message += "I'm here to provide quick and easy access to your Copperx account\n\n";
    message += "To get started, please log in using the button below";
    await ctx.replyWithMarkdownV2(
      message,
      Markup.inlineKeyboard([
        Markup.button.callback("Login", "login_button"),
        Markup.button.callback("Help", "help_button"),
      ]),
    );
    return; // Exit early if not logged in
  }

  // If we get here, the user *is* logged in
  try {
    const token = ctx.session.tokenData.token;
    const userProfile = await getUserProfile(token);
    const organizationId = userProfile.organizationId;

    if (!organizationId) {
      await ctx.reply("Could not retrieve organization ID. Please contact support.");
      return; // Exit if organization ID is missing
    }

    initializeUserSession(ctx.chat!.id, token, organizationId);
    await ctx.reply("You are logged in. Welcome back!");
  } catch (error) {
    await ctx.reply("Failed to initialize user session.");
  }
}
