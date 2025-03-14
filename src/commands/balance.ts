// Balance commands

import { Markup } from "telegraf";
import { getDefaultWallet, getWalletBalances, setDefaultWallet } from "../api";
import { MyContext } from "../bot";
import { Balance, WalletsResponse } from "../types";
import { handleApiError } from "../utils/errorHandler";
import {
  escapeInput,
  getCallbackQueryData,
  validateCallbackQuery,
} from "../utils/helpers";

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
    const wallets: WalletsResponse = await getWalletBalances(token);
    const buttons = wallets.map((wallet) =>
      Markup.button.callback(wallet.walletId, `set_default:${wallet.walletId}`),
    );
    const keyboard = Markup.inlineKeyboard(buttons, { columns: 1 }); // Arrange buttons in 1 column

    ctx.reply("Tap a Wallet ID to set it as your default:", keyboard);
    ctx.session.step = "awaitingWalletChoice"; // Use a more descriptive step name
  } catch (error) {
    handleApiError(ctx, error);
  }
}
export async function handleWalletChoice(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;

  const callbackData = getCallbackQueryData(ctx); // e.g., "set_default:wallet-id-123"
  if (!callbackData) {
    return; // Exit early if validation failed
  }

  if (callbackData.startsWith("set_default:")) {
    const walletId = callbackData.split(":")[1]; // Extract the wallet ID

    try {
      await setDefaultWallet(token, walletId);
      // Acknowledge the button press *and* update the message
      ctx.answerCbQuery(`Default wallet set to ${walletId}`); // Show popup
      ctx.editMessageText(`Default wallet set to ${walletId}`); // Remove buttons
    } catch (error) {
      handleApiError(ctx, error);
      ctx.answerCbQuery("An error occurred."); // Show error in popup
    } finally {
      ctx.session.step = "idle";
    }
  }
}
