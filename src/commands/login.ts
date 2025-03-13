// Login commands
import { Context } from "telegraf";
import { MyContext } from "../bot";
import { requestEmailOtp } from "../api";
import { escapeInput } from "../utils/helpers";
import { handleAxiosError } from "../utils/errorHandler";

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
    await requestEmailOtp(email);
    ctx.reply("An OTP has been sent to your email. Please enter the OTP:");
    ctx.session.email = email; // Store email for OTP verification
    ctx.session.step = "awaitingOtp";
  } catch (emailError) {
    handleAxiosError(ctx, emailError);
    ctx.session.step = "idle"; // reset state
  }
}

export async function handleOtpInput(ctx: MyContext) {
  // Placeholder for OTP handling logic
  ctx.reply("OTP received (placeholder).");
  ctx.session.step = "idle";
}
