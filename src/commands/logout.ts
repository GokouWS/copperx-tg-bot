// src/commands/logout.ts
import { MyContext, cleanupTasks } from "../bot";
import { buildMenu } from "../utils/menu";

/**
 * Handles the logout process for a user.
 *
 * This function performs cleanup tasks such as stopping Pusher subscriptions if they exist,
 * clearing the user's session data, and resetting the session state to idle.
 * It also sends a logout confirmation message with the main menu to the user.
 *
 * @param ctx - The Telegram bot context, which includes session data and functions
 * for interacting with the Telegram API.
 */
export async function handleLogout(ctx: MyContext) {
  const chatId = ctx.chat!.id;

  if (cleanupTasks.has(chatId)) {
    const cleanup = cleanupTasks.get(chatId);
    if (cleanup) {
      cleanup(); // Stop Pusher subscriptions
    }
    cleanupTasks.delete(chatId); // Remove from the map
  }

  // Clear session data
  ctx.session.tokenData = undefined;
  ctx.session.pendingTransaction = undefined;
  ctx.session.step = "idle";
  ctx.session.context = {};

  const menu = buildMenu(ctx);
  await ctx.reply("You have been logged out.", menu);
}
