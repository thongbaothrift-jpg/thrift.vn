"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { trackOrder, TrackedOrder } from "@/lib/api/reviews-notifications";
import { formatPrice } from "@/lib/api";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMethod(method: string): string {
  const labels: Record<string, string> = {
    COD: "COD",
    VNPAY: "VNPay",
    BANK_TRANSFER: "Chuyển khoản",
  };
  return labels[method] || method;
}

function PaymentBadge({ label, variant }: { label: string; variant: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    SUCCESS: "bg-green-100 text-green-700 border-green-200",
    FAILED: "bg-red-100 text-red-700 border-red-200",
    CANCELLED: "bg-zinc-100 text-zinc-600 border-zinc-200",
    EXPIRED: "bg-zinc-100 text-zinc-600 border-zinc-200",
    REFUNDED: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${styles[label] || "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
      {variant}
    </span>
  );
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("orderId") || "");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const prefilledId = searchParams.get("orderId");
    if (prefilledId) {
      setOrderId(prefilledId);
    }
  }, [searchParams]);

    const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);

    try {
      // Loại bỏ prefix "ORD-" nếu có
      let cleanId = orderId.trim().toLowerCase();
      if (cleanId.startsWith('ord-')) {
        cleanId = cleanId.substring(4);
      }
      const result = await trackOrder(cleanId);
      setOrder(result);
    } catch (err: any) {
      setError(err.message || "Không tìm thấy đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-8 py-16">
      <nav className="mb-8">
        <ol className="flex items-center gap-2 text-sm text-zinc-400">
          <Link href="/" className="hover:text-black transition-colors uppercase tracking-widest text-[10px] font-bold">Trang chủ</Link>
          <span className="text-zinc-300">/</span>
          <span className="text-black font-bold uppercase tracking-widest text-[10px]">Tra cứu đơn hàng</span>
        </ol>
      </nav>

      <div className="max-w-lg mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-3">Tra cứu đơn hàng</h1>
          <p className="text-zinc-500 text-sm">Nhập mã đơn hàng và số điện thoại đã đặt</p>
        </div>

        <form onSubmit={handleTrack} className="bg-zinc-50 border border-zinc-200 p-8 mb-10 space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Mã đơn hàng</label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="VD: a1b2c3d4 hoặc ORD-A1B2C3D4"
              className="w-full bg-white border border-zinc-200 px-4 py-3 focus:border-black focus:outline-none transition-colors font-medium text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 disabled:opacity-50"
          >
            {loading ? "Đang tra cứu..." : "Tra cứu đơn hàng"}
          </button>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">
              {error}
            </div>
          )}
        </form>

        <p className="text-center text-zinc-400 text-xs mb-8">
          Cần hỗ trợ thêm?{" "}
          <Link href="/contact" className="underline hover:text-black">
            Liên hệ hotline 1900 1234
          </Link>
        </p>
      </div>

      {order && (
        <div className="max-w-2xl mx-auto mt-4 space-y-8">
          <div className="bg-zinc-900 text-white p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Mã đơn hàng</p>
                <p className="text-2xl font-black font-mono">ORD-{order.shortId}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Tổng cộng</p>
                <p className="text-2xl font-black text-brand-red">{formatPrice(order.total)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <PaymentBadge label={order.orderStatus} variant={order.orderStatusLabel} />
              <PaymentBadge label={order.paymentStatus} variant={order.paymentStatusLabel} />
              {order.trackingCode && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border bg-white/10 text-white border-white/20">
                  Mã vận đơn: {order.trackingCode}
                </span>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Tiến trình đơn hàng</h2>
              {order.ssJourney && order.ssJourney.length > 0 ? (
              <div className="relative">
                {order.ssJourney.map((step, idx) => (
                  <div key={idx} className="flex gap-4 pb-8 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black ${
                        idx === order.ssJourney.length - 1 ? 'bg-black text-white' : 'bg-white border-2 border-zinc-200 text-zinc-400'
                      }`}>
                        {idx + 1}
                      </div>
                      {idx < order.ssJourney.length - 1 && (
                        <div className={`w-0.5 flex-1 mt-2 ${idx === order.ssJourney.length - 2 ? 'bg-black' : 'bg-zinc-200'}`} />
                      )}
                    </div>
                    <div className="pt-1">
                      <p className={`text-sm font-bold ${idx === order.ssJourney.length - 1 ? 'text-black' : 'text-zinc-500'}`}>
                        {step.status}
                      </p>
                      {step.location && (
                        <p className="text-xs text-zinc-400 mt-0.5">{step.location}</p>
                      )}
                      {step.note && (
                        <p className="text-xs text-zinc-400 mt-0.5 italic">{step.note}</p>
                      )}
                      <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                        {new Date(step.time).toLocaleString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative">
                {order.timeline.map((step, idx) => (
                  <div key={step.key} className="flex gap-4 pb-8 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        step.completed
                          ? 'bg-black text-white'
                          : step.current
                          ? 'bg-white border-2 border-black text-black'
                          : 'bg-white border-2 border-zinc-200 text-zinc-300'
                      }`}>
                        {step.completed ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <span className="text-xs font-bold">{idx + 1}</span>
                        )}
                      </div>
                      {idx < order.timeline.length - 1 && (
                        <div className={`w-0.5 flex-1 mt-2 ${step.completed ? 'bg-black' : 'bg-zinc-200'}`} />
                      )}
                    </div>
                    <div className="pt-1">
                      <p className={`text-sm font-bold ${step.completed || step.current ? 'text-black' : 'text-zinc-400'}`}>
                        {step.label}
                      </p>
                      {step.current && (
                        <p className="text-xs text-zinc-500 mt-1">Cập nhật lúc {formatDate(order.updatedAt)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Sản phẩm đã đặt</h2>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 bg-zinc-50 border border-zinc-100 p-4">
                  {item.image ? (
                    <div className="relative w-16 h-20 flex-shrink-0 overflow-hidden">
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                    </div>
                  ) : (
                    <div className="w-16 h-20 bg-zinc-200 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{item.brand || "THRIFTED"}</p>
                    <p className="text-sm font-bold text-zinc-900 leading-tight">{item.name}</p>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                      <span>SL: <span className="text-black font-semibold">{item.quantity}</span></span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center text-right">
                    <p className="text-sm font-bold text-black">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Thông tin giao hàng</h2>
            <div className="bg-zinc-50 border border-zinc-100 p-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Người nhận</span>
                <span className="font-bold">{order.shippingName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Số điện thoại</span>
                <span className="font-bold">{order.shippingPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Địa chỉ</span>
                <span className="font-bold text-right max-w-[60%]">{order.shippingAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Phương thức</span>
                <span className="font-bold">{formatMethod(order.paymentMethod)}</span>
              </div>
              {order.couponCode && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Mã giảm giá</span>
                  <span className="font-bold text-brand-red">{order.couponCode}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-200 pt-3 mt-3">
                <span className="font-bold">Tổng cộng</span>
                <span className="font-black text-brand-red">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4 pt-4">
            <p className="text-zinc-400 text-xs">Cần hỗ trợ thêm? Liên hệ hotline <strong className="text-black">1900 1234</strong> (8h–21h, T2–T7).</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/shop" className="btn-ghost px-8">Tiếp tục mua sắm</Link>
              <Link href="/contact" className="btn-primary px-8">Liên hệ hỗ trợ</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[1440px] mx-auto px-8 py-16 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}
