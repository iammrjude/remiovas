import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getAuthUser } from "@/lib/auth";
import { ok, badRequest, unauthorized, serverError } from "@/lib/response";
import { z } from "zod";

const updateSchema = z.object({
  displayName: z.string().min(2).max(60).trim().optional(),
  bio: z.string().max(160).trim().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.errors[0].message);

    await connectDB();

    const user = await User.findByIdAndUpdate(
      authUser.userId,
      { $set: parsed.data },
      { new: true, runValidators: true }
    ).select("-passwordHash -walletEncryptedSecret -emailVerificationToken -passwordResetToken");

    if (!user) return unauthorized();

    return ok({ user });
  } catch (err) {
    console.error("Profile update error:", err);
    return serverError();
  }
}
