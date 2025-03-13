// Main bot entry point
import { bot } from "./bot";
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
