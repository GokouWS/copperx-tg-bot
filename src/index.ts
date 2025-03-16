// Main bot entry point
import { getUserProfile, isTokenExpired } from "./api";
import { bot, clearUserSession, initializeUserSession } from "./bot";
import { setupCommands } from "./commands";

// Setup commands
setupCommands();

// Start the bot
bot
  .launch()
  .then(() => {
    console.log("Bot is running...");
  })
  .catch((err) => {
    console.error("Failed to start bot:", err);
    process.exit(1); // Exit with error code
  });

//fetch the orgId after login and initialize user session.
bot.command("start", async (ctx) => {
  const tokenData = ctx.session.tokenData;
  if (tokenData && !isTokenExpired(tokenData)) {
    try {
      const { token } = tokenData;
      const userProfile = await getUserProfile(token);
      const organizationId = userProfile.organizationId;
      console.log("Organization ID from /start:", organizationId);
      if (organizationId) {
        initializeUserSession(ctx.chat.id, token, organizationId); // Initialize
      } else {
        ctx.reply("Could not retrieve organization ID. Please contact support.");
      }
    } catch (error) {
      ctx.reply("Failed to initialize user session.");
    }
  } else {
    ctx.reply("Welcome to the Copperx bot, /login to begin.");
  }
});

// Enable graceful stop
process.once("SIGINT", () => {
  clearUserSession();
  bot.stop("SIGINT");
});
process.once("SIGTERM", () => {
  clearUserSession();
  bot.stop("SIGTERM");
});
