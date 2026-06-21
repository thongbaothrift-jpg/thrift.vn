import { getPageMetadata } from "@/lib/seo";
import { SizeGuideContent } from "./SizeGuideContent";

export async function generateMetadata() {
  return getPageMetadata("sizeGuide");
}

export default function SizeGuidePage() {
  return <SizeGuideContent />;
}
