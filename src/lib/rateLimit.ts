import { NextRequest } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (use Redis in production for multi-instance deployments)
const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 60_000);

interface RateLimitOptions {
  limit: number;
  windowMs: number;
  identifier?: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  req: NextRequest,
  options: RateLimitOptions
): RateLimitResult {
  const { limit, windowMs, identifier } = options;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const key = identifier ? `${ip}:${identifier}` : ip;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    };
    store.set(key, newEntry);
    return { success: true, remaining: limit - 1, resetAt: newEntry.resetAt };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

// Pre-configured rate limiters
export const rateLimiters = {
  login: (req: NextRequest) =>
    rateLimit(req, { limit: 5, windowMs: 15 * 60 * 1000, identifier: "login" }),

  signup: (req: NextRequest) =>
    rateLimit(req, { limit: 3, windowMs: 60 * 60 * 1000, identifier: "signup" }),

  emailVerification: (req: NextRequest) =>
    rateLimit(req, { limit: 3, windowMs: 60 * 60 * 1000, identifier: "email-verify" }),

  passwordReset: (req: NextRequest) =>
    rateLimit(req, { limit: 3, windowMs: 60 * 60 * 1000, identifier: "password-reset" }),

  paymentPageCreate: (req: NextRequest) =>
    rateLimit(req, { limit: 10, windowMs: 60 * 60 * 1000, identifier: "page-create" }),

  paymentRequestCreate: (req: NextRequest) =>
    rateLimit(req, { limit: 10, windowMs: 60 * 60 * 1000, identifier: "request-create" }),

  transfer: (req: NextRequest) =>
    rateLimit(req, { limit: 20, windowMs: 60 * 60 * 1000, identifier: "transfer" }),
};

// Sender blacklist for refund abuse prevention
const senderFailures = new Map<string, { count: number; resetAt: number }>();
const blacklist = new Set<string>();

export function recordSenderFailure(senderAddress: string): {
  blacklisted: boolean;
  failureCount: number;
} {
  const MAX_FAILURES = parseInt(process.env.MAX_SENDER_FAILURES || "3");
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000;

  const entry = senderFailures.get(senderAddress);

  if (!entry || entry.resetAt < now) {
    senderFailures.set(senderAddress, { count: 1, resetAt: now + windowMs });
    return { blacklisted: false, failureCount: 1 };
  }

  entry.count++;

  if (entry.count >= MAX_FAILURES) {
    blacklist.add(senderAddress);
    return { blacklisted: true, failureCount: entry.count };
  }

  return { blacklisted: false, failureCount: entry.count };
}

export function isSenderBlacklisted(senderAddress: string): boolean {
  return blacklist.has(senderAddress);
}

// Daily refund counter
let dailyRefundCount = 0;
let dailyRefundResetAt = Date.now() + 24 * 60 * 60 * 1000;

export function incrementDailyRefunds(): boolean {
  const MAX_DAILY = parseInt(process.env.MAX_DAILY_REFUNDS || "100");
  const now = Date.now();

  if (now > dailyRefundResetAt) {
    dailyRefundCount = 0;
    dailyRefundResetAt = now + 24 * 60 * 60 * 1000;
  }

  dailyRefundCount++;
  return dailyRefundCount <= MAX_DAILY;
}
