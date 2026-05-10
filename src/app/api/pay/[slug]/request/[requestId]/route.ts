import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import PaymentRequest from "@/models/PaymentRequest";
import PaymentPage from "@/models/PaymentPage";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Notification from "@/models/Notification";
import { getAuthUser } from "@/lib/auth";
import { getUSDCBalance, sendUSDCWithFee, generateSEP0007URI, getUSDCAsset } from "@/lib/stellar";
import { ok, badRequest, notFound, serverError, unauthorized, forbidden } from "@/lib/response";
import { z } from "zod";

// GET public payment request
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string; requestId: string }> }) {
  try {
    const { slug, requestId } = await params;
    await connectDB();

    // Auto-expire if past due
    await PaymentRequest.updateMany(
      { requestId, status: "pending", expiresAt: { $lt: new Date() } },
      { $set: { status: "expired" } }
    );

    const request = await PaymentRequest.findOne({ requestId, pageSlug: slug }).lean();
    if (!request) return notFound("Payment request not found");

    const page = await PaymentPage.findOne({ slug, isActive: true }).lean();
    if (!page) return notFound("Payment page not found");

    const owner = await User.findById(page.userId).select("displayName username bio").lean();

    const intermediaryKey = process.env.PLATFORM_INTERMEDIARY_PUBLIC_KEY!;

    // Generate SEP-0007 URI with full payment details
    const sep0007URI = generateSEP0007URI({
      destination: intermediaryKey,
      amount: request.expectedAmount,
      assetCode: getUSDCAsset().getCode(),
      assetIssuer: getUSDCAsset().getIssuer(),
      memo: request.memo,
      memoType: "text",
    });

    return ok({
      request,
      page,
      owner,
      intermediaryAddress: intermediaryKey,
      sep0007URI,
    });
  } catch (err) {
    console.error("Get request error:", err);
    return serverError();
  }
}

// POST pay payment request via platform account
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string; requestId: string }> }) {
  try {
    const { slug, requestId } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();
    if (!authUser.emailVerified) return forbidden("Please verify your email first");

    const body = await req.json();
    const parsed = z.object({ memo: z.string().optional() }).safeParse(body);
    if (!parsed.success) return badRequest("Invalid request");

    await connectDB();

    const request = await PaymentRequest.findOne({ requestId, pageSlug: slug, status: "pending" });
    if (!request) return notFound("Payment request not found or already completed");
    if (new Date() > request.expiresAt) {
      request.status = "expired";
      await request.save();
      return badRequest("This payment request has expired");
    }

    const [payer, pageOwner] = await Promise.all([
      User.findById(authUser.userId),
      User.findById(request.userId),
    ]);

    if (!payer) return unauthorized();
    if (!payer.walletActivated) return forbidden("Your wallet is not activated");

    const payerBalance = parseFloat(await getUSDCBalance(payer.walletPublicKey));
    if (payerBalance < parseFloat(request.expectedAmount)) {
      return badRequest("Insufficient balance");
    }

    const { hash, netAmount, fee } = await sendUSDCWithFee({
      fromEncryptedSecret: payer.walletEncryptedSecret,
      toPublicKey: request.receiveToPublicKey,
      amount: request.expectedAmount,
      memo: request.memo,
    });

    // Mark request complete
    request.status = "completed";
    request.paidAt = new Date();
    request.txHash = hash;
    request.paidAmount = request.expectedAmount;
    request.paidByAddress = payer.walletPublicKey;
    await request.save();

    // Update page stats
    await PaymentPage.findByIdAndUpdate(request.pageId, {
      $inc: { paymentCount: 1 },
      $set: { totalReceived: "0" }, // simplified
    });

    if (pageOwner) {
      await Promise.all([
        Transaction.create({
          userId: pageOwner._id,
          type: "receive",
          status: "completed",
          amount: request.expectedAmount,
          asset: "USDC",
          fee,
          netAmount,
          fromAddress: payer.walletPublicKey,
          toAddress: request.receiveToPublicKey,
          memo: request.memo,
          txHash: hash,
          paymentRequestId: request._id,
          description: `Payment for "${request.title}"`,
        }),
        Notification.create({
          userId: pageOwner._id,
          type: "payment_request_completed",
          title: "Payment Request Completed",
          message: `"${request.title}" — $${parseFloat(request.expectedAmount).toFixed(2)} USDC received`,
          metadata: { amount: request.expectedAmount, txHash: hash, requestId },
        }),
        Transaction.create({
          userId: payer._id,
          type: "send",
          status: "completed",
          amount: request.expectedAmount,
          asset: "USDC",
          fee,
          netAmount,
          fromAddress: payer.walletPublicKey,
          toAddress: request.receiveToPublicKey,
          memo: request.memo,
          txHash: hash,
          paymentRequestId: request._id,
          description: `Paid for "${request.title}"`,
        }),
      ]);
    }

    return ok({ hash, netAmount, fee, message: "Payment successful" });
  } catch (err) {
    console.error("Pay request error:", err);
    return serverError();
  }
}
