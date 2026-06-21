import type { Metadata } from "next";
import { ContactPageContent } from "./ContactPageContent";
import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("contact");
}

export default function ContactPage() {
  return <ContactPageContent />;
}
