import { getPublicSiteTexts } from "@/lib/api";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const revalidate = 60; // Revalidate every 60 seconds

// Mapping slug to siteTexts key and title
const POLICY_MAP: Record<string, { baseKey: string; fallbackTitle: string }> = {
  consignment: { baseKey: "policy_consignment", fallbackTitle: "Chính sách ký gửi" },
  privacy: { baseKey: "policy_privacy", fallbackTitle: "Chính sách bảo mật" },
  sales: { baseKey: "policy_sales", fallbackTitle: "Chính sách bán hàng" },
  terms: { baseKey: "policy_terms", fallbackTitle: "Điều khoản dịch vụ" },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policyDef = POLICY_MAP[slug];

  if (!policyDef) {
    return {
      title: "Không tìm thấy trang",
    };
  }

  const siteTexts = await getPublicSiteTexts();
  
  const title = siteTexts[`page.${policyDef.baseKey}.title`] || `${policyDef.fallbackTitle} - THRIFTED`;
  const desc = siteTexts[`page.${policyDef.baseKey}.desc`] || `Đọc thêm về ${policyDef.fallbackTitle.toLowerCase()} của THRIFTED.`;

  return {
    title,
    description: desc,
  };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policyDef = POLICY_MAP[slug];

  if (!policyDef) {
    notFound();
  }

  const siteTexts = await getPublicSiteTexts();
  
  const contentKey = slug === "consignment" ? "policy_page.consignment" :
                     slug === "privacy" ? "policy_page.privacy" :
                     slug === "sales" ? "policy_page.sales" : "policy_page.terms";
                     
  const content = siteTexts[contentKey] || "Nội dung đang được cập nhật...";
  const h1Text = siteTexts[`page.${policyDef.baseKey}.h1`] || policyDef.fallbackTitle;

  return (
    <div className="min-h-screen bg-zinc-50 pt-20 md:pt-24 pb-10 md:pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center text-[10px] md:text-xs text-zinc-500 mb-6 md:mb-8 overflow-x-auto whitespace-nowrap hide-scrollbar">
          <Link href="/" className="hover:text-black transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="w-3 h-3 mx-2 flex-shrink-0" />
          <span className="text-zinc-900 font-medium">{h1Text}</span>
        </div>

        {/* Content Box */}
        <div className="bg-white border border-zinc-200 p-5 sm:p-8 md:p-12 shadow-sm rounded-xl sm:rounded-none">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 mb-6 md:mb-8 border-b border-zinc-100 pb-4 md:pb-6 leading-snug">
            {h1Text}
          </h1>
          
          <div className="prose prose-zinc max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-a:text-blue-600">
            {content.split('\n').map((paragraph, index) => (
              paragraph.trim() ? (
                <p key={index} className="mb-4 text-zinc-700 text-[13px] sm:text-sm md:text-base leading-relaxed md:leading-7 text-justify sm:text-left">
                  {paragraph}
                </p>
              ) : (
                <br key={index} />
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
