// Login commands
import { Context } from "telegraf";
import { MyContext } from "../bot";
import {
  authenticateEmailOtp,
  getKycStatus,
  getUserProfile,
  requestEmailOtp,
} from "../api";
import { escapeInput } from "../utils/helpers";
import { handleApiError } from "../utils/errorHandler";

// // Function to escape MarkdownV2 reserved characters *specifically within a URL*
// function escapeMarkdownV2Url(url: string): string {
//   // Only escape characters that are special *inside* a Markdown URL
//   return url.replace(/[()]/g, "\\$&");
// }

// Function to validate email format.
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function handleLogin(ctx: MyContext) {
  ctx.reply("Please enter your Copperx email address:");
  ctx.session.step = "awaitingEmail"; // Use context session
}

export async function handleEmailInput(ctx: MyContext) {
  // Guard clause: Check if ctx.message is a TextMessage
  if (!ctx.message || !("text" in ctx.message)) {
    ctx.reply("Please enter your email as text.");
    return; // Exit early
  }

  const messageText = ctx.message.text;

  if (!isValidEmail(messageText)) {
    return ctx.reply("Invalid email format. Please enter a valid email address.");
  }

  const email = messageText;

  try {
    const otpRequestResult = await requestEmailOtp(email);
    ctx.reply("An OTP has been sent to your email. Please enter the OTP:");
    ctx.session.email = email; // Store email for OTP verification
    ctx.session.sid = otpRequestResult.sid;
    ctx.session.step = "awaitingOtp";
  } catch (emailError) {
    handleApiError(ctx, emailError);
    ctx.session.step = "idle"; // reset state
  }
}

export async function handleOtpInput(ctx: MyContext) {
  // Guard clause: check if ctx.message is a TextMessage
  if (!ctx.message || !("text" in ctx.message)) {
    ctx.reply("Please enter the OTP as text.");
    return;
  }
  const messageText = ctx.message.text;
  const unsafeOtp = messageText;
  const otp = escapeInput(unsafeOtp);

  if (!/^\d{6}$/.test(otp)) {
    return ctx.reply("Invalid OTP format, Please enter a 6 digit OTP");
  }

  // Guard clause: Check if email is in the session
  if (!ctx.session.email || !ctx.session.sid) {
    ctx.reply("Your session seems to have expired. Please start again with /login.");
    ctx.session.step = "idle";
    return;
  }

  const email = ctx.session.email;
  const sid = ctx.session.sid;

  try {
    const authResult = await authenticateEmailOtp(email, otp, sid);
    const token = authResult.accessToken;
    const expireAt = new Date(authResult.expireAt).getTime();

    // Store the entire auth result in the session
    ctx.session.tokenData = { token, expireAt };
    ctx.reply("Login successful!");

    const userProfile = await getUserProfile(token);
    // console.log(userProfile);
    if (!userProfile.firstName) {
      ctx.reply(`Welcome, you are now logged in as ${userProfile.email}!`);
    } else {
      ctx.reply(`Welcome, ${userProfile.firstName} ${userProfile.lastName ?? ""}!`);
    }

    const kycStatus = await getKycStatus(token);
    if (kycStatus.length > 0 && kycStatus[0].status === "approved") {
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
      ctx.reply(
        "Your KYC is not approved\\. Please complete your KYC on the [Copperx platform](https://payout\\.copperx\\.io/app/)",
        {
          parse_mode: "MarkdownV2",
        },
      );
    }
    ctx.session.step = "idle";
  } catch (error) {
    handleApiError(ctx, error);
    ctx.session.step = "idle";
  }
}
