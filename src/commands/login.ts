// Login commands
import { Context } from "telegraf";
import { initializeUserSession, MyContext } from "../bot";
import {
  authenticateEmailOtp,
  getKycStatus,
  getUserProfile,
  requestEmailOtp,
} from "../api";
import {
  escapeInput,
  getMessageText,
  isValidEmail,
  sendLoadingMessage,
} from "../utils/helpers";
import { handleApiError } from "../utils/errorHandler";
import { buildMenu } from "../utils/menu";
import * as start from "./start";
import { UserProfile } from "../types";

// // Function to escape MarkdownV2 reserved characters *specifically within a URL*
// function escapeMarkdownV2Url(url: string): string {
//   // Only escape characters that are special *inside* a Markdown URL
//   return url.replace(/[()]/g, "\\$&");
// }

/**
 * Handler for the /login command.
 * Asks the user to enter their Copperx email address.
 * Sets the session to "awaitingEmail".
 */
export async function handleLogin(ctx: MyContext) {
  ctx.reply("Please enter your Copperx email address:");
  ctx.session.step = "awaitingEmail"; // Use context session
}

export async function handleEmailInput(ctx: MyContext) {
  // Guard clause: Check if ctx.message is a TextMessage
  const messageText = getMessageText(ctx);
  if (!messageText) {
    ctx.reply("Please enter your email as text.");
    return;
  }

  if (!isValidEmail(messageText)) {
    return ctx.reply("Invalid email format. Please enter a valid email address.");
  }

  const email = messageText;

  try {
    sendLoadingMessage(ctx, "Requesting OTP");
    const otpRequestResult = await requestEmailOtp(email);
    ctx.reply("An OTP has been sent to your email. Please enter the OTP:");
    ctx.session.email = email; // Store email for OTP verification
    // Store sid if it was in the response, otherwise generate one
    const sid = otpRequestResult.sid;
    ctx.session.sid = sid; // Store the sid
    ctx.session.step = "awaitingOtp";
  } catch (emailError) {
    handleApiError(ctx, emailError);
    ctx.session.step = "idle"; // reset state
  }
}

/**
 * Handles the OTP input during the login process.
 *
 * This function validates the OTP format, checks session data,
 * and authenticates the OTP. Upon successful authentication,
 * it initializes the user session, fetches the user profile,
 * and checks the KYC status. If the KYC is approved, the user
 * can access all features. Otherwise, instructs the user to
 * complete KYC on the Copperx platform.
 *
 * @param ctx - The Telegram bot context, which includes session data
 * and functions for interacting with the Telegram API.
 */
export async function handleOtpInput(ctx: MyContext) {
  const menu = buildMenu(ctx);
  // Guard clause: check if ctx.message is a TextMessage
  const messageText = getMessageText(ctx); // Use the helper!
  if (!messageText) {
    ctx.reply("Please enter the OTP as text.");
    return;
  }
  const unsafeOtp = messageText;
  const otp = escapeInput(unsafeOtp);

  if (!/^\d{6}$/.test(otp)) {
    return ctx.reply("Invalid OTP format, Please enter a 6 digit OTP");
  }

  // Guard clause: Check if email is in the session
  if (!ctx.session.email || !ctx.session.sid) {
    ctx.reply("Your session seems to have expired. Please login again", menu);
    ctx.session.step = "idle";
    return;
  }

  const email = ctx.session.email;
  const sid = ctx.session.sid;

  try {
    sendLoadingMessage(ctx, "Authenticating OTP");
    const authResult = await authenticateEmailOtp(email, otp, sid);
    const token = authResult.accessToken;
    const expireAt = new Date(authResult.expireAt).getTime();

    // --- Initialize User Session (Pusher) ---
    // --- Get User Profile ---
    const userProfile = await handleFetchProfile(ctx, token);

    // Store the entire auth result in the session
    ctx.session.tokenData = { token, expireAt }; // Store for use in middleware
    // ctx.reply("Login successful!");

    // console.log(userProfile);
    // if (!userProfile.firstName) {
    //   ctx.reply(`Welcome back, you are now logged in as ${userProfile.email}!`, menu);
    // } else {
    //   ctx.reply(
    //     `Welcome back, ${userProfile.firstName} ${userProfile.lastName ?? ""}!`,
    //     menu,
    //   );
    // }

    const kycStatus = await getKycStatus(token);
    console.log("KYC Status:", kycStatus);
    ctx.session.kycStatus = kycStatus.data[0].status;
    if (kycStatus.data[0].status === "approved") {
      ctx.reply("Your KYC is approved. You can now use all features.");
    } else {
      //TODO find out why escaping characters isn't working properly in template literals
      // Escape the URL for MarkdownV2 *before* putting it in the link
      // const kycUrl = "https://payout\\.copperx\\.io/app/kyc";
      // const escapedKycUrl = escapeMarkdownV2Url(kycUrl); // Escape the URL
      // const kycLink = `[Copperx platform](${kycUrl})`;
      // const message = `Your KYC is not approved\\. Please complete your KYC on the ${kycLink}.`;
      // ctx.reply(message, {
      //   parse_mode: "MarkdownV2",
      // });
      let message =
        "Your KYC is not approved\\. Some features may not be available\\.\n\n";
      message +=
        "Please complete your KYC on the [Copperx platform](https://payout\\.copperx\\.io/app/)";
      ctx.replyWithMarkdownV2(message);
    }
    ctx.session.step = "idle";
    ctx.session.context = {};

    // *** Call handleStart to refresh the menu ***
    await start.handleStart(ctx); // Simulate a /start command
  } catch (error) {
    handleApiError(ctx, error);
    ctx.session.step = "idle";
  }
}

/**
 * Fetches the user profile using the provided token and initializes the user session.
 *
 * This function retrieves the user profile associated with the given token
 * and stores specific fields in the session. It also sets up deposit notifications
 * if the organization ID is valid.
 *
 * @param {MyContext} ctx - The Telegram bot context, which includes session data
 * and functions for interacting with the Telegram API.
 * @param {string} [token] - Optional JWT token used for authentication. If not
 * provided, the function uses the token from the session.
 * @returns {Promise<UserProfile | undefined>} - The user profile data if successful,
 * otherwise undefined if an error occurs or if the organization ID is missing.
 * @throws {Error} - If the chat ID is undefined.
 */
export async function handleFetchProfile(ctx: MyContext, token?: string) {
  if (token === undefined) token = ctx.session.tokenData!.token;

  const chatId = ctx.chat?.id;
  if (chatId === undefined) {
    throw new Error("Chat ID is undefined");
  }

  try {
    const userProfile = await getUserProfile(token);
    const organizationId = userProfile.organizationId;

    if (!organizationId) {
      await ctx.reply("Could not retrieve organization ID. Please contact support.");
      return; // Exit if organization ID is missing
    }
    // console.log(userProfile);
    initializeUserSession(chatId, token, organizationId);
    // ctx.reply("Profile fetched", buildMenu(ctx));
    return userProfile;
  } catch (error) {
    handleApiError(ctx, error);
  }
}

/**
 * Displays the user profile associated with the given token.
 *
 * This function retrieves the user profile data and formats it into a
 * Markdown-formatted string. It then sends the formatted message to the
 * user, along with the main menu.
 *
 * @param {MyContext} ctx - The Telegram bot context, which includes session data
 * and functions for interacting with the Telegram API.
 * @throws {Error} - If an error occurs while fetching the user profile or
 * displaying the message.
 */
export async function handleDisplayProfile(ctx: MyContext) {
  const token = ctx.session.tokenData!.token;
  const menu = buildMenu(ctx);

  try {
    const userProfile = await handleFetchProfile(ctx);
    const message = formatProfileMessage(userProfile);
    await ctx.reply(message, menu);
    // await ctx.reply("Profile fetched", menu);
  } catch (error) {
    handleApiError(ctx, error);
  }
}

/**
 * Formats a user profile into a human-readable string.
 *
 * Constructs a message containing the user's profile details including
 * their ID, full name, email, KYC status, and account type. The message
 * is formatted with line breaks for readability and includes emojis
 * to enhance the user interface.
 *
 * @param {UserProfile} userProfile - The user's profile data containing
 * fields such as id, firstName, lastName, email, status, and type.
 * @returns {string} A formatted string representing the user's profile details.
 */
function formatProfileMessage(userProfile: UserProfile): any {
  const id = userProfile.id || "";
  const firstName = userProfile.firstName || "";
  const lastName = userProfile.lastName || "";
  const email = userProfile.email || "";
  const status = userProfile.status || "";
  const accountType = userProfile.type;

  let message = "👤 Your Profile\n\n";
  message += `User ID: ${id}\n`;
  message += firstName && lastName ? `Name: ${firstName} ${lastName}\n` : "";
  message += `Email: ${email}\n`;
  message += `KYC Status: ${status}\n\n`;
  message += `Account Type: ${accountType}`;

  return message;
}
