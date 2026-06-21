"use client";

import Link from "next/link";
import { useAnnouncements, useSiteTexts } from "@/lib/site-texts-context";

export function FreeShippingBanner() {
  const { announcements } = useAnnouncements();
  const { get } = useSiteTexts();

  const freeshipText = get("ui.freeship_banner", "Freeship đơn từ 2 sản phẩm");

  const shopName = get("brand.shop_name", "THRIFT.VN");
  const shopTagline = get("brand.tagline", "Hàng Hiệu Ký Gửi & Săn Đồ Cũ");

  const displayItems =
    announcements.length > 0
      ? announcements
      : [
          {
            id: "1",
            text: `${shopName.toUpperCase()} - ${shopTagline.toUpperCase()}`,
            icon: "★",
            isActive: true,
          },
          { id: "2", text: "ĐỔI TRẢ TRONG 7 NGÀY", icon: "★", isActive: true },
          { id: "3", text: "AUTHENTIC GUARANTEED", icon: "★", isActive: true },
        ];

  return (
    <div className="bg-black text-white">
      {/* Top bar - Static */}
      <div className="py-2.5 border-b border-zinc-800">
        <div className="max-w-[1440px] mx-auto px-8 flex items-center justify-center gap-4 text-xs">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
            <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
            <circle cx="7" cy="18" r="2" />
            <path d="M15 18H9" />
            <circle cx="17" cy="18" r="2" />
          </svg>
          <span className="font-medium">
            {freeshipText}
          </span>
          <span className="text-zinc-600">|</span>
          <Link
            href="/shop"
            className="font-semibold hover:text-brand-red transition-colors"
          >
            Mua ngay
          </Link>
        </div>
      </div>

      {/* Bottom bar - Marquee */}
      <div className="py-2.5 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...displayItems, ...displayItems, ...displayItems].map(
            (item, idx) => (
              <span
                key={`${item.id}-${idx}`}
                className="inline-flex items-center gap-3 px-6"
              >
                <span className="text-brand-red text-xs">{item.icon}</span>
                <span className="text-xs font-medium tracking-wide uppercase">
                  {item.text}
                </span>
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
