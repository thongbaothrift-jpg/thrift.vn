import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return getPageMetadata("shop");
}

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
