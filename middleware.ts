import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Simple in-memory rate limiter (resets on redeploy)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit sign-in attempts
  if (pathname.startsWith("/api/auth/signin")) {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const allowed = rateLimit(`auth:${ip}`, 5, 300000); // 5 per 5 min

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please wait 5 minutes." },
        { status: 429 }
      );
    }
  }

  // Rate limit OTP verification attempts
  if (pathname.startsWith("/api/auth/callback")) {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const allowed = rateLimit(`otp:${ip}`, 10, 300000); // 10 per 5 min

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait 5 minutes." },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*"],
};
