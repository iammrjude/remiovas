import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export function unauthorized(message = "Unauthorized"): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden"): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

export function notFound(message = "Not found"): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}

export function tooManyRequests(message = "Too many requests. Please try again later."): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 429 });
}

export function serverError(message = "Internal server error"): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}

export function conflict(message: string): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 409 });
}
