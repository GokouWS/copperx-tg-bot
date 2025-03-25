// Utility functions

import { MyContext } from "../bot";

/**
 * Checks if a given string is a valid email address.
 *
 * The email address is valid if it contains at least one `@` symbol,
 * and no whitespace characters before or after the `@` symbol.
 *
 * @param email - The string to check.
 * @returns true if the string is a valid email address; otherwise, false.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Retrieves the text content from a text message within the given context.
 *
 * @param ctx - The context object that contains the message.
 * @returns The text of the message if it is a text message; otherwise, null.
 */
export function getMessageText(ctx: MyContext): string | null {
  if (ctx.message && "text" in ctx.message) {
    return ctx.message.text;
  }
  return null; // Return null if not a text message
}

/**
 * Escapes a string to be used in a Telegram message.
 *
 * The following characters are escaped:
 * - Markdown special characters: `*`, `_`, `[`, `]`, `(`, `)`, `~`, `` ` ``, `>`, `#`, `+`, `=`, `|`, `{`, `}`, `.`, `!`, and `\`.
 * - HTML special characters: `<`, `>`, `&`, and `"`
 *
 * @param input - The string to escape.
 * @returns The escaped string.
 */
export function escapeInput(input: string): string {
  return input
    .replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&")
    .replace(/[<>&"]/g, function (char) {
      switch (char) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case '"':
          return "&quot;";
        default:
          return char;
      }
    });
}

/**
 * Formats a given amount into a currency string.
 *
 * Utilizes the `Intl.NumberFormat` object to format the number
 * as a currency string in the specified currency code.
 *
 * @param amount - The numerical amount to format.
 * @param currencyCode - The ISO 4217 currency code (e.g., "USD", "EUR").
 * @returns A string representing the formatted currency.
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

/**
 * Validates the presence of a callback query and its data in the given context.
 *
 * If the callback query or its data is missing, the function logs a warning,
 * sends an answer callback query indicating an invalid callback query,
 * and returns false. Otherwise, it returns true.
 *
 * @param ctx - The context containing the callback query.
 * @returns true if the callback query and its data are valid; otherwise, false.
 */
export function validateCallbackQuery(ctx: MyContext): boolean {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery!)) {
    console.warn("Received unexpected callback query:", ctx.callbackQuery);
    ctx.answerCbQuery("Invalid callback query.");
    return false; // Indicate failure
  }
  return true; // Indicate success
}

/**
 * Retrieves the callback query data from the given context.
 *
 * If the callback query or its data is missing, the function logs a warning,
 * sends an answer callback query indicating an invalid callback query,
 * and returns null. Otherwise, it returns the callback query data.
 *
 * @param ctx - The context containing the callback query.
 * @returns The callback query data, or null if the query is invalid.
 */
export function getCallbackQueryData(ctx: MyContext): string | null {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) {
    console.warn("Received unexpected callback query:", ctx.callbackQuery);
    ctx.answerCbQuery("Invalid callback query.");
    return null; // Return null on failure
  }
  return ctx.callbackQuery.data; // Return the data
}

/**
 * Sends a "loading" message to the user with a yellow circle emoji.
 *
 * This function is useful for indicating to the user that a long-running operation is taking place.
 *
 * @param ctx - The context object containing the chat to send the message to.
 * @param message - The text to display in the loading message.
 * @returns null, indicating that the function does not return a value.
 */
export function sendLoadingMessage(ctx: MyContext, message: string): null {
  const returnMessage = `🟡 ${message}...`;
  ctx.reply(returnMessage);
  return null;
}

/**
 * Sends a "success" message to the user with a green circle emoji.
 *
 * This function is useful for indicating to the user that a long-running operation has completed successfully.
 *
 * @param ctx - The context object containing the chat to send the message to.
 * @param message - The text to display in the success message.
 * @returns null, indicating that the function does not return a value.
 */
export function sendSuccessMessage(ctx: MyContext, message: string): null {
  const returnMessage = `🟢 ${message}`;
  ctx.reply(returnMessage);
  return null;
}

// List of supported currencies
export const supportedCurrencies = ["USD"];
