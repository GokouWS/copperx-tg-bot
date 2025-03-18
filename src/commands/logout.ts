// src/commands/logout.ts
import { MyContext, cleanupTasks } from "../bot";
import { buildMenu } from "../utils/menu";

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
