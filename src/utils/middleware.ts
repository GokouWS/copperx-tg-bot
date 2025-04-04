import { Markup, MiddlewareFn } from "telegraf";
import { MyContext } from "../bot"; // Import your custom context
import { isTokenExpired } from "../api";
import { buildMenu } from "./menu";

/**
 * Checks if the user has a valid session token. If not, it asks the user to log in.
 * If the token is expired, it clears the session and asks the user to log in again.
 *
 * @remarks
 * This middleware should be used before any handler that requires a valid session.
 * @example
 * bot.use(checkTokenExpiration);
 * bot.command("myCommand", myCommandHandler);
 */
export const checkTokenExpiration: MiddlewareFn<MyContext> = async (ctx, next) => {
  const token = ctx.session.tokenData;

  if (!token) {
    // No token at all: User is not logged in
    const menu = buildMenu(ctx);
    const message = "Please log in first using the button bellow or type /login\\.";
    return await ctx.replyWithMarkdownV2(message, menu);
  }

  if (isTokenExpired(token)) {
    delete ctx.session.tokenData; // Clear the expired token
    const menu = buildMenu(ctx);
    const message =
      "Your session has expired. Please log in again using the button below or type /login\\.";
    return await ctx.replyWithMarkdownV2(message, menu);
  }
  await next(); // Proceed to the next middleware/handler
};
