"use client";

import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { SiteTextsProvider } from "@/lib/site-texts-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <SiteTextsProvider>
            {children}
          </SiteTextsProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
