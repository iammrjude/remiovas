import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Transaction from "@/models/Transaction";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
    const skip = (page - 1) * limit;

    await connectDB();

    const [transactions, total] = await Promise.all([
      Transaction.find({ userId: authUser.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments({ userId: authUser.userId }),
    ]);

    return ok({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Transactions error:", err);
    return serverError();
  }
}
