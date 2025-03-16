// Deposit notifications
import Pusher from "pusher-js";
import { authenticatePusher } from "../api";
import { bot, MyContext } from "../bot"; // Import bot
import { createApiError } from "../utils/errorHandler";

// Initialize Pusher client with authentication
export async function setupDepositNotifications(
  token: string,
  organizationId: string,
  chatId: number,
) {
  if (!process.env.VITE_PUSHER_KEY || !process.env.VITE_PUSHER_CLUSTER) {
    console.error("Pusher key or cluster not defined in .env");
    return;
  }

  console.log("setting up pusher");

  const pusherClient = new Pusher(process.env.VITE_PUSHER_KEY, {
    cluster: process.env.VITE_PUSHER_CLUSTER,
    authorizer: (channel) => {
      return {
        authorize: async (socketId, callback) => {
          try {
            const authData = await authenticatePusher(token, socketId, channel.name);
            callback(null, authData);
          } catch (error) {
            console.error("Pusher authorization error:", error);
            const apiError = createApiError(error);
            callback(apiError, null);
          }
        },
      };
    },
  });

  // Subscribe to the private channel
  const channel = pusherClient.subscribe(`private-org-${organizationId}`);

  channel.bind("pusher:subscription_succeeded", () => {
    console.log("Successfully subscribed to private channel");
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
        `${data.amount} USDC deposited on ${data.network}`,
      { parse_mode: "MarkdownV2" },
    );
  });

  // Handle unsubscription/disconnect
  return () => {
    pusherClient.unsubscribe(`private-org-${organizationId}`);
    pusherClient.disconnect();
  };
}
