// Login commands
import { Context } from "telegraf";
import { MyContext } from "../bot";

export async function handleLogin(ctx: MyContext) {
  ctx.reply("Please enter your Copperx email address:");
  ctx.session.step = "awaitingEmail"; // Use context session
}

export async function handleEmailInput(ctx: MyContext) {
  // Placeholder for email handling logic
  ctx.reply("Email received (placeholder).");
  ctx.session.step = "idle"; // Reset
}

export async function handleOtpInput(ctx: MyContext) {
  // Placeholder for OTP handling logic
  ctx.reply("OTP received (placeholder).");
  ctx.session.step = "idle";
}
