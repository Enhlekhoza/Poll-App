import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from 'express-rate-limit';
import { getIP } from '@/lib/utils';

// Create a map to store rate limit data
const rateLimitMap = new Map();

// Rate limit configuration
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Maximum requests per window

export async function rateLimiter(req: NextRequest) {
  const ip = getIP(req);
  
  // Skip rate limiting for non-production environments if needed
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true') {
    return null;
  }
  
  // Get current timestamp
  const now = Date.now();
  
  // Get or create rate limit data for this IP
  let rateLimitData = rateLimitMap.get(ip) || {
    count: 0,
    resetTime: now + WINDOW_MS,
  };
  
  // Reset if window has expired
  if (now > rateLimitData.resetTime) {
    rateLimitData = {
      count: 0,
      resetTime: now + WINDOW_MS,
    };
  }
  
  // Increment request count
  rateLimitData.count++;
  
  // Update the map
  rateLimitMap.set(ip, rateLimitData);
  
  // Check if rate limit exceeded
  if (rateLimitData.count > MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Too many requests, please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitData.resetTime - now) / 1000)) } }
    );
  }
  
  return null;
}

// Helper function to apply rate limiting to any API route
export async function withRateLimit(req: NextRequest, handler: (req: NextRequest) => Promise<NextResponse>) {
  const limiterResponse = await rateLimiter(req);
  
  if (limiterResponse) {
    return limiterResponse;
  }
  
  return handler(req);
}