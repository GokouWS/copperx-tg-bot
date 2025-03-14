// Send commands
import { Context, Markup } from "telegraf";
import { sendToEmail, sendToWallet, getLast10Transactions } from "../api";
import { bot, MyContext } from "../bot"; // Correctly import bot and MyContext
import { handleApiError } from "../utils/errorHandler";
import { escapeInput } from "../utils/helpers";

export async function handleSend(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;
  ctx.reply(
    "What do you want to do? /sendemail, /sendwallet or view your /last10transactions",
  );
}

export async function handleSendEmail(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;
  ctx.reply("Enter the recipient email address:");
  ctx.session.step = "awaitingRecipientEmail";
}

export async function handleSendWallet(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;
  ctx.reply("Enter the recipient wallet address:");
  ctx.session.step = "awaitingWalletAddress";
}

export async function handleLast10Transactions(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;
  ctx.reply("Last 10 transactions (placeholder).");
}

// --- Input handlers ---
export async function handleRecipientEmailInput(ctx: MyContext) {
  ctx.reply("Placeholder for email input.");
  ctx.session.step = "idle";
}
export async function handleAmountInput(ctx: MyContext) {
  ctx.reply("Placeholder for amount input.");
  ctx.session.step = "idle";
}
export async function handleCurrencyInput(ctx: MyContext) {
  ctx.reply("Placeholder for currency input.");
  ctx.session.step = "idle";
}

export async function handleWalletAddressInput(ctx: MyContext) {
  ctx.reply("Placeholder for wallet address input.");
  ctx.session.step = "idle";
}
export async function handleWalletAmountInput(ctx: MyContext) {
  ctx.reply("Placeholder for wallet amount input.");
  ctx.session.step = "idle";
}
export async function handleWalletCurrencyInput(ctx: MyContext) {
  ctx.reply("Placeholder for wallet currency input.");
  ctx.session.step = "idle";
}
