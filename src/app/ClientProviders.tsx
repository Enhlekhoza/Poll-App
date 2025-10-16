"use client"

import { ReactNode, Suspense } from "react"
import { SessionProvider } from "next-auth/react"
import { AuthProvider } from "@/contexts/AuthContext"
import { Toaster } from "sonner"

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <Suspense fallback={null}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </Suspense>
    </SessionProvider>
  )
}