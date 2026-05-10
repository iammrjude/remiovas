import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { hashToken } from "@/lib/encryption";
import { ok, badRequest, serverError } from "@/lib/response";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0].message);

    const { token, password } = parsed.data;
    const hashedToken = hashToken(token);

    await connectDB();

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: new Date() },
    });

    if (!user) return badRequest("Invalid or expired reset link");

    user.passwordHash = await bcrypt.hash(password, 12);
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    await user.save();

    return ok({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    return serverError();
  }
}
