// Deposit notifications
import Pusher from "pusher-js";
import { authenticatePusher } from "../api";
import { bot, MyContext } from "../bot"; // Import bot
import { createApiError } from "../utils/errorHandler";
import { getNetworkName } from "../utils/networks";

// Initialize Pusher client with authentication
export async function setupDepositNotifications(
  token: string,
  organizationId: string,
  chatId: number,
) {
  // console.log(
  //   `setupDepositNotifications called with: organizationId=${organizationId}, chatId=${chatId}`,
  // );

  if (!process.env.VITE_PUSHER_KEY || !process.env.VITE_PUSHER_CLUSTER) {
    console.error("Pusher key or cluster not defined in .env");
    return;
  }

  // console.log("Pusher key:", process.env.VITE_PUSHER_KEY); // Log the key
  // console.log("Pusher cluster:", process.env.VITE_PUSHER_CLUSTER); // Log the cluster

  // console.log("setting up pusher");

  let pusherClient;
  try {
    // Add a try-catch around the Pusher client
    pusherClient = new Pusher(process.env.VITE_PUSHER_KEY, {
      cluster: process.env.VITE_PUSHER_CLUSTER,
      authorizer: (channel) => {
        // console.log(`Authorizer called for channel: ${channel.name}`); // Log when authorizer is called
        return {
          authorize: async (socketId, callback) => {
            // console.log(`Authorize called with socketId: ${socketId}`); // Log when authorize is called
            try {
              const authData = await authenticatePusher(token, socketId, channel.name);
              console.log("Pusher authentication successful.");
              callback(null, { auth: authData.auth });
            } catch (error) {
              console.error("Pusher authorization error:", error);
              const apiError = createApiError(error);
              callback(apiError, null);
            }
          },
        };
      },
      forceTLS: true,
    });
  } catch (error) {
    console.error("Error initializing Pusher client:", error); // Catch initialization errors
    return; // Exit if client creation fails
  }

  //Log the pusher client
  // console.log("Pusher Client", pusherClient);
  pusherClient.connection.bind("state_change", (states: any) => {
    // Added a state change listener
    console.log(
      `Pusher connection state changed: ${states.previous} -> ${states.current}`,
    );
  });
  pusherClient.connection.bind("error", (error: any) => {
    console.error("Pusher connection error:", error);
  });

  let channel;
  try {
    // Add a try-catch for the subscription
    channel = pusherClient.subscribe(`private-org-${organizationId}`);
    // console.log(`Subscribing to channel: private-org-${organizationId}`);
  } catch (error) {
    console.error("Error subscribing to pusher channel:", error);
    return;
  }

  channel.bind("pusher:subscription_succeeded", () => {
    console.log("Successfully subscribed to private channel");
    bot.telegram.sendMessage(
      chatId,
      `📣 *Deposit Notifications Enabled*\n\n` +
        `You will now receive notifications for new deposits\\.`,
      { parse_mode: "MarkdownV2" },
    );
  });

  channel.bind("pusher:subscription_error", (error: any) => {
    console.error("Subscription error:", error);
  });

  // Handle deposit events
  channel.bind("deposit", (data: any) => {
    console.log("deposit event", data);
    bot.telegram.sendMessage(
      chatId,
      `💰 *New Deposit Received*\n\n` +
        `${data.amount} USDC deposited on ${getNetworkName(data.network)}`,
      { parse_mode: "MarkdownV2" },
    );
  });

  // Handle unsubscription/disconnect
  return () => {
    pusherClient.unsubscribe(`private-org-${organizationId}`);
    pusherClient.disconnect();
  };
}
