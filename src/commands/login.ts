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

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(messageText)) {
    return ctx.reply("Invalid email format. Please enter a valid email address.");
  }

  const email = escapeInput(messageText);

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
    const expiresAt = authResult.expiresAt;

    // Store the entire auth result in the session
    ctx.session.tokenData = { token, expiresAt };
    ctx.reply("Login successful!");

    const userProfile = await getUserProfile(token);
    ctx.reply(`Welcome, ${userProfile.firstName} ${userProfile.lastName}!`);

    const kycStatus = await getKycStatus(token);
    if (kycStatus.length > 0 && kycStatus[0].status === "approved") {
      ctx.reply("Your KYC is approved. You can now use all features.");
    } else {
      ctx.reply(
        "Your KYC is not approved. Please complete your KYC on the Copperx platform.",
      );
    }
    ctx.session.step = "idle";
  } catch (error) {
    handleApiError(ctx, error);
    ctx.session.step = "idle";
  }
}
