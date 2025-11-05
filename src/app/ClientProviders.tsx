"use client"

import React, { ReactNode, Suspense, useEffect, useState } from "react"
import { SessionProvider } from "next-auth/react"
import { AuthProvider } from "@/contexts/AuthContext"
import { Toaster } from "sonner"

// Error boundary component for client-side errors
class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by error boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="mb-4">We're having trouble loading this page. Please try refreshing.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

export default function ClientProviders({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until the component is mounted on the client
  if (!mounted) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary>
      <SessionProvider>
        <Suspense fallback={<LoadingFallback />}>
          <AuthProvider>
            {children}
            <Toaster position="top-right" />
          </AuthProvider>
        </Suspense>
      </SessionProvider>
    </ErrorBoundary>
  );
}