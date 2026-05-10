import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import PaymentRequest from "@/models/PaymentRequest";
import PaymentPage from "@/models/PaymentPage";
import User from "@/models/User";
import { getAuthUser } from "@/lib/auth";
import { generatePaymentMemo } from "@/lib/stellar";
import { rateLimiters } from "@/lib/rateLimit";
import { ok, created, badRequest, unauthorized, tooManyRequests, serverError, forbidden, notFound } from "@/lib/response";
import { z } from "zod";
import { nanoid } from "@/lib/nanoid";

const createSchema = z.object({
  pageId: z.string().min(1),
  title: z.string().min(2).max(80).trim(),
  description: z.string().max(300).trim().optional().default(""),
  expectedAmount: z.string(),
  expiryHours: z.number().min(1).max(720).default(24),
});

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");

    await connectDB();

    // Auto-expire past due requests
    await PaymentRequest.updateMany(
      { userId: authUser.userId, status: "pending", expiresAt: { $lt: new Date() } },
      { $set: { status: "expired" } }
    );

    const filter: Record<string, unknown> = { userId: authUser.userId };
    if (status) filter.status = status;

    const [requests, total] = await Promise.all([
      PaymentRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PaymentRequest.countDocuments(filter),
    ]);

    return ok({ requests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error("Get requests error:", err);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  const rl = rateLimiters.paymentRequestCreate(req);
  if (!rl.success) return tooManyRequests();

  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();

    if (!authUser.emailVerified) {
      return forbidden("Please verify your email first");
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0].message);

    const { pageId, title, description, expectedAmount, expiryHours } = parsed.data;
    const amountNum = parseFloat(expectedAmount);
    const MIN_AMOUNT = parseFloat(process.env.MIN_TRANSACTION_USD || "1");

    if (isNaN(amountNum) || amountNum < MIN_AMOUNT) {
      return badRequest(`Minimum amount is $${MIN_AMOUNT}`);
    }

    await connectDB();

    const page = await PaymentPage.findOne({ _id: pageId, userId: authUser.userId });
    if (!page) return notFound("Payment page not found");

    const user = await User.findById(authUser.userId);
    if (!user?.walletActivated) return forbidden("Your wallet is not yet activated");

    const memo = generatePaymentMemo();
    const requestId = nanoid(10);
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    const request = await PaymentRequest.create({
      userId: authUser.userId,
      pageId,
      pageSlug: page.slug,
      requestId,
      title,
      description,
      expectedAmount,
      memo,
      receiveToPublicKey: page.receiveToPublicKey,
      expiresAt,
    });

    return created({ request });
  } catch (err) {
    console.error("Create request error:", err);
    return serverError();
  }
}
