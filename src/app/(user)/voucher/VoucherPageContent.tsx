"use client";

import { useState, useEffect } from "react";
import type { Voucher } from "@/lib/api";
import { formatPrice } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import { useRouter } from "next/navigation";

interface VoucherPageContentProps {
  initialVouchers: Voucher[];
}

function getDaysRemaining(validUntil: string): number {
  const now = new Date();
  const until = new Date(validUntil);
  const diff = until.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getDiscountLabel(voucher: Voucher): string {
  if (voucher.discountPercent) return `${Math.round(voucher.discountPercent)}%`;
  if (voucher.discountAmount) return formatPrice(voucher.discountAmount);
  return "";
}

function VoucherCard({
  voucher,
  isExpiredView,
}: {
  voucher: Voucher;
  isExpiredView?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const { setAppliedCoupon } = useCart();
  const router = useRouter();

  const now = new Date();
  const until = new Date(voucher.validUntil);
  const isActuallyExpired = until < now;
  const isExhausted = voucher.maxUses
    ? (voucher.usedCount || 0) >= voucher.maxUses
    : false;
  const isInactive = !voucher.isActive;

  const isDisabled =
    isExpiredView || isActuallyExpired || isExhausted || isInactive;

  const daysLeft = getDaysRemaining(voucher.validUntil);
  const isExpiringSoon = !isDisabled && daysLeft <= 3 && daysLeft > 0;
  const isAlmostFull =
    !isDisabled && voucher.maxUses
      ? (voucher.usedCount || 0) >= voucher.maxUses * 0.9
      : false;

  const handleCopy = async () => {
    if (isDisabled) return;
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = voucher.code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUse = () => {
    if (isDisabled) return;
    setAppliedCoupon(voucher);
    router.push("/shop");
  };

  return (
    <div
      className={`group relative bg-white border rounded-xl overflow-hidden transition-all duration-300 ${isDisabled ? "border-zinc-200 opacity-60 grayscale" : "border-zinc-200 hover:border-brand-red/40 hover:shadow-lg"}`}
    >
      {/* Discount Badge — top accent */}
      <div
        className={`${isDisabled ? "bg-zinc-500" : "bg-brand-red"} px-5 py-3 flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          <span className="text-white font-black text-xl tracking-tight">
            GIẢM {getDiscountLabel(voucher)}
          </span>
        </div>
        {isExpiringSoon && (
          <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            Sắp hết hạn
          </span>
        )}
        {isAlmostFull && (
          <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            Sắp hết lượt
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5">
        {/* Code */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex-1 bg-zinc-50 border border-dashed border-zinc-300 rounded-lg px-4 py-2.5 text-center">
            <span className="font-mono font-bold text-lg text-zinc-800 tracking-widest select-all">
              {voucher.code}
            </span>
          </div>
          <button
            onClick={handleCopy}
            disabled={isDisabled}
            className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-lg transition-all duration-200 ${isDisabled ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 active:scale-95"}`}
            title="Sao chép mã"
          >
            {copied ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Đã copy</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Description */}
        {voucher.description && (
          <p className="text-sm text-zinc-600 mb-4 leading-relaxed">
            {voucher.description}
          </p>
        )}

        {/* Conditions */}
        <div className="space-y-2 mb-5">
          {voucher.minOrderValue && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>
                Đơn tối thiểu{" "}
                <strong className="text-zinc-700">
                  {formatPrice(voucher.minOrderValue)}
                </strong>
              </span>
            </div>
          )}
          {voucher.maxDiscount && voucher.discountPercent && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span>
                Giảm tối đa{" "}
                <strong className="text-zinc-700">
                  {formatPrice(voucher.maxDiscount)}
                </strong>
              </span>
            </div>
          )}
          {voucher.maxUses && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>
                Còn{" "}
                <strong className="text-zinc-700">
                  {Math.max(0, voucher.maxUses - (voucher.usedCount || 0))}
                </strong>{" "}
                lượt sử dụng
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>
              Hết hạn{" "}
              <strong
                className={`${isExpiringSoon ? "text-brand-red" : "text-zinc-700"}`}
              >
                {daysLeft <= 0 ? "đã hết hạn" : `trong ${daysLeft} ngày`}
              </strong>
            </span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleUse}
          disabled={isDisabled}
          className={`w-full font-bold text-sm py-3 rounded-lg transition-colors duration-200 ${
            isDisabled
              ? "bg-zinc-200 text-zinc-500 cursor-not-allowed"
              : "bg-zinc-900 hover:bg-brand-red text-white active:scale-[0.98]"
          }`}
        >
          {isDisabled ? "Mã voucher hết hạn hoặc lượt dùng" : "Mua sắm ngay"}
        </button>
      </div>
    </div>
  );
}

export function VoucherPageContent({
  initialVouchers,
}: VoucherPageContentProps) {
  const [loading, setLoading] = useState(false);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const now = new Date();

  const activeVouchers = initialVouchers.filter((v) => {
    const from = new Date(v.validFrom);
    const until = new Date(v.validUntil);
    const isExpired = until < now;
    const isExhausted = v.maxUses ? (v.usedCount || 0) >= v.maxUses : false;
    return v.isActive && from <= now && !isExpired && !isExhausted;
  });

  const upcomingVouchers = initialVouchers.filter((v) => {
    const from = new Date(v.validFrom);
    const until = new Date(v.validUntil);
    const isExpired = until < now;
    const isExhausted = v.maxUses ? (v.usedCount || 0) >= v.maxUses : false;
    return v.isActive && from > now && !isExpired && !isExhausted;
  });

  const expiredVouchers = initialVouchers.filter((v) => {
    const until = new Date(v.validUntil);
    const isExpired = until < now;
    const isExhausted = v.maxUses ? (v.usedCount || 0) >= v.maxUses : false;
    return !v.isActive || isExpired || isExhausted;
  });

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 md:py-16">
      {/* Page Header */}
      <div className="max-w-2xl mx-auto text-center mb-16">
        <div className="flex items-center justify-center gap-3 mb-6 reveal">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand-red"
          >
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">
            Voucher
          </h1>
        </div>
        <p className="text-xl text-zinc-500 leading-relaxed reveal">
          Sưu tầm mã giảm giá hấp dẫn từ THRIFT.VN Vietnam. Tiết kiệm ngay khi
          mua sắm thời trang xa xỉ chính hãng.
        </p>
      </div>

      {/* How to use */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8 mb-16 max-w-3xl mx-auto reveal">
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand-red"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          Cách sử dụng
        </h2>
        <ol className="space-y-3 text-sm text-zinc-600">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-brand-red text-white text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
              1
            </span>
            <span>
              <strong className="text-zinc-800">Sao chép mã voucher</strong> bạn
              muốn sử dụng bằng nút "Copy" trên thẻ.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-brand-red text-white text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
              2
            </span>
            <span>
              <strong className="text-zinc-800">Chọn sản phẩm</strong> yêu thích
              và thêm vào giỏ hàng.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-brand-red text-white text-xs font-bold rounded-full flex items-center justify-center mt-0.5">
              3
            </span>
            <span>
              <strong className="text-zinc-800">Nhập mã</strong> tại bước thanh
              toán hoặc bấm "Mua sắm ngay" để áp dụng tự động.
            </span>
          </li>
        </ol>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-zinc-200 rounded-xl overflow-hidden"
            >
              <div className="bg-zinc-100 h-14 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-8 bg-zinc-100 rounded animate-pulse" />
                <div className="h-4 bg-zinc-50 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-zinc-50 rounded w-1/2 animate-pulse" />
                <div className="h-10 bg-zinc-100 rounded animate-pulse mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : activeVouchers.length === 0 &&
        upcomingVouchers.length === 0 &&
        expiredVouchers.length === 0 ? (
        <div className="text-center py-20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-zinc-300 mx-auto mb-6"
          >
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          <h3 className="text-xl font-bold text-zinc-600 mb-2">
            Chưa có voucher nào
          </h3>
          <p className="text-zinc-400">
            Hãy quay lại sau để xem các ưu đãi mới nhất từ THRIFT.VN Vietnam.
          </p>
        </div>
      ) : (
        <>
          {/* Active Vouchers */}
          {activeVouchers.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-8 reveal">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                  Mã đang hoạt động
                </h2>
                <span className="bg-brand-red/10 text-brand-red text-sm font-bold px-3 py-1 rounded-full">
                  {activeVouchers.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeVouchers.map((voucher, i) => (
                  <div
                    key={voucher.id}
                    className={`reveal ${i === 0 ? "sm:col-span-2 lg:col-span-1 lg:row-span-2" : ""}`}
                  >
                    <VoucherCard voucher={voucher} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Vouchers */}
          {upcomingVouchers.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-8 reveal">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-400">
                  Sắp ra mắt
                </h2>
                <span className="bg-zinc-200 text-zinc-500 text-sm font-bold px-3 py-1 rounded-full">
                  {upcomingVouchers.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingVouchers.map((voucher) => (
                  <div key={voucher.id} className="opacity-60">
                    <VoucherCard voucher={voucher} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expired Vouchers */}
          {expiredVouchers.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center gap-3 mb-8 reveal">
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-400">
                  Đã hết hạn / Hết lượt
                </h2>
                <span className="bg-zinc-200 text-zinc-500 text-sm font-bold px-3 py-1 rounded-full">
                  {expiredVouchers.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {expiredVouchers.map((voucher) => (
                  <div key={voucher.id} className="reveal">
                    <VoucherCard voucher={voucher} isExpiredView />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer note */}
      <div className="mt-16 text-center text-sm text-zinc-400 reveal">
        <p>
          Bạn cần hỗ trợ? Liên hệ với chúng tôi qua{" "}
          <a
            href="/contact"
            className="text-brand-red hover:underline font-medium"
          >
            trang Liên hệ
          </a>{" "}
          hoặc chat trực tiếp.
        </p>
      </div>
    </div>
  );
}
