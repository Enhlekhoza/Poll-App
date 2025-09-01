"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
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

    return () => subscription?.unsubscribe?.()
  }, [])

  // Redirect logged-in users away from login page
  useEffect(() => {
    if (!loading && user && !hasRedirected) {
      const loginPath = "/auth/login"
      if (pathname?.replace(/\/$/, "") === loginPath) {
        const redirectTo = searchParams?.get("redirect") || "/polls/create"
        console.log("AuthProvider: redirecting to", redirectTo)

        setHasRedirected(true)
        // small delay ensures client hydration
        setTimeout(() => router.replace(redirectTo), 50)
      }
    }
  }, [user, loading, pathname, searchParams, router, hasRedirected])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace("/auth/login")
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)