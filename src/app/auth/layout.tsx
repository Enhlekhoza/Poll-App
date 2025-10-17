'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && user) {
      // Redirect logged-in users away from login/register pages
      if (pathname?.startsWith('/auth')) {
        router.push('/dashboard/polls');
      }
    }
  }, [user, loading, router, pathname]);

  if (user && pathname?.startsWith('/auth')) {
    return null; // Already redirected
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left side: visual background */}
      <div className="relative hidden lg:flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 p-8">
        <div className="absolute inset-0 z-0 opacity-20">
          <Image
            src="/globe.svg"
            alt="Background Illustration"
            fill
            className="opacity-50 object-cover"
          />
        </div>
        <div className="relative z-10 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Welcome to Poll Master</h2>
          <p className="text-lg opacity-80">
            Create engaging polls and gather insights from your audience.
          </p>
        </div>
      </div>

      {/* Right side: auth form */}
      <main className="flex items-center justify-center bg-white p-8 lg:p-12">
        {children}
      </main>
    </div>
  );
}