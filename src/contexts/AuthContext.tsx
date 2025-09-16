"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/supabase"

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  forgotPassword: (email: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  forgotPassword: async () => ({ error: null }),
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasRedirected, setHasRedirected] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Load session and subscribe to changes
  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    }
    loadSession()

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Note: Subscription cleanup is handled by Supabase internally
  }, [])

  // Redirect logged-in users away from login page and handle post-login navigation
  useEffect(() => {
    if (!loading && user) {
      const loginPath = "/auth/login"
      const updatePasswordPath = "/auth/update-password"
      if (pathname?.replace(/\/$/, "") === loginPath) {
        const redirectTo = searchParams?.get("redirect") || "/"
        console.log("AuthProvider: redirecting to", redirectTo)

        // Use replace instead of push to avoid browser history issues
        setTimeout(() => router.replace(redirectTo), 100)
      } else if (pathname?.startsWith(updatePasswordPath)) {
        // Do not redirect if on the update password page, let it handle the session
        return
      }
    }
  }, [user, loading, pathname, searchParams, router])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error during sign in') }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      return { error: error }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error during sign up') }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace("/auth/login")
  }

  const forgotPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      return { error: error }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error during password reset') }
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, forgotPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)