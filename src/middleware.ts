// /middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/dashboard/:path*"], // ✅ Protect only dashboard pages
};

export function middleware(req: NextRequest) {
  const token =
    req.cookies.get("next-auth.session-token")?.value || // Local development
    req.cookies.get("__Secure-next-auth.session-token")?.value; // Production / HTTPS

  if (!token) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}