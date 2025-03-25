// Withdrawal commands
import { Context } from "telegraf";
import { MyContext } from "../bot";
import { sendLoadingMessage } from "../utils/helpers";
import { getBankAccount, getWalletBalance } from "../api";

export async function handleWithdraw(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;
  ctx.reply("This feature is currently in development");
  return;
  sendLoadingMessage(ctx, "Fetching wallet balance...");

  const bankAccount = await getBankAccount(token);
  console.log(bankAccount);

  const balance = await getWalletBalance(token);
  console.log(balance);

  let message = `Your balance: ${balance.balance}\n\n`;
  message += "Enter the amount you want to withdraw";

  ctx.reply(message);
  ctx.session.step = "awaitingWithdrawalAmount";
}

export async function handleWithdrawalAmountInput(ctx: MyContext) {
  ctx.session.step = "awaitingBankAccountId";
}

export async function handleBankAccountIdInput(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;
  sendLoadingMessage(ctx, "Fetching bank account details...");

  const bankAccount = await getBankAccount(token);
  console.log(bankAccount);

  ctx.reply("bank fetched");

  ctx.session.step = "idle";
}

export async function handleWithdrawalCurrencyInput(ctx: MyContext) {
  ctx.reply("Enter the purpose code (e.g., self)");
  // ctx.session.step = "awaitingWithdrawalPurposeCode";
}
