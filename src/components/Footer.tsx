"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFooterConfig } from "@/lib/footer-context";
import { useSiteTexts } from "@/lib/site-texts-context";
import { convertDriveLink } from "@/lib/utils";

export function Footer() {
  const { config } = useFooterConfig();
  const siteTexts = useSiteTexts();
  const router = useRouter();
  const [orderCode, setOrderCode] = useState("");

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderCode.trim()) {
      router.push(`/track-order?orderId=${encodeURIComponent(orderCode.trim())}`);
    }
  };

  const shopName =
    siteTexts.get("brand.shop_name") || config?.shopName || "THRIFTED";
  const facebookUrl = siteTexts.get("social.facebook") || "#";
  const instagramUrl = siteTexts.get("social.instagram") || "#";

  const footerLogoUrl = convertDriveLink(config?.footerLogo || "");

  return (
    <footer className="bg-black text-white pt-16 pb-8 border-t border-white/5">
      <div className="max-w-[1440px] mx-auto px-8 sm:px-12 lg:px-16">
        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-12 mb-16">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="text-2xl font-black tracking-tighter mb-4 block hover:text-brand-red transition-colors"
            >
              {shopName}
            </Link>
            {footerLogoUrl && (
              <img
                src={footerLogoUrl}
                alt="Chứng nhận công thương"
                className="h-16 w-auto object-contain mb-4"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="space-y-1">
              {config?.ownerName && (
                <p className="text-[11px] text-zinc-500">
                  <span className="text-zinc-600 font-semibold">
                    Chủ hộ kinh doanh:
                  </span>{" "}
                  {config.ownerName}
                </p>
              )}
              {config?.businessLicense && (
                <p className="text-[11px] text-zinc-500">
                  <span className="text-zinc-600 font-semibold">
                    Giấy CNĐKKD:
                  </span>{" "}
                  {config.businessLicense}
                </p>
              )}
              {config?.licenseDate && (
                <p className="text-[11px] text-zinc-500">
                  <span className="text-zinc-600 font-semibold">Cấp:</span>{" "}
                  {config.licenseDate}
                </p>
              )}
              {config?.taxCode && (
                <p className="text-[11px] text-zinc-500">
                  <span className="text-zinc-600 font-semibold">
                    Mã số thuế:
                  </span>{" "}
                  <span className="font-mono">{config.taxCode}</span>
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 border border-zinc-800 flex items-center justify-center hover:border-white hover:bg-white hover:text-black transition-all text-zinc-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 border border-zinc-800 flex items-center justify-center hover:border-white hover:bg-white hover:text-black transition-all text-zinc-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Mua sắm */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-5 text-zinc-500">
              Mua sắm
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/shop"
                  className="text-zinc-400 hover:text-white transition-colors text-sm"
                >
                  Cửa hàng
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?filter=new"
                  className="text-zinc-400 hover:text-white transition-colors text-sm"
                >
                  Hàng mới về
                </Link>
              </li>
              <li>
                <Link
                  href="/wishlist"
                  className="text-zinc-400 hover:text-white transition-colors text-sm"
                >
                  Yêu thích
                </Link>
              </li>
              <li>
                <Link
                  href="/sell"
                  className="text-zinc-400 hover:text-white transition-colors text-sm"
                >
                  Bán hàng cùng {shopName}
                </Link>
              </li>
            </ul>
          </div>

          {/* Hỗ trợ */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-5 text-zinc-500">
              Hỗ trợ
            </h4>
            <ul className="space-y-3 mb-6">
              <li>
                <Link
                  href="/track-order"
                  className="text-zinc-400 hover:text-white transition-colors text-sm"
                >
                  Tra cứu đơn hàng
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-zinc-400 hover:text-white transition-colors text-sm"
                >
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-zinc-400 hover:text-white transition-colors text-sm"
                >
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link
                  href="/policy/privacy"
                  className="text-zinc-400 hover:text-white transition-colors text-sm"
                >
                  Chính sách bảo mật
                </Link>
              </li>
            </ul>
            <form onSubmit={handleTrackOrder} className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                Kiểm tra đơn hàng
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  placeholder="Mã đơn hàng..."
                  className="bg-zinc-900 border border-zinc-800 text-sm text-white px-3 py-2 w-full focus:outline-none focus:border-zinc-500 transition-colors"
                />
                <button
                  type="submit"
                  className="bg-brand-red text-white px-3 py-2 text-sm font-bold hover:bg-red-700 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Về */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-5 text-zinc-500">
              Về {shopName}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/policy/consignment"
                  className="text-zinc-400 hover:text-white transition-colors text-sm"
                >
                  Chính sách ký gửi
                </Link>
              </li>
              <li>
                <Link
                  href="/policy/sales"
                  className="text-zinc-400 hover:text-white transition-colors text-sm"
                >
                  Chính sách bán hàng
                </Link>
              </li>
              <li>
                <Link
                  href="/policy/terms"
                  className="text-zinc-400 hover:text-white transition-colors text-sm"
                >
                  Điều khoản dịch vụ
                </Link>
              </li>
              <li>
                <Link
                  href="/account"
                  className="text-zinc-400 hover:text-white transition-colors text-sm"
                >
                  Tài khoản của tôi
                </Link>
              </li>
            </ul>
            {siteTexts.get("contact.hotline") || config?.shopPhone ? (
              <div className="mt-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">
                  Hotline
                </p>
                <a
                  href={`tel:${siteTexts.get("contact.hotline") || config?.shopPhone}`}
                  className="text-sm font-semibold text-white hover:text-brand-red transition-colors"
                >
                  {siteTexts.get("contact.hotline") || config?.shopPhone}
                </a>
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-900 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-zinc-600 text-[11px] uppercase tracking-wider">
            &copy; 2026 {shopName}. All rights reserved.
          </p>
          <div className="flex gap-3 opacity-25 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
            <div className="w-9 h-5 border border-zinc-700 rounded-sm bg-zinc-900 flex items-center justify-center text-[7px] font-bold tracking-tight">
              VISA
            </div>
            <div className="w-9 h-5 border border-zinc-700 rounded-sm bg-zinc-900 flex items-center justify-center text-[7px] font-bold tracking-tight">
              MASTER
            </div>
            <div className="w-9 h-5 border border-zinc-700 rounded-sm bg-zinc-900 flex items-center justify-center text-[7px] font-bold tracking-tight">
              VNPAY
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
