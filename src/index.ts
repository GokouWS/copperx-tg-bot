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

    let launchOptions = {};

    if (process.env.USE_WEBHOOKS === "true") {
      const webhookUrl = process.env.RENDER_EXTERNAL_URL; // Use RENDER_EXTERNAL_URL for Render's external URL
      const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000; // Default to 3000, but use PORT if set

      if (!webhookUrl) {
        console.error("WEBHOOK_URL is not defined. Webhooks will not work.");
        process.exit(1);
      }

      launchOptions = {
        webhook: {
          domain: webhookUrl,
          port: port,
        },
      };
      console.log("Using webhooks:", launchOptions);
    } else {
      console.log("Using long polling.");
    }
    await bot.launch(launchOptions).then(() => console.log("Bot started"));
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
