import { Markup } from "telegraf";
import { MyContext } from "../bot";
import { initializeUserSession } from "../bot"; // Import
import { getUserProfile, isTokenExpired } from "../api";
import { buildMenu } from "../utils/menu";
import { handleFetchProfile } from "./login";

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
