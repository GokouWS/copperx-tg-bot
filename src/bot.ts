/* Bot setup and initialization */
import { Telegraf, Context, session } from "telegraf";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is not defined in .env");
  process.exit(1);
}
