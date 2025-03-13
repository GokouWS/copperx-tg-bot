// Login commands
import { Context } from "telegraf";

export async function handleLogin(ctx: Context) {
  ctx.reply("Please enter your Copperx email address:");
  ctx.session.step = "awaitingEmail"; // Use context session
}

export async function handleEmailInput(ctx: Context) {
  // Placeholder for email handling logic
  ctx.reply("Email received (placeholder).");
  ctx.session.step = "idle"; // Reset
}

export async function handleOtpInput(ctx: Context) {
  // Placeholder for OTP handling logic
  ctx.reply("OTP received (placeholder).");
  ctx.session.step = "idle";
}
