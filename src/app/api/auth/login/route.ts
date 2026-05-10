import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { signAccessToken, signRefreshToken } from "@/lib/auth";
import { rateLimiters } from "@/lib/rateLimit";
import { badRequest, unauthorized, tooManyRequests, serverError } from "@/lib/response";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const rl = rateLimiters.login(req);
  if (!rl.success) return tooManyRequests();

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return badRequest("Invalid email or password");

    const { email, password } = parsed.data;

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+passwordHash"
    );

    if (!user) return unauthorized("Invalid email or password");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return unauthorized("Invalid email or password");

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      emailVerified: user.emailVerified,
    };

    const accessToken = await signAccessToken(payload);
    const refreshToken = await signRefreshToken(user._id.toString());

    const isProduction = process.env.NODE_ENV === "production";
    const cookieBase = `HttpOnly; ${isProduction ? "Secure; " : ""}SameSite=Strict; Path=/`;

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          walletPublicKey: user.walletPublicKey,
          walletActivated: user.walletActivated,
        },
      },
    });

    response.headers.append("Set-Cookie", `access_token=${accessToken}; Max-Age=900; ${cookieBase}`);
    response.headers.append("Set-Cookie", `refresh_token=${refreshToken}; Max-Age=604800; ${cookieBase}`);

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return serverError();
  }
}
