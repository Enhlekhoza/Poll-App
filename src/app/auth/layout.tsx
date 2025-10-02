'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image'; // Import Image for the background

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/polls');
    }
  }, [user, loading, router]);

  if (user) {
    return null; // Should already be redirected by useEffect
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left side: Visual background */}
      <div className="relative hidden lg:flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 p-8">
        <div className="absolute inset-0 z-0 opacity-20">
          {/* Placeholder for a more complex background or illustration */}
          <Image
            src="/globe.svg" // Using an existing SVG as a placeholder
            alt="Background Illustration"
            fill // Use the fill prop directly
            className="opacity-50 object-cover" // Add object-cover to className
          />
        </div>
        <div className="relative z-10 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Welcome to Poll Master</h2>
          <p className="text-lg opacity-80">
            Create engaging polls and gather insights from your audience.
          </p>
        </div>
      </div>

      {/* Right side: Auth form */}
      <main className="flex items-center justify-center bg-white p-8 lg:p-12">
        {children}
      </main>
    </div>
  );
}