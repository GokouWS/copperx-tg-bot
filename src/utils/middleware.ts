import { MiddlewareFn } from "telegraf";
import { MyContext } from "../bot"; // Import your custom context
import { isTokenExpired } from "../api";

export const checkTokenExpiration: MiddlewareFn<MyContext> = async (ctx, next) => {
  const token = ctx.session.tokenData;

  if (!token) {
    // No token at all: User is not logged in
    return ctx.reply("Please log in first using /login.");
  }

  if (isTokenExpired(token)) {
    delete ctx.session.tokenData; // Clear the expired token
    return ctx.reply("Your session has expired. Please log in again using /login.");
  }
  await next(); // Proceed to the next middleware/handler
};
