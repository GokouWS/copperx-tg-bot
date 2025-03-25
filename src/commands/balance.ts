// Balance commands

import { Markup } from "telegraf";
import { getDefaultWallet, getWalletBalances, setDefaultWallet } from "../api";
import { MyContext } from "../bot";
import { Balance, WalletsResponse } from "../types";
import { handleApiError } from "../utils/errorHandler";
import {
  escapeInput,
  getCallbackQueryData,
  sendLoadingMessage,
  validateCallbackQuery,
} from "../utils/helpers";
import { buildMenu, cancelButton } from "../utils/menu";
import { getNetworkName } from "../utils/networks";

/**
 * Handle the /balance command.
 *
 * Loads the user's current wallet balances and sends a message with the formatted balances.
 * The balances are grouped by network and include the network name.
 * If the user has no wallets, a message is sent indicating that.
 * @param ctx Context with session data and functions for interacting with the Telegram API.
 */
export async function handleBalance(ctx: MyContext) {
  const token = ctx.session.tokenData!.token; // Use non-null assertion

  sendLoadingMessage(ctx, "Loading your balances");

  const menu = buildMenu(ctx);

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
        message += `⚪️ *${escapeInput(getNetworkName(network))}*:\n`;
        for (const balance of balances) {
          // Convert balance to a number and format
          const numericBalance = Number(balance.balance);
          const formattedBalance = numericBalance.toFixed(balance.decimals);

          // Escape all relevant parts of the message!
          message += ` ${escapeInput(balance.symbol)}: ${escapeInput(formattedBalance)}\n\n`;
        }
      }
    }

    ctx.replyWithMarkdownV2(message, menu); // Use Markdown for bold network names
  } catch (error) {
    handleApiError(ctx, error);
  }
}

/**
 * Handles the /defaultwallet command.
 *
 * Retrieves the user's default wallet, if any, and sends a message with the formatted default wallet information.
 * If the user has no default wallet set, a message is sent indicating that and providing instructions for setting one.
 * @param ctx Context with session data and functions for interacting with the Telegram API.
 */
export async function handleDefaultWallet(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;

  sendLoadingMessage(ctx, "Loading your default wallet");

  const menu = buildMenu(ctx);

  try {
    const defaultWallet = await getDefaultWallet(token);

    if (!defaultWallet) {
      return ctx.reply(
        "You have no default wallet set. Please choose from the options to set a default wallet, or type /cancel to cancel:",
      );
    } else {
      let message = "Your Default Wallet:\n\n";
      message += `*${escapeInput(getNetworkName(defaultWallet.network))}*:\n`;
      message += `Wallet ID: \`${defaultWallet.id}\`\n`;
      message += `Address: \`${defaultWallet.walletAddress}\` \n\n`;
      message += "Reply with /changedefaultwallet to change your default wallet";
      ctx.replyWithMarkdownV2(message, menu);
    }
  } catch (error) {
    handleApiError(ctx, error);
  }
}

/**
 * Handles the /changedefaultwallet command.
 *
 * Retrieves the user's list of wallets, and sends a message with an inline keyboard menu containing the wallet IDs.
 * The user can then choose a wallet ID to set as their default wallet.
 * @param ctx Context with session data and functions for interacting with the Telegram API.
 */
export async function handleChangeDefaultWallet(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;

  sendLoadingMessage(ctx, "Retrieving list of your Wallets");

  try {
    const wallets: WalletsResponse = await getWalletBalances(token);
    const buttons = wallets.map((wallet) =>
      Markup.button.callback(
        // if is default show green circle, if not show white circle
        `${wallet.isDefault ? "🟢 " : ""}${getNetworkName(wallet.network)}: ${wallet.walletId}`,
        `set_default:${wallet.walletId}`,
      ),
    );

    const cancelBtn = cancelButton(ctx);
    buttons.push(cancelBtn);
    const keyboard = Markup.inlineKeyboard(buttons, { columns: 1 }); // Arrange buttons in 1 column

    ctx.reply("Choose a Wallet ID to set as your default:", keyboard);
    ctx.session.step = "awaitingWalletChoice"; // Use a more descriptive step name
  } catch (error) {
    handleApiError(ctx, error);
  }
}
/**
 * Handles the user's choice of default wallet.
 *
 * This function processes the callback query data when a user selects a wallet
 * to set as their default. It extracts the wallet ID from the callback data and
 * attempts to set it as the default wallet using an API request. If successful,
 * it acknowledges the user's action with a confirmation message. In case of an
 * error, an appropriate error message is displayed. The session step is set to "idle"
 * after processing.
 *
 * @param ctx - The Telegram bot context, which includes session data and functions
 *              for interacting with the Telegram API.
 */
export async function handleWalletChoice(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;
  sendLoadingMessage(ctx, "Setting your default wallet");
  const menu = buildMenu(ctx);

  const callbackData = getCallbackQueryData(ctx); // e.g., "set_default:wallet-id-123"
  if (!callbackData) {
    return; // Exit early if validation failed
  }

  if (callbackData.startsWith("set_default:")) {
    const walletId = callbackData.split(":")[1]; // Extract the wallet ID

    try {
      await setDefaultWallet(token, walletId);
      // Acknowledge the button press *and* update the message
      ctx.answerCbQuery(`🟢 Default wallet set to ${walletId}`); // Show popup
      ctx.reply(`🟢 Default wallet set to ${walletId}`, menu); // Remove buttons
    } catch (error) {
      handleApiError(ctx, error);
      ctx.answerCbQuery("An error occurred."); // Show error in popup
    } finally {
      ctx.session.step = "idle";
    }
  }
}
