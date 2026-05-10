import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  emailVerified: boolean;
}

export async function signAccessToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(req?: NextRequest): Promise<JWTPayload | null> {
  try {
    let token: string | undefined;

    if (req) {
      token = req.cookies.get("access_token")?.value;
    } else {
      const cookieStore = await cookies();
      token = cookieStore.get("access_token")?.value;
    }

    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = `HttpOnly; ${isProduction ? "Secure; " : ""}SameSite=Strict; Path=/`;
  res.headers.append("Set-Cookie", `access_token=${accessToken}; Max-Age=900; ${cookieOptions}`);
  res.headers.append("Set-Cookie", `refresh_token=${refreshToken}; Max-Age=604800; ${cookieOptions}`);
}

export function clearAuthCookies(res: Response): void {
  res.headers.append("Set-Cookie", "access_token=; Max-Age=0; Path=/; HttpOnly");
  res.headers.append("Set-Cookie", "refresh_token=; Max-Age=0; Path=/; HttpOnly");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}
