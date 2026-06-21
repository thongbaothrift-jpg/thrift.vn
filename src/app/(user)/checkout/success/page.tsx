"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const txnRef = params.get("txnRef");
  const pending = params.get("pending") === "1";

  const [confirmed, setConfirmed] = useState(!pending);
  const [pollCount, setPollCount] = useState(0);
  const [serverTime, setServerTime] = useState<Date | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  // Lấy server time và expiresAt từ backend ngay khi mount
  useEffect(() => {
    if (!orderId || !pending) return;

    const fetchServerTime = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/payments/status/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          // Backend trả expiresAt — dùng làm source of truth
          if (data.payment?.expiresAt) {
            setExpiresAt(new Date(data.payment.expiresAt));
          }
          // Dùng response headers làm server time approximation
          const dateHeader = res.headers.get("date");
          if (dateHeader) {
            setServerTime(new Date(dateHeader));
          }
        }
      } catch (_) {}
    };

    fetchServerTime();
  }, [orderId, pending]);

  // Poll payment status until IPN confirms (max đến expiresAt hoặc 15 ph)
  useEffect(() => {
    if (!orderId || !pending) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/payments/status/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.payment?.status === "SUCCESS") {
            setConfirmed(true);
            clearInterval(interval);
            return;
          }
          if (
            ["FAILED", "CANCELLED", "EXPIRED"].includes(data.payment?.status)
          ) {
            window.location.href = `/checkout/failed?orderId=${orderId}&code=${data.payment?.vnpResponseCode || "99"}`;
            clearInterval(interval);
            return;
          }
        }
      } catch (_) {}

      setPollCount((c) => {
        const MAX_POLLS = 900; // 15 phút × 60 giây
        const now = new Date();

        // Nếu có expiresAt từ backend → dừng khi hết hạn
        if (expiresAt && now >= expiresAt) {
          clearInterval(interval);
          setConfirmed(true);
          return c;
        }

        // Nếu polling quá lâu (15 ph) → dừng
        if (c >= MAX_POLLS) {
          clearInterval(interval);
          setConfirmed(true);
        }
        return c + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orderId, pending, expiresAt]);

  return (
    <div className="max-w-[1440px] mx-auto px-8 py-24 text-center">
      <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-10 border-2 border-green-200">
        {confirmed ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <div className="w-16 h-16 border-4 border-green-300 border-t-green-600 rounded-full animate-spin" />
        )}
      </div>

      <h1 className="text-5xl font-black uppercase tracking-tighter mb-6">
        {confirmed ? "Thanh toán thành công!" : "Đang xác nhận..."}
      </h1>

      {confirmed ? (
        <>
          <p className="text-zinc-500 text-lg mb-4">
            Cảm ơn bạn đã thanh toán qua VNPay.
          </p>
          {orderId && (
            <p className="text-sm font-bold text-zinc-900 mb-10">
              Mã đơn hàng:{" "}
              <span className="text-brand-red">
                ORD-{orderId.slice(0, 8).toUpperCase()}
              </span>
            </p>
          )}
          <div className="max-w-md mx-auto bg-zinc-50 p-6 border border-zinc-100 mb-12 text-left space-y-3 text-sm text-zinc-600">
            <p>Email xác nhận đã được gửi đến bạn.</p>
            <p>
              Nhân viên THRIFT.VN sẽ gọi điện xác nhận trong vòng 24h tới.
            </p>
            <p>
              Đơn hàng sẽ được đóng gói và vận chuyển sau khi xác nhận thanh
              toán.
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="text-zinc-500 text-lg mb-4">
            Giao dịch của bạn đã được ghi nhận. Đang chờ xác nhận từ VNPay...
          </p>
          <p className="text-xs text-zinc-400 mb-8">
            Vui lòng không đóng trình duyệt. Đang xác nhận ({pollCount}s)...
          </p>
        </>
      )}

      {confirmed && (
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/account" className="btn-primary px-10 py-4">
            Xem đơn hàng
          </Link>
          <Link href="/shop" className="btn-ghost px-10 py-4">
            Tiếp tục mua sắm
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VNPaySuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1440px] mx-auto px-8 py-24 text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
