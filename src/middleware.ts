import { NextRequest, NextResponse } from 'next/server';
import { auth } from './lib/auth';

export const config = {
  runtime: 'nodejs', // This forces the middleware to run in a Node.js environment
};

export async function middleware(request: NextRequest) {
  const session = await auth();

  const publicPaths = ['/', '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/update-password'];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);

  if (!session && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
