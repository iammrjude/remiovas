import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import PaymentPage from "@/models/PaymentPage";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Notification from "@/models/Notification";
import { getAuthUser } from "@/lib/auth";
import { getUSDCBalance, sendUSDCWithFee, generateSEP0007URI, getUSDCAsset } from "@/lib/stellar";
import { ok, badRequest, notFound, serverError, unauthorized, forbidden } from "@/lib/response";
import { z } from "zod";

// GET public page by slug
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    await connectDB();

    const page = await PaymentPage.findOne({ slug, isActive: true }).lean();
    if (!page) return notFound("Payment page not found");

    const owner = await User.findById(page.userId).select("displayName username bio walletPublicKey").lean();
    if (!owner) return notFound("Page owner not found");

    // Generate SEP-0007 URI for the page's wallet address
    const sep0007URI = generateSEP0007URI({
      destination: process.env.PLATFORM_INTERMEDIARY_PUBLIC_KEY!,
      assetCode: getUSDCAsset().getCode(),
      assetIssuer: getUSDCAsset().getIssuer(),
    });

    return ok({ page, owner, sep0007URI });
  } catch (err) {
    console.error("Get public page error:", err);
    return serverError();
  }
}

// POST pay via platform account (logged in user)
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();
    if (!authUser.emailVerified) return forbidden("Please verify your email first");

    const body = await req.json();
    const schema = z.object({
      amount: z.string(),
      memo: z.string().max(28).optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0].message);

    const { amount, memo } = parsed.data;
    const amountNum = parseFloat(amount);
    const MIN_AMOUNT = parseFloat(process.env.MIN_TRANSACTION_USD || "1");

    if (isNaN(amountNum) || amountNum < MIN_AMOUNT) {
      return badRequest(`Minimum amount is $${MIN_AMOUNT}`);
    }

    await connectDB();

    const page = await PaymentPage.findOne({ slug, isActive: true });
    if (!page) return notFound("Payment page not found");

    const [payer, pageOwner] = await Promise.all([
      User.findById(authUser.userId),
      User.findById(page.userId),
    ]);

    if (!payer) return unauthorized();
    if (!payer.walletActivated) return forbidden("Your wallet is not activated");
    if (!pageOwner) return notFound("Page owner not found");

    const payerBalance = parseFloat(await getUSDCBalance(payer.walletPublicKey));
    if (payerBalance < amountNum) return badRequest("Insufficient balance");

    const { hash, netAmount, fee } = await sendUSDCWithFee({
      fromEncryptedSecret: payer.walletEncryptedSecret,
      toPublicKey: page.receiveToPublicKey,
      amount,
      memo,
    });

    // Update page stats
    page.totalReceived = (parseFloat(page.totalReceived) + parseFloat(netAmount)).toFixed(7);
    page.paymentCount += 1;
    await page.save();

    // Record transactions
    await Promise.all([
      Transaction.create({
        userId: payer._id,
        type: "send",
        status: "completed",
        amount,
        asset: "USDC",
        fee,
        netAmount,
        fromAddress: payer.walletPublicKey,
        toAddress: page.receiveToPublicKey,
        memo: memo || null,
        txHash: hash,
        paymentPageId: page._id,
        description: `Payment to ${page.title}`,
      }),
      Transaction.create({
        userId: pageOwner._id,
        type: "receive",
        status: "completed",
        amount,
        asset: "USDC",
        fee,
        netAmount,
        fromAddress: payer.walletPublicKey,
        toAddress: page.receiveToPublicKey,
        memo: memo || null,
        txHash: hash,
        paymentPageId: page._id,
        description: `Payment via ${page.title}`,
      }),
      Notification.create({
        userId: pageOwner._id,
        type: "payment_received",
        title: "Payment Received",
        message: `You received $${amountNum.toFixed(2)} USDC via "${page.title}"`,
        metadata: { amount, txHash: hash, pageSlug: slug },
      }),
    ]);

    return ok({ hash, netAmount, fee, message: "Payment successful" });
  } catch (err) {
    console.error("Pay page error:", err);
    return serverError();
  }
}
