"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { User } from "@prisma/client";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";

type AuthContextType = {
  user: (User & { role?: string }) | null;
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
  const [user, setUser] = useState<(User & { role?: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadUser = async () => {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data?.user) {
        setUser(data.user);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await nextAuthSignIn("credentials", {
      redirect: false,
      email,
      password,
    });
    if (result?.error) {
      return { error: result.error };
    }
    router.refresh();
    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json();
        return { error: body.error };
      }

      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred.' };
    }
  };

  const signOut = async () => {
    await nextAuthSignOut({ redirect: false });
    router.replace("/auth/login");
  };

  const forgotPassword = async (email: string) => {
    // This functionality will need to be re-implemented as it was using Supabase-specific features.
    // For now, we'll just return an error.
    return { error: "Forgot password functionality is not yet implemented." };
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, forgotPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
