import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionToken } from "@/lib/auth";

// Routes that require admin authentication
const PROTECTED_PAGES = ["/Maya", "/admin"];

// Public API routes (no auth needed)
const PUBLIC_API = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/register",
  "/api/groups",
  "/api/banners",
  "/api/gallery",
  "/api/menu",
  "/api/umbrella",
  "/api/session",
  "/api/order",
  "/api/orders",
  "/api/bill",
  "/api/payment-options",
  "/api/offers",
  "/api/analytics",
  "/api/access-log",
  "/api/push",
  "/api/owner",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Public API routes: always allow ──
  if (PUBLIC_API.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p + "?"))) {
    return NextResponse.next();
  }

  // ── Protected pages: redirect to login if no session ──
  const isProtectedPage = PROTECTED_PAGES.some((p) =>
    pathname === p || pathname.startsWith(p + "/")
  );

  if (isProtectedPage) {
    const token = getSessionToken(request.headers.get("cookie"));
    if (!token) {
      if (pathname === "/Maya") return NextResponse.next();
      return NextResponse.redirect(new URL("/Maya?auth=required", request.url));
    }
    return NextResponse.next();
  }

  // ── Protected API routes (/api/admin/*) ──
  if (pathname.startsWith("/api/admin/") || pathname === "/api/auth/me") {
    const token = getSessionToken(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Neautorizat." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/Maya/:path*",
    "/Maya",
    "/admin/:path*",
    "/admin",
    "/api/admin/:path*",
    "/api/auth/me",
  ],
};
