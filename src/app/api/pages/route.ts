import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import PaymentPage from "@/models/PaymentPage";
import User from "@/models/User";
import { getAuthUser } from "@/lib/auth";
import { rateLimiters } from "@/lib/rateLimit";
import { ok, created, badRequest, unauthorized, tooManyRequests, serverError, forbidden, conflict } from "@/lib/response";
import { z } from "zod";

const RESERVED_SLUGS = [
  "admin", "api", "app", "apple", "dashboard", "google", "help", "home",
  "login", "logout", "me", "pay", "paypal", "privacy", "profile", "settings",
  "signup", "stellar", "stripe", "support", "terms", "verify", "wallet",
];

const createSchema = z.object({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and hyphens"),
  title: z.string().min(2).max(80).trim(),
  description: z.string().max(300).trim().optional().default(""),
  amountMode: z.enum(["flexible", "fixed", "tipjar"]).default("flexible"),
  fixedAmount: z.string().optional(),
  tipAmounts: z.array(z.object({ label: z.string(), amount: z.string() })).optional().default([]),
  receiveToPublicKey: z.string().optional(),
});

// GET all payment pages for current user
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();

    await connectDB();

    const pages = await PaymentPage.find({ userId: authUser.userId })
      .sort({ createdAt: -1 })
      .lean();

    return ok({ pages });
  } catch (err) {
    console.error("Get pages error:", err);
    return serverError();
  }
}

// POST create payment page
export async function POST(req: NextRequest) {
  const rl = rateLimiters.paymentPageCreate(req);
  if (!rl.success) return tooManyRequests();

  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();

    if (!authUser.emailVerified) {
      return forbidden("Please verify your email before creating payment pages");
    }

    const body = await req.json();
    const parsed = createSchema.safeParse({ ...body, slug: body.slug?.toLowerCase() });
    if (!parsed.success) return badRequest(parsed.error.errors[0].message);

    const { slug, title, description, amountMode, fixedAmount, tipAmounts, receiveToPublicKey } = parsed.data;

    if (RESERVED_SLUGS.includes(slug)) {
      return badRequest("This slug is reserved. Please choose a different one.");
    }

    await connectDB();

    const existing = await PaymentPage.findOne({ slug });
    if (existing) return conflict("This URL slug is already taken. Please choose a different one.");

    const user = await User.findById(authUser.userId);
    if (!user) return unauthorized();

    if (!user.walletActivated) {
      return forbidden("Your wallet must be activated before creating payment pages");
    }

    const page = await PaymentPage.create({
      userId: authUser.userId,
      slug,
      title,
      description,
      amountMode,
      fixedAmount: amountMode === "fixed" ? fixedAmount : null,
      tipAmounts: amountMode === "tipjar" ? tipAmounts : [],
      receiveToPublicKey: receiveToPublicKey || user.walletPublicKey,
    });

    return created({ page });
  } catch (err) {
    console.error("Create page error:", err);
    return serverError();
  }
}
