// Balance commands

import { getDefaultWallet, getWalletBalances, setDefaultWallet } from "../api";
import { MyContext } from "../bot";
import { Balance, WalletsResponse } from "../types";
import { handleApiError } from "../utils/errorHandler";
import { escapeInput } from "../utils/helpers";

export async function handleBalance(ctx: MyContext) {
  const token = ctx.session.tokenData!.token; // Use non-null assertion

  try {
    const wallets: WalletsResponse = await getWalletBalances(token);

    // Organize balances by network using a Map
    const balancesByNetwork = new Map<string, Balance[]>();
    for (const wallet of wallets) {
      for (const balance of wallet.balances) {
        if (!balancesByNetwork.has(wallet.network)) {
          balancesByNetwork.set(wallet.network, []);
        }
        balancesByNetwork.get(wallet.network)!.push(balance); // Use non-null assertion
      }
    }

    // Construct the message
    let message = "Your Balances:\n\n";
    if (balancesByNetwork.size === 0) {
      message = "You have no Wallets";
    } else {
      for (const [network, balances] of balancesByNetwork) {
        // Escape the network name!
        message += `*${escapeInput(network)}*:\n`;
        for (const balance of balances) {
          // Convert balance to a number and format
          const numericBalance = Number(balance.balance) / 10 ** balance.decimals;
          const formattedBalance = numericBalance.toFixed(balance.decimals);

          // Escape all relevant parts of the message!
          message += `  \\- ${escapeInput(balance.symbol)}: ${escapeInput(formattedBalance)}\n`;
          message += ` Address: \`${balance.address}\`\n\n`;
        }
        message += "\n";
      }
    }

    ctx.reply(message, { parse_mode: "MarkdownV2" }); // Use Markdown for bold network names
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
      let message = "Your Default Wallet:\n\n";
      message += `*${escapeInput(defaultWallet.network)}*:\n`;
      message += `Wallet ID: \`${defaultWallet.id}\`\n`;
      message += `Address: \`${defaultWallet.walletAddress}\` \n\n`;
      message += "Reply with /changedefaultwallet to change your default wallet";
      ctx.reply(message, { parse_mode: "MarkdownV2" });
    }
  } catch (error) {
    handleApiError(ctx, error);
  }
}

export async function handleChangeDefaultWallet(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;

  try {
    const wallets: WalletsResponse = await getWalletBalances(token); // Fetch the wallets to get possible IDs.
    let message =
      "Your Wallets\\:\nPlease reply with the Wallet ID that you want to set as your default:\n\n";

    for (const wallet of wallets) {
      message += `*${escapeInput(wallet.network)}*:\n`;
      message += `Network: ${wallet.network}\n`;
      message += `Wallet ID: \`${wallet.walletId}\`\n\n`;
    }
    ctx.reply(message, { parse_mode: "MarkdownV2" });
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
    const wallets: WalletsResponse = await getWalletBalances(token);
    if (!wallets.some((wallet) => wallet.walletId === walletId)) {
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
