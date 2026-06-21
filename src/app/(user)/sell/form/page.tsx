import { Suspense } from "react";
import SellFormClient from "@/components/SellFormClient";
import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("sell");
}

export default function SellFormPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>}>
      <SellFormClient />
    </Suspense>
  );
}
