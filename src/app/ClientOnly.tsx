"use client";

import { ReactNode } from "react";
import { AuthProvider } from "app/contexts/AuthContext";
import { Toaster } from "sonner";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}