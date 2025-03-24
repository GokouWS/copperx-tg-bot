import { MyContext } from "../bot";
import * as login from "./login";
import * as send from "./send";
import * as withdraw from "./withdraw";

// Define a type for handler functions
type HandlerFunction = (ctx: MyContext) => Promise<string | void | object>;

// Create a Map for the handlers
export const handlers = new Map<MyContext["session"]["step"], HandlerFunction>([
  [
    "idle",
    async (ctx: MyContext) => {
      /* Do nothing, or send a default message */
    },
  ], // Handled by actions
  ["awaitingEmail", login.handleEmailInput],
  ["awaitingOtp", login.handleOtpInput],
  ["awaitingRecipientEmail", send.handleRecipientEmailInput],
  ["awaitingAmount", send.handleAmountInput],
  [
    "awaitingCurrency",
    async (ctx: MyContext) => {
      /* Do nothing */
    },
  ], // Handled by actions
  ["awaitingWalletAddress", send.handleWalletAddressInput],
  ["awaitingWalletAmount", send.handleWalletAmountInput],
  [
    "awaitingWalletCurrency",
    async (ctx: MyContext) => {
      /* Do nothing */
    },
  ], // Handled by actions
  ["awaitingBankAccountId", withdraw.handleBankAccountIdInput],
  ["awaitingWithdrawalAmount", withdraw.handleWithdrawalAmountInput],
  ["awaitingWithdrawalCurrency", withdraw.handleWithdrawalCurrencyInput],
  [
    "awaitingWalletChoice",
    async (ctx: MyContext) => {
      /* Do nothing */
    },
  ], // Handled by actions
]);
