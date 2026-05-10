import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import PaymentPage from "@/models/PaymentPage";
import { getAuthUser } from "@/lib/auth";
import { ok, badRequest, unauthorized, notFound, serverError } from "@/lib/response";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(2).max(80).trim().optional(),
  description: z.string().max(300).trim().optional(),
  isActive: z.boolean().optional(),
  amountMode: z.enum(["flexible", "fixed", "tipjar"]).optional(),
  fixedAmount: z.string().optional(),
  tipAmounts: z.array(z.object({ label: z.string(), amount: z.string() })).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();

    await connectDB();
    const page = await PaymentPage.findOne({ _id: id, userId: authUser.userId });
    if (!page) return notFound("Payment page not found");

    return ok({ page });
  } catch (err) {
    console.error("Get page error:", err);
    return serverError();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0].message);

    await connectDB();
    const page = await PaymentPage.findOneAndUpdate(
      { _id: id, userId: authUser.userId },
      { $set: parsed.data },
      { new: true, runValidators: true }
    );

    if (!page) return notFound("Payment page not found");

    return ok({ page });
  } catch (err) {
    console.error("Update page error:", err);
    return serverError();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();

    await connectDB();
    const page = await PaymentPage.findOneAndDelete({ _id: id, userId: authUser.userId });
    if (!page) return notFound("Payment page not found");

    return ok({ message: "Payment page deleted" });
  } catch (err) {
    console.error("Delete page error:", err);
    return serverError();
  }
}
