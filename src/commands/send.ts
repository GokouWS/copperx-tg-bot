// Send commands
import { Context, Markup } from "telegraf";
import {
  sendToEmail,
  sendToWallet,
  getLast10Transactions,
  getWalletBalances,
} from "../api";
import { bot, MyContext } from "../bot"; // Correctly import bot and MyContext
import { handleApiError } from "../utils/errorHandler";
import { escapeInput, getMessageText, isValidEmail } from "../utils/helpers";
import { WalletsResponse } from "../types";

export async function handleSend(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;
  ctx.reply(
    "What do you want to do? /sendemail, /sendwallet or view your /last10transactions",
  );
}

// --- Send to Email ---
export async function handleSendEmail(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;
  ctx.reply("Enter the recipient email address:");
  ctx.session.step = "awaitingRecipientEmail";
}

// --- Input handlers for Send to Email ---
export async function handleRecipientEmailInput(ctx: MyContext) {
  // Guard clause: Check if ctx.message is a TextMessage
  const messageText = getMessageText(ctx);
  if (!messageText) {
    ctx.reply("Please enter an email address");
    return;
  }

  if (!isValidEmail(messageText)) {
    return ctx.reply("Invalid email format. Please enter a valid email address.");
  }
  ctx.session.recipientEmail = messageText;
  ctx.reply("Enter the amount:");
  ctx.session.step = "awaitingAmount";
}
export async function handleAmountInput(ctx: MyContext) {
  // Guard clause: Check if ctx.message is a TextMessage
  const messageText = getMessageText(ctx);
  if (!messageText) {
    ctx.reply("Please enter the amount");
    return;
  }

  const amount = messageText;

  // Check by converting only temporarily
  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    return ctx.reply("Invalid amount. Please enter a positive number.");
  }

  ctx.reply("Enter the currency (e.g., USD):");
  ctx.session.step = "awaitingCurrency";
  // Store original amount temporarily for display purposes ONLY.
  ctx.session.amount = amount;
}
export async function handleCurrencyInput(ctx: MyContext) {
  // Guard clause: Check if ctx.message is a TextMessage
  const messageText = getMessageText(ctx);
  if (!messageText) {
    ctx.reply("Please enter a currency");
    return;
  }

  const unsafeCurrency = messageText;
  const currency = escapeInput(unsafeCurrency).toUpperCase();

  if (currency != "USD") {
    return ctx.reply("Invalid currency. Only USD is accepted at the moment");
  }

  // --- Confirmation Step (send_email) ---
  const token = ctx.session.tokenData!.token;
  const email = ctx.session.recipientEmail!;
  const originalAmount = ctx.session.amount!; // Original, unscaled amount (for display only)
  const currencyStr = currency;
  const purposeCode = "self";

  // --- Get the correct decimals value ---
  try {
    const wallets: WalletsResponse = await getWalletBalances(token);
    let decimals = 0; // Default value
    let found = false;
    for (const wallet of wallets) {
      for (const balance of wallet.balances) {
        //Use toUpperCase for comparison.
        if (balance.symbol.toUpperCase() === currencyStr.toUpperCase()) {
          decimals = balance.decimals;
          found = true;
          break; // Exit inner loop
        }
      }
      if (found) break; //Exit outer loop.
    }

    if (!found) {
      return ctx.reply("You don't have a balance in the selected currency.");
    }

    // --- Convert amount to correct format ---
    const numericAmount = Number(originalAmount); // Convert to number for calculation
    const scaledAmount = String(Math.round(numericAmount * 10 ** decimals)); // Multiply, round, and convert back to string

    // *** Store the SCALED amount in the session ***
    ctx.session.amount = scaledAmount;

    ctx.session.pendingTransaction = {
      type: "sendemail",
      token,
      email,
      amount: scaledAmount, // Use the scaled amount here
      currency: currencyStr,
      purposeCode,
    };

    const confirmationMessage = `
Confirm Transaction:
Type: Send to Email
Recipient: ${escapeInput(email)}
Amount: ${escapeInput(String(originalAmount))} ${escapeInput(currencyStr)}
`; // Show original amount to the user

    ctx.reply(
      confirmationMessage,
      Markup.inlineKeyboard([
        Markup.button.callback("Confirm", "confirm_transaction"),
        Markup.button.callback("Cancel", "cancel_transaction"),
      ]),
    );
    ctx.session.step = "idle";
  } catch (error) {
    handleApiError(ctx, error);
    ctx.session.step = "idle";
  }
}

// --- Send to Wallet ---
export async function handleSendWallet(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;
  ctx.reply("Enter the recipient wallet address:");
  ctx.session.step = "awaitingWalletAddress";
}

// --- Input handlers for Send to Wallet ---
export async function handleWalletAddressInput(ctx: MyContext) {
  const messageText = getMessageText(ctx);
  if (!messageText) {
    ctx.reply("Please enter a wallet address");
    return;
  }

  const walletAddress = messageText;

  // Basic validation (could add network-specific validation)
  if (!/^[a-zA-Z0-9]+$/.test(walletAddress)) {
    return ctx.reply("Invalid wallet address format.");
  }

  ctx.session.recipientWalletAddress = messageText;
  ctx.reply("Enter the amount:");
  ctx.session.step = "awaitingWalletAmount";
}
export async function handleWalletAmountInput(ctx: MyContext) {
  const messageText = getMessageText(ctx);
  if (!messageText) {
    ctx.reply("Please enter an amount");
    return;
  }

  const amount = messageText;

  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    // Check by converting
    return ctx.reply("Invalid amount. Please enter a positive number.");
  }
  ctx.session.amount = amount;
  ctx.reply("Enter the currency (e.g., USDC):");
  ctx.session.step = "awaitingWalletCurrency";
}
export async function handleWalletCurrencyInput(ctx: MyContext) {
  ctx.reply("Placeholder for wallet currency input.");
  ctx.session.step = "idle";
}

export async function handleLast10Transactions(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;
  ctx.reply("Last 10 transactions (placeholder).");
}
