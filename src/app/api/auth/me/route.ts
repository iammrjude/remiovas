import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();

    await connectDB();

    const user = await User.findById(authUser.userId).select(
      "-passwordHash -walletEncryptedSecret -emailVerificationToken -passwordResetToken"
    );

    if (!user) return unauthorized();

    return ok({ user });
  } catch (err) {
    console.error("Me error:", err);
    return serverError();
  }
}
