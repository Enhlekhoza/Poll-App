import { NextRequest, NextResponse } from "next/server"

export const config = {
  matcher: ["/((?!auth|_next/static|_next/image|favicon.ico).*)"], 
  // Protect everything except /auth/* and public assets
}

export function middleware(req: NextRequest) {
  const publicPaths = [
    "/", 
    "/auth/login", 
    "/auth/register", 
    "/auth/forgot-password", 
    "/auth/update-password"
  ]

  const isPublicPath = publicPaths.includes(req.nextUrl.pathname)

  // Look for next-auth cookies (works for dev & prod)
  const token = req.cookies.get("next-auth.session-token")?.value 
             || req.cookies.get("__Secure-next-auth.session-token")?.value

  if (!token && !isPublicPath) {
    const url = req.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}