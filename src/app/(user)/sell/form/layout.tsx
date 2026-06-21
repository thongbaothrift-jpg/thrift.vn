import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("sell");
}

export default function SellFormLayout({ children }: { children: React.ReactNode }) {
  return children;
}
