import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/seo";
import { AboutContent } from "./AboutContent";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("about");
}

export default function AboutPage() {
  return <AboutContent />;
}
