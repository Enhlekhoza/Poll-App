import { NextRequest } from 'next/server';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import DOMPurify from 'isomorphic-dompurify';

// Combine Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Get client IP address from request
export function getIP(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  return xff ? xff.split(',')[0] : '127.0.0.1';
}

// Sanitize user input to prevent XSS attacks
export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input);
}

// Generate CSRF token
export function generateCSRFToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Validate CSRF token
export function validateCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false;
  return token === storedToken;
}

// Format date for display
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
