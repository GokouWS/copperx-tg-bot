// Withdrawal commands
import { Context } from "telegraf";
import { MyContext } from "../bot";

export async function handleWithdraw(ctx: MyContext) {
  ctx.reply("Enter the bank account ID you want to withdraw to");
  ctx.session.step = "awaitingBankAccountId";
}

export async function handleBankAccountIdInput(ctx: MyContext) {
  ctx.reply("Enter the amount you want to withdraw");
  ctx.session.step = "awaitingWithdrawalAmount";
}

export async function handleWithdrawalAmountInput(ctx: MyContext) {
  ctx.reply("Enter the currency (e.g., USD)");
  ctx.session.step = "awaitingWithdrawalCurrency";
}

export async function handleWithdrawalCurrencyInput(ctx: MyContext) {
  ctx.reply("Enter the purpose code (e.g., self)");
  ctx.session.step = "awaitingWithdrawalPurposeCode";
}
