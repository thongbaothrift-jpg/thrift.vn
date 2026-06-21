"use client";

import { AuthProvider } from "@/lib/auth-context";

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
