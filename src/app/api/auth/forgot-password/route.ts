import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { generateSecureToken, hashToken } from "@/lib/encryption";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimiters } from "@/lib/rateLimit";
import { ok, badRequest, tooManyRequests, serverError } from "@/lib/response";
import { z } from "zod";

const forgotSchema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const rl = rateLimiters.passwordReset(req);
  if (!rl.success) return tooManyRequests();

  try {
    const body = await req.json();
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid email");

    await connectDB();

    const user = await User.findOne({ email: parsed.data.email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return ok({ message: "If an account exists with this email, you will receive a reset link." });
    }

    const token = generateSecureToken(32);
    const hashedToken = hashToken(token);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await sendPasswordResetEmail({ to: user.email, name: user.displayName, token });

    return ok({ message: "If an account exists with this email, you will receive a reset link." });
  } catch (err) {
    console.error("Forgot password error:", err);
    return serverError();
  }
}
