// Balance commands

import { getDefaultWallet, getWalletBalances, setDefaultWallet } from "../api";
import { MyContext } from "../bot";
import { handleApiError } from "../utils/errorHandler";
import { escapeInput } from "../utils/helpers";

export async function handleBalance(ctx: MyContext) {
  const token = ctx.session.tokenData!.token; // Use non-null assertion

  try {
    const balances = await getWalletBalances(token);
    let message = "Your Balances:\n";
    for (const balance of balances) {
      message += `${balance.availableBalance} ${balance.symbol} on ${balance.network}\n`;
    }
    ctx.reply(message);
  } catch (error) {
    handleApiError(ctx, error);
  }
}

export async function handleDefaultWallet(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;

  try {
    const defaultWallet = await getDefaultWallet(token);

    if (!defaultWallet) {
      return ctx.reply(
        "You have no default wallet set. Please choose from the options to set a default wallet, or type /cancel to cancel:",
      );
    } else {
      let message = "Your Default Wallet:\n";
      message += `${defaultWallet.address} on ${defaultWallet.network} \n`;
      ctx.reply(
        message + "Reply with /change_default_wallet to change your default wallet",
      );
    }
  } catch (error) {
    handleApiError(ctx, error);
  }
}

export async function handleChangeDefaultWallet(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;

  try {
    const balances = await getWalletBalances(token); // Fetch the wallets to get possible IDs.
    let message =
      "Your Wallets. Please reply with the Wallet ID that you want to set as your default:\n";

    for (const balance of balances) {
      message += `${balance.walletId}:  ${balance.availableBalance} ${balance.symbol} on ${balance.network}\n`;
    }
    ctx.reply(message);
    ctx.session.step = "awaitingWalletId"; // Set session step
  } catch (error) {
    handleApiError(ctx, error);
  }
}
export async function handleWalletIdInput(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;

  if (!ctx.message || !("text" in ctx.message)) {
    ctx.reply("Please enter the wallet ID as text");
    return;
  }
  const unsafeWalletId = ctx.message.text;
  const walletId = escapeInput(unsafeWalletId); // Basic escaping

  try {
    const balances = await getWalletBalances(token);
    // TODO look at return from api and add a type for it
    if (!balances.some((balance: any) => balance.walletId === walletId)) {
      return ctx.reply("Invalid wallet ID.");
    }
  } catch (error) {
    return ctx.reply("An error occurred while validating wallet id.");
  }

  try {
    await setDefaultWallet(token, walletId); // Set default wallet.
    ctx.reply(`Default wallet set to ${walletId}`);
  } catch (error) {
    handleApiError(ctx, error);
  } finally {
    ctx.session.step = "idle"; // Reset state
  }
}
