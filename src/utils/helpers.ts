// Utility functions

import { MyContext } from "../bot";

// Function to validate email format.
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Helper function to safely get message text
export function getMessageText(ctx: MyContext): string | null {
  if (ctx.message && "text" in ctx.message) {
    return ctx.message.text;
  }
  return null; // Return null if not a text message
}

// Basic escaping function
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

// Function to format currency
export function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

// Function to validate callback query
export function validateCallbackQuery(ctx: MyContext): boolean {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery!)) {
    console.warn("Received unexpected callback query:", ctx.callbackQuery);
    ctx.answerCbQuery("Invalid callback query.");
    return false; // Indicate failure
  }
  return true; // Indicate success
}

export function getCallbackQueryData(ctx: MyContext): string | null {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) {
    console.warn("Received unexpected callback query:", ctx.callbackQuery);
    ctx.answerCbQuery("Invalid callback query.");
    return null; // Return null on failure
  }
  return ctx.callbackQuery.data; // Return the data
}

export function sendLoadingMessage(ctx: MyContext, message: string): null {
  const returnMessage = `⌛ ${message}...`;
  ctx.reply(returnMessage);
  return null;
}

export function sendSuccessMessage(ctx: MyContext, message: string): null {
  const returnMessage = `✅ ${message}`;
  ctx.reply(returnMessage);
  return null;
}
