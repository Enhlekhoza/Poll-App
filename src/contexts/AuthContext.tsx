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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        console.log("Session data:", data); // Add logging
        
        if (data?.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to load user:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();

  const signIn = async (email: string, password: string) => {
    console.log("AuthContext: signIn called with email:", email);
    const result = await nextAuthSignIn("credentials", {
      redirect: false,
      email,
      password,
    });
    console.log("AuthContext: nextAuthSignIn result:", result);
    if (result?.error) {
      console.log("AuthContext: signIn returning error:", result.error);
      return { error: result.error };
    }
    if (result?.ok) {
      console.log("AuthContext: nextAuthSignIn successful, result.ok is true.");
    } else {
      console.log("AuthContext: nextAuthSignIn failed, result.ok is false.");
    }

    // Check if there's a redirect parameter in the URL
    const redirectTo = searchParams.get('redirect');
    if (redirectTo) {
      console.log("AuthContext: Redirecting to original path:", decodeURIComponent(redirectTo));
      router.push(decodeURIComponent(redirectTo));
    } else {
      console.log("AuthContext: Redirecting to dashboard.");
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
    console.log("AuthContext: signOut called.");
    await nextAuthSignOut({ redirect: false });
    console.log("AuthContext: User signed out.");
    router.replace("/auth/login");
    console.log("AuthContext: Redirecting to login after signOut.");
  };    

  return (
    <SessionProvider>
      <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, forgotPassword }}>
        {children}
      </AuthContext.Provider>
    </SessionProvider>
  );
}

export const useAuth = () => useContext(AuthContext);