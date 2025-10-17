"use client";

import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  signIn as nextAuthSignIn,
  signOut as nextAuthSignOut,
  useSession,
  SessionProvider,
} from "next-auth/react";

// Local User type
interface User {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
}

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  forgotPassword: async () => ({ error: null }),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams(); // may be null

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (session?.user && typeof session.user.email === "string") {
      const u: User = {
        id: (session.user as any).id || "",
        email: session.user.email,
        name: session.user.name ?? undefined,
        role: (session.user as any).role ?? undefined,
      };
      setUser(u);
    } else {
      setUser(null);
    }

    setLoading(false);
  }, [session, status]);

  const signIn = async (email: string, password: string) => {
    const result = await nextAuthSignIn("credentials", { redirect: false, email, password });

    if (result?.error) {
      return { error: String(result.error) };
    }

    // Always redirect to the main polls page after sign-in
    router.push("/dashboard/polls");

    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json();
        return { error: body?.error ? String(body.error) : "Registration failed" };
      }

      // Automatically sign in after successful registration
      return await signIn(email, password);
    } catch (err) {
      console.error("signUp error:", err);
      return { error: "An unexpected error occurred." };
    }
  };

  const forgotPassword = async (email: string) => {
    return { error: "Forgot password functionality is not yet implemented." };
  };

  const signOut = async () => {
    await nextAuthSignOut({ redirect: false });
    router.replace("/auth/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, forgotPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);