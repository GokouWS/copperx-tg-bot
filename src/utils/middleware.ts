import { MiddlewareFn } from "telegraf";
import { MyContext } from "../bot"; // Import your custom context
import { isTokenExpired } from "../api";

export const checkTokenExpiration: MiddlewareFn<MyContext> = async (ctx, next) => {
  if (!ctx.session.tokenData) {
    // No token at all: User is not logged in
    return ctx.reply("Please log in first using /login.");
  }

  if (ctx.session.tokenData && isTokenExpired(ctx.session.tokenData)) {
    delete ctx.session.tokenData; // Clear the expired token
    return ctx.reply("Your session has expired. Please log in again using /login.");
  }
  await next(); // Proceed to the next middleware/handler
};
