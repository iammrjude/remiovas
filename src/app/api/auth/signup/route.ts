import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { generateWallet } from "@/lib/stellar";
import { generateSecureToken, hashToken } from "@/lib/encryption";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimiters } from "@/lib/rateLimit";
import { created, badRequest, conflict, tooManyRequests, serverError } from "@/lib/response";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_-]+$/, "Username can only contain lowercase letters, numbers, underscores and hyphens"),
  displayName: z.string().min(2).max(60).trim(),
});

export async function POST(req: NextRequest) {
  const rl = rateLimiters.signup(req);
  if (!rl.success) return tooManyRequests();

  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse({ ...body, username: body.username?.toLowerCase() });

    if (!parsed.success) {
      return badRequest(parsed.error.errors[0].message);
    }

    const { email, password, username, displayName } = parsed.data;

    await connectDB();

    const existing = await User.findOne({
      $or: [{ email }, { username }],
    }).lean();

    if (existing) {
      const field = (existing as { email: string }).email === email ? "email" : "username";
      return conflict(`An account with this ${field} already exists`);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { publicKey, encryptedSecret } = generateWallet();

    const verificationToken = generateSecureToken(32);
    const hashedToken = hashToken(verificationToken);
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      email,
      passwordHash,
      username,
      displayName,
      walletPublicKey: publicKey,
      walletEncryptedSecret: encryptedSecret,
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: expiry,
    });

    await sendVerificationEmail({
      to: email,
      name: displayName,
      token: verificationToken,
    });

    return created({
      message: "Account created. Please check your email to verify your account.",
      userId: user._id.toString(),
    });
  } catch (err) {
    console.error("Signup error:", err);
    return serverError();
  }
}
