// src/index.ts
import { bot } from "./bot";
import { setupCommands } from "./commands";

async function main() {
  // Wrap everything in an async function
  try {
    // Set up commands
    console.log("Calling setupCommands");
    setupCommands();

    // Start the bot and *await* the launch
    console.log("Starting bot...");
    await bot.launch();
    console.log("Bot is running...");
  } catch (err) {
    console.error("Failed to start bot:", err);
    if (err instanceof Error) {
      console.error("Error Name:", err.name);
      console.error("Error Message:", err.message);
      console.error("Error Stack:", err.stack);
    } else {
      console.error("Unknown Error:", err);
    }
    process.exit(1);
  }
}

main(); // Call the main function
