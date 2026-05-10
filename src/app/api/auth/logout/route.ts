import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, data: { message: "Logged out" } });
  response.headers.append("Set-Cookie", "access_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict");
  response.headers.append("Set-Cookie", "refresh_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict");
  return response;
}
