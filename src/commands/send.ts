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
import {
  escapeInput,
  getCallbackQueryData,
  getMessageText,
  isValidEmail,
  supportedCurrencies,
} from "../utils/helpers";
import { WalletsResponse } from "../types";
import { buildSendMenu, cancelButton } from "../utils/menu";

export async function handleSend(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;
  const menu = buildSendMenu(ctx);

  ctx.reply(
    "What do you want to do? /sendemail, /sendwallet or view your /last10transactions",
    menu,
  );
}

// --- Send to Email ---
export async function handleSendEmail(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;
  sendReplyMessage(ctx, "Email", "email");

  ctx.session.step = "awaitingRecipientEmail";
}

// --- Input handlers for Send to Email ---
export async function handleRecipientEmailInput(ctx: MyContext) {
  // Guard clause: Check if ctx.message is a TextMessage
  const messageText = getMessageText(ctx);
  if (!messageText) {
    sendReplyMessage(ctx, "Email", "emailEmpty");

    return;
  }

  if (!isValidEmail(messageText)) {
    sendReplyMessage(ctx, "Email", "emailInvalid");
    return;
  }
  ctx.session.recipientEmail = messageText;
  sendReplyMessage(ctx, "Email", "amount");

  ctx.session.step = "awaitingAmount";
}

export async function handleAmountInput(ctx: MyContext) {
  // Guard clause: Check if ctx.message is a TextMessage
  const messageText = getMessageText(ctx);
  if (!messageText) {
    sendReplyMessage(ctx, "Email", "amountEmpty");

    return;
  }

  const amount = messageText;

  // Check by converting only temporarily
  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    sendReplyMessage(ctx, "Email", "amountInvalid");
    return;
  }

  sendReplyMessage(ctx, "Email", "currency");

  ctx.session.step = "awaitingCurrency";
  // Store original amount temporarily for display purposes ONLY.
  ctx.session.emailAmount = amount;
}

export async function handleCurrencySelection(ctx: MyContext) {
  const callbackData = getCallbackQueryData(ctx);
  if (!callbackData) {
    return;
  }

  if (!callbackData.startsWith("select_currency:")) {
    // Handle unexpected callback data (good practice)
    await ctx.answerCbQuery("Invalid currency selection.");
    return;
  }

  const currency = callbackData.split(":")[1];
  ctx.session.currency = currency;

  await ctx.answerCbQuery(`You selected: ${currency}`); // Acknowledge

  // --- Confirmation Step (sendemail) ---
  const token = ctx.session.tokenData!.token;
  const email = ctx.session.recipientEmail!; // Now guaranteed to exist by prior steps
  const originalAmount = ctx.session.emailAmount!; // Original amount for display
  const currencyStr = ctx.session.currency; //For clarity
  const purposeCode = "self";

  // --- Get the correct decimals value ---
  try {
    const wallets: WalletsResponse = await getWalletBalances(token);
    let decimals = 0; // Default value
    let found = false;
    for (const wallet of wallets) {
      for (const balance of wallet.balances) {
        if (balance.symbol.toUpperCase() === currencyStr.toUpperCase()) {
          decimals = balance.decimals;
          found = true;
          break; // Exit inner loop
        }
      }
      if (found) break; //Exit outer loop.
    }

    if (!found) {
      return ctx.editMessageText("You don't have a balance in the selected currency."); // Use editMessageText
    }

    // --- Convert amount to correct format ---
    const numericAmount = Number(originalAmount); // Convert to number for calculation
    const scaledAmount = String(Math.round(numericAmount * 10 ** decimals)); // Multiply, round, and convert back to string

    // *** Store the SCALED amount in the session ***
    ctx.session.pendingTransaction = {
      type: "sendemail",
      token,
      email,
      amount: scaledAmount, // Use scaled amount here
      currency: currencyStr,
      purposeCode,
    };

    const confirmationMessage = `
Confirm Transaction:
Type: Send to Email
Recipient: ${escapeInput(email)}
Amount: ${escapeInput(originalAmount)} ${escapeInput(currencyStr)}
        `;

    ctx.editMessageText(confirmationMessage, {
      // Use editMessageText to replace buttons
      parse_mode: "MarkdownV2",
      ...Markup.inlineKeyboard([
        Markup.button.callback("✅ Confirm", "confirm_transaction"),
        Markup.button.callback("🚫 Cancel", "cancel_transaction"),
      ]).reply_markup, // Get just the reply_markup
    });
    ctx.session.step = "idle"; // Reset after confirmation
    ctx.session.context = {};
  } catch (error) {
    handleApiError(ctx, error);
    ctx.session.step = "idle"; // Reset step on error
    ctx.session.context = {};
  }
}

// --- Send to Wallet ---
export async function handleSendWallet(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;

  sendReplyMessage(ctx, "Wallet", "wallet");

  ctx.session.step = "awaitingWalletAddress";
}

// --- Input handlers for Send to Wallet ---
export async function handleWalletAddressInput(ctx: MyContext) {
  const messageText = getMessageText(ctx);
  if (!messageText) {
    sendReplyMessage(ctx, "Wallet", "walletEmpty");
    return;
  }

  const walletAddress = messageText;

  // Basic validation (could add network-specific validation)
  if (!/^[a-zA-Z0-9]+$/.test(walletAddress)) {
    sendReplyMessage(ctx, "Wallet", "walletInvalid");
    return;
  }

  ctx.session.recipientWalletAddress = messageText;

  sendReplyMessage(ctx, "Wallet", "amount");

  ctx.session.step = "awaitingWalletAmount";
}

export async function handleWalletAmountInput(ctx: MyContext) {
  const messageText = getMessageText(ctx);
  if (!messageText) {
    sendReplyMessage(ctx, "Wallet", "amountEmpty");
    return;
  }

  const amount = messageText;

  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    // Check by converting
    sendReplyMessage(ctx, "Wallet", "amountInvalid");
    return;
  }
  ctx.session.walletAmount = amount;

  sendReplyMessage(ctx, "Wallet", "currency");

  ctx.session.step = "awaitingWalletCurrency";
}

export async function handleLast10Transactions(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;
  try {
    const transactions = await getLast10Transactions(token);
    console.log("Last 10 Transactions:", transactions);
    if (transactions.count === 0) {
      return ctx.reply("You don't have any transactions yet.");
    }
    let message = "Your Last 10 Transactions:\n\n";
    for (const transaction of transactions.data) {
      const direction = transaction.direction;
      const status = transaction.status;
      const amount = transaction.emailAmount;
      const currency = transaction.currency;
      message += `${escapeInput(direction)}: ${escapeInput(String(amount))} ${escapeInput(currency)} \\- ${escapeInput(status)}\n`; // Escape for MarkdownV2
    }
    ctx.reply(message, { parse_mode: "MarkdownV2" });
  } catch (error) {
    handleApiError(ctx, error);
  }
}

function cancelKeyboard(ctx: MyContext) {
  const canelBtn = cancelButton(ctx);
  return Markup.inlineKeyboard([canelBtn], { columns: 1 });
}

function sendReplyMessage(ctx: MyContext, type: string, step: string) {
  console.log(step, type);
  let message = `${type === "Wallet" ? "💸" : "📧"} Send to ${type}:\n\n`;

  // Email step messages
  step === "email" && (message += "Enter the recipient email address:");
  step === "emailEmpty" && (message += "Please enter an email address");
  step === "emailInvalid" &&
    (message += "Invalid email format. Please enter a valid email address.");

  // Wallet step messages
  step === "wallet" && (message += "Enter the recipient wallet address:");
  step === "walletEmpty" && (message += "Please enter a wallet address");
  step === "walletInvalid" && (message += "Invalid wallet address format.");

  // Amount step messages
  step === "amount" && type === "Wallet"
    ? (message += `Wallet Address: ${ctx.session.recipientWalletAddress}\n\n`)
    : step === "amount" &&
      type === "Email" &&
      (message += `Email Address: ${ctx.session.recipientEmail}\n\n`);
  step === "amount" && (message += "Enter the amount:");
  step === "amountEmpty" && (message += "Please enter an amount");
  step === "amountInvalid" &&
    (message += "Invalid amount. Please enter a positive number.");

  // Currency step messages
  step === "currency" && type === "Wallet"
    ? (message += `Transfer Amount: ${ctx.session.walletAmount}\n\n`)
    : step === "currency" &&
      type === "Email" &&
      (message += `Transfer Amount: ${ctx.session.emailAmount}\n\n`);
  step === "currency" && (message += "Choose the currency you want to send in:");

  // Case for selecting currency
  if (step === "currency") {
    const cancelBtn = cancelButton(ctx);
    const currencyButtons = supportedCurrencies.map((currency) =>
      Markup.button.callback(currency, `select_currency:${currency}`),
    );
    const keyboard = Markup.inlineKeyboard([...currencyButtons, cancelBtn], {
      columns: 1,
    });
    return ctx.reply(message, keyboard);
  }

  return ctx.reply(message, cancelKeyboard(ctx));
}
