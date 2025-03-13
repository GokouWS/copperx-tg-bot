import { Context } from "telegraf";

/**
 * Handles errors from axios requests.
 *
 * This function will reply to the Telegram user with a human-readable error
 * message if the error is an instance of Error or has a "message" property.
 * Otherwise, it will reply with a generic "An unknown error occurred." message.
 *
 * @param ctx - The Telegram bot context
 * @param error - The error to be handled
 */
export function handleAxiosError(ctx: Context, error: unknown) {
  if (error instanceof Error) {
    ctx.reply(error.message);
  } else if (error && typeof error === "object" && "message" in error) {
    ctx.reply(String(error.message));
  } else {
    ctx.reply("An unknown error occurred.");
    console.error(error); // Log for debugging
  }
}
