import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Notification from "@/models/Notification";
import { getAuthUser } from "@/lib/auth";
import { sendUSDCWithFee, isValidPublicKey, getUSDCBalance } from "@/lib/stellar";
import { rateLimiters } from "@/lib/rateLimit";
import { ok, badRequest, unauthorized, tooManyRequests, serverError, forbidden } from "@/lib/response";
import { z } from "zod";

const MIN_AMOUNT = parseFloat(process.env.MIN_TRANSACTION_USD || "1");

const sendSchema = z.object({
  recipient: z.string().min(1),
  amount: z.string(),
  memo: z.string().max(28).optional(),
});

// GET /api/wallet - get wallet info and balance
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();

    await connectDB();
    const user = await User.findById(authUser.userId);
    if (!user) return unauthorized();

    // Refresh balance from Stellar if wallet is activated
    let balance = user.usdcBalance;
    if (user.walletActivated) {
      balance = await getUSDCBalance(user.walletPublicKey);
      if (balance !== user.usdcBalance) {
        user.usdcBalance = balance;
        await user.save();
      }
    }

    return ok({
      publicKey: user.walletPublicKey,
      balance,
      activated: user.walletActivated,
      emailVerified: user.emailVerified,
    });
  } catch (err) {
    console.error("Wallet GET error:", err);
    return serverError();
  }
}

// POST /api/wallet/send - send USDC to user or address
export async function POST(req: NextRequest) {
  const rl = rateLimiters.transfer(req);
  if (!rl.success) return tooManyRequests();

  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();

    if (!authUser.emailVerified) {
      return forbidden("Please verify your email before sending payments");
    }

    const body = await req.json();
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0].message);

    const { recipient, amount, memo } = parsed.data;
    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum < MIN_AMOUNT) {
      return badRequest(`Minimum transaction amount is $${MIN_AMOUNT}`);
    }

    await connectDB();

    const sender = await User.findById(authUser.userId);
    if (!sender) return unauthorized();
    if (!sender.walletActivated) return forbidden("Your wallet is not yet activated");

    const senderBalance = parseFloat(await getUSDCBalance(sender.walletPublicKey));
    if (senderBalance < amountNum) return badRequest("Insufficient balance");

    // Resolve recipient: username or public key
    let recipientPublicKey: string;
    let recipientUsername: string | null = null;

    if (isValidPublicKey(recipient)) {
      recipientPublicKey = recipient;
    } else {
      const recipientUser = await User.findOne({ username: recipient.toLowerCase() });
      if (!recipientUser) return badRequest("User not found");
      if (!recipientUser.walletActivated) return badRequest("Recipient wallet is not yet activated");
      recipientPublicKey = recipientUser.walletPublicKey;
      recipientUsername = recipientUser.username;

      // Create notification for recipient
      await Notification.create({
        userId: recipientUser._id,
        type: "transfer_received",
        title: "Payment Received",
        message: `You received $${amountNum.toFixed(2)} USDC from @${sender.username}`,
        metadata: { amount, senderUsername: sender.username },
      });
    }

    const { hash, netAmount, fee } = await sendUSDCWithFee({
      fromEncryptedSecret: sender.walletEncryptedSecret,
      toPublicKey: recipientPublicKey,
      amount,
      memo,
    });

    // Record transaction
    await Transaction.create({
      userId: sender._id,
      type: "send",
      status: "completed",
      amount,
      asset: "USDC",
      fee,
      netAmount,
      fromAddress: sender.walletPublicKey,
      toAddress: recipientPublicKey,
      toUsername: recipientUsername,
      memo: memo || null,
      txHash: hash,
      description: recipientUsername ? `Sent to @${recipientUsername}` : `Sent to ${recipientPublicKey.substring(0, 8)}...`,
    });

    await Notification.create({
      userId: sender._id,
      type: "transfer_sent",
      title: "Payment Sent",
      message: `You sent $${amountNum.toFixed(2)} USDC${recipientUsername ? ` to @${recipientUsername}` : ""}`,
      metadata: { amount, txHash: hash },
    });

    return ok({ hash, netAmount, fee, message: "Payment sent successfully" });
  } catch (err) {
    console.error("Wallet send error:", err);
    return serverError();
  }
}
