"use client";

import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut, useSession, SessionProvider } from "next-auth/react";

// Define a local User type to avoid importing from @prisma/client
interface User {
  id: string;     
  email: string;
  name?: string | null;
  role?: string;
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

function InnerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }
    setUser(session?.user ? ({
      id: (session.user as any).id,
      email: session.user.email as string,
      name: session.user.name,
      role: (session.user as any).role,
    } as User) : null);
    setLoading(false);
  }, [session, status]);

  const signIn = async (email: string, password: string) => {
    const result = await nextAuthSignIn("credentials", { redirect: false, email, password });
    if (result?.error) {
      return { error: result.error };
    }
    const redirectTo = searchParams.get('redirect');
    if (redirectTo) {
      router.push(decodeURIComponent(redirectTo));
    } else {
      router.push("/dashboard");
    }
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

  const forgotPassword = async (email: string) => {
    // This functionality will need to be re-implemented as it was using Supabase-specific features.
    // For now, we'll just return an error.
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

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <InnerAuthProvider>{children}</InnerAuthProvider>
    </SessionProvider>
  );
}

export const useAuth = () => useContext(AuthContext);