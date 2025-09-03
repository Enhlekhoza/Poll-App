"use client"

import { ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

interface ProtectedRouteProps {
  children: ReactNode
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = "/auth/login" 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      // User is not authenticated and we're done loading
      // Redirect to login page with the current URL as the redirect parameter
      const currentPath = window.location.pathname
      const redirectPath = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
      router.replace(redirectPath)
    }
  }, [user, loading, router, redirectTo])

  // Show nothing while loading to avoid flash of content
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-center">
          <div className="h-8 w-8 mx-auto rounded-full bg-slate-200"></div>
          <p className="mt-2 text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }

  // If not loading and user exists, render children
  return user ? <>{children}</> : null
}