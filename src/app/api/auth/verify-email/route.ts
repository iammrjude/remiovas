import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { hashToken } from "@/lib/encryption";
import { fundWalletFriendbot, createUSDCTrustline } from "@/lib/stellar";
import { rateLimiters } from "@/lib/rateLimit";
import { ok, badRequest, tooManyRequests, serverError } from "@/lib/response";
import { z } from "zod";

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: NextRequest) {
  const rl = rateLimiters.emailVerification(req);
  if (!rl.success) return tooManyRequests();

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid token");

    const { token } = parsed.data;
    const hashedToken = hashToken(token);

    await connectDB();

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: new Date() },
      emailVerified: false,
    });

    if (!user) return badRequest("Invalid or expired verification link");

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpiry = null;
    await user.save();

    // Activate wallet: fund via Friendbot (testnet) then create USDC trustline
    try {
      await fundWalletFriendbot(user.walletPublicKey);
      // Wait a moment for Friendbot to process
      await new Promise((r) => setTimeout(r, 3000));
      await createUSDCTrustline(user.walletEncryptedSecret);
      user.walletActivated = true;
      await user.save();

      await Notification.create({
        userId: user._id,
        type: "wallet_activated",
        title: "Wallet Activated",
        message: "Your Stellar wallet is now active and ready to use. You can now send and receive USDC.",
        metadata: { walletPublicKey: user.walletPublicKey },
      });
    } catch (walletErr) {
      console.error("Wallet activation error:", walletErr);
      // Don't fail the verification if wallet activation fails — retry separately
    }

    await Notification.create({
      userId: user._id,
      type: "email_verified",
      title: "Email Verified",
      message: "Your email has been verified successfully. Welcome to Remiovas!",
      metadata: {},
    });

    return ok({ message: "Email verified successfully. Your wallet is being activated." });
  } catch (err) {
    console.error("Verify email error:", err);
    return serverError();
  }
}
