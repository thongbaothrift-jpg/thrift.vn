"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Header, Footer, PageTransition, CartSlideOver } from "@/components";
import { FreeShippingBanner } from "@/components/FreeShippingBanner";
import { FooterConfigProvider } from "@/lib/footer-context";
import { UserProviders } from "@/components/UserProviders";

const MessengerChat = dynamic(
  () => import("@/components/MessengerChat").then((m) => m.MessengerChat),
  { ssr: false, loading: () => null }
);

export default function UserRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProviders>
      <FooterConfigProvider>
        <FreeShippingBanner />
        <Header />
        <main className="flex-grow">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
        <CartSlideOver />
        <MessengerChat />
      </FooterConfigProvider>
    </UserProviders>
  );
}
