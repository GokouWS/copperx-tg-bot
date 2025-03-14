// Utility functions

import { MyContext } from "../bot";

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
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) {
    console.warn("Received unexpected callback query:", ctx.callbackQuery);
    ctx.answerCbQuery("Invalid callback query.");
    return false; // Indicate failure
  }
  return true; // Indicate success
}
