"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { getOrder, cancelOrder, type Order, checkReturnRequest } from "@/lib/api/orders";
import { ReturnRequestForm } from "@/components/return-request/ReturnRequestForm";
import { ReturnRequestStatus } from "@/components/return-request/ReturnRequestStatus";
import { convertDriveLink } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(price);

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Đang xử lý", color: "text-yellow-700", bg: "bg-yellow-100" },
  PROCESSING: { label: "Đang chuẩn bị", color: "text-blue-700", bg: "bg-blue-100" },
  SHIPPED: { label: "Đang giao", color: "text-purple-700", bg: "bg-purple-100" },
  DELIVERED: { label: "Đã giao", color: "text-green-700", bg: "bg-green-100" },
  CANCELLED: { label: "Đã hủy", color: "text-red-700", bg: "bg-red-100" },
  PAYMENT_EXPIRED: { label: "Hết hạn thanh toán", color: "text-red-700", bg: "bg-red-100" },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Chưa thanh toán", color: "text-yellow-700", bg: "bg-yellow-100" },
  SUCCESS: { label: "Đã thanh toán", color: "text-green-700", bg: "bg-green-100" },
  FAILED: { label: "Thanh toán thất bại", color: "text-red-700", bg: "bg-red-100" },
  CANCELLED: { label: "Đã hủy", color: "text-red-700", bg: "bg-red-100" },
  EXPIRED: { label: "Hết hạn", color: "text-red-700", bg: "bg-red-100" },
  REFUNDED: { label: "Đã hoàn tiền", color: "text-orange-700", bg: "bg-orange-100" },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng (COD)",
  VNPAY: "VNPay",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
  CARD: "Thẻ",
};

const ORDER_TIMELINE = [
  { key: "PENDING", label: "Đặt hàng thành công" },
  { key: "PROCESSING", label: "Xác nhận đơn hàng" },
  { key: "SHIPPED", label: "Đang vận chuyển" },
  { key: "DELIVERED", label: "Đã giao hàng" },
];

const STATUS_ORDER = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

function getTimelineSteps(status: string) {
  return ORDER_TIMELINE.map((step) => {
    const stepIdx = STATUS_ORDER.indexOf(step.key);
    const currentIdx = STATUS_ORDER.indexOf(status);
    return {
      ...step,
      completed: stepIdx <= currentIdx,
      current: step.key === status,
      cancelled: status === "CANCELLED" || status === "PAYMENT_EXPIRED",
    };
  });
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "details">("timeline");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [returnCheck, setReturnCheck] = useState<{
    canRequest: boolean;
    error?: string;
    existingRequest?: { id: string; status: string; createdAt: string } | null;
    config?: { allowReturnDays: number; requireReturnImage: boolean };
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    getOrder(params.id as string)
      .then(setOrder)
      .catch((e) => {
        if (e.message?.includes("404")) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [params.id, isAuthenticated]);

  // Check return eligibility for DELIVERED orders
  useEffect(() => {
    if (!order || order.status !== "DELIVERED") return;
    checkReturnRequest(params.id as string)
      .then(setReturnCheck)
      .catch(() => { });
  }, [order, params.id]);

  const handleCancel = async () => {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
    setCancelling(true);
    setCancelError("");
    try {
      const updated = await cancelOrder(params.id as string);
      setOrder(updated);
    } catch (e: any) {
      setCancelError(e.message || "Hủy đơn thất bại.");
    } finally {
      setCancelling(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-12 text-center">
        <p className="text-zinc-500 mb-4">Vui lòng đăng nhập để xem đơn hàng.</p>
        <Link href="/auth/login" className="btn-primary inline-block">Đăng nhập</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-12 space-y-6">
        <div className="h-8 w-48 bg-zinc-100 animate-pulse rounded" />
        <div className="h-64 bg-zinc-100 animate-pulse rounded" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-12 text-center">
        <p className="text-zinc-500 mb-4">Không tìm thấy đơn hàng.</p>
        <Link href="/account" className="btn-ghost inline-block">Quay lại tài khoản</Link>
      </div>
    );
  }

  const sc = ORDER_STATUS_CONFIG[order.status] || { label: order.status, color: "text-zinc-700", bg: "bg-zinc-100" };
  const psc = PAYMENT_STATUS_CONFIG[order.paymentStatus] || { label: order.paymentStatus, color: "text-zinc-700", bg: "bg-zinc-100" };
  const steps = getTimelineSteps(order.status);

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-12">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center gap-2 text-sm text-zinc-500">
          <li><Link href="/account" className="hover:text-black transition-colors">Tài khoản</Link></li>
          <li>/</li>
          <li><Link href="/account?tab=purchases" className="hover:text-black transition-colors">Lịch sử mua hàng</Link></li>
          <li>/</li>
          <li className="text-black font-medium">Đơn #{order.id.slice(0, 8).toUpperCase()}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Theo dõi đơn hàng</h1>
          <p className="text-zinc-500 mt-1">Ngày đặt: {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`px-4 py-2 text-sm font-semibold rounded-full ${sc.bg} ${sc.color}`}>
            {sc.label}
          </span>
          <span className={`px-4 py-2 text-sm font-semibold rounded-full ${psc.bg} ${psc.color}`}>
            {psc.label}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 mb-8">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab("timeline")}
            className={`pb-4 font-label transition-colors relative ${activeTab === "timeline" ? "text-black border-b-2 border-black" : "text-zinc-500 hover:text-black"
              }`}
          >
            Tình trạng đơn hàng
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-4 font-label transition-colors relative ${activeTab === "details" ? "text-black border-b-2 border-black" : "text-zinc-500 hover:text-black"
              }`}
          >
            Chi tiết đơn hàng
          </button>
        </nav>
      </div>

      {activeTab === "timeline" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-zinc-200 p-8">
              <h2 className="text-xl font-bold uppercase tracking-tight mb-8">
                {order.status === "CANCELLED" || order.status === "PAYMENT_EXPIRED"
                  ? order.status === "PAYMENT_EXPIRED"
                    ? "Đơn hàng hết hạn thanh toán"
                    : "Đơn hàng đã bị hủy"
                  : "Tình trạng vận chuyển"}
              </h2>

              {order.status === "CANCELLED" ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                  <p className="text-zinc-500">Đơn hàng này đã bị hủy.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-zinc-200" />
                  <div className="space-y-0">
                    {steps.map((step, idx) => (
                      <div key={step.key} className="relative flex gap-6 pb-8 last:pb-0">
                        <div
                          className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.completed
                              ? step.current
                                ? "bg-brand-red text-white"
                                : "bg-black text-white"
                              : "bg-zinc-200 text-zinc-400"
                            }`}
                        >
                          {step.completed && !step.current ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : step.current ? (
                            <div className="w-3 h-3 bg-white rounded-full" />
                          ) : (
                            <span className="text-xs font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <div className="pt-1 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <h3 className={`font-bold ${step.completed ? "text-black" : "text-zinc-400"}`}>
                              {step.label}
                            </h3>
                            {step.current && (
                              <span className="px-2 py-0.5 bg-brand-red/10 text-brand-red text-xs font-semibold rounded">
                                Hiện tại
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(order.status === "PENDING" || order.status === "PROCESSING") && (
                <div className="mt-6 pt-6 border-t border-zinc-200">
                  {cancelError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm mb-4">
                      {cancelError}
                    </div>
                  )}
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="bg-red-600 text-white px-6 py-3 font-label hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {cancelling ? "Đang hủy..." : "Hủy đơn hàng"}
                  </button>
                </div>
              )}

              {/* Return Request Section */}
              {order.returnRequests && order.returnRequests.length > 0 && (
                <div className="mt-6 pt-6 border-t border-zinc-200">
                  <h3 className="font-bold uppercase tracking-tight mb-4">Yêu cầu hoàn hàng</h3>
                  <div className="space-y-3">
                    {order.returnRequests.map((rr) => (
                      <ReturnRequestStatus
                        key={rr.id}
                        status={rr.status}
                        orderId={order.id}
                        adminNote={rr.adminNote}
                        createdAt={rr.createdAt}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Form yêu cầu hoàn — chỉ cho DELIVERED + chưa có yêu cầu */}
              {order.status === "DELIVERED" && returnCheck && !order.returnRequests?.length && (
                <div className="mt-6 pt-6 border-t border-zinc-200">
                  {/* Ưu tiên: nếu đã có yêu cầu hoàn hàng → hiển thị trạng thái */}
                  {returnCheck.existingRequest ? (
                    <ReturnRequestStatus
                      status={returnCheck.existingRequest.status}
                      orderId={order.id}
                      createdAt={returnCheck.existingRequest.createdAt}
                    />
                  ) : returnCheck.canRequest ? (
                    /* Chưa có yêu cầu + trong thời hạn → hiển thị form */
                    <ReturnRequestForm
                      orderId={order.id}
                      requireImage={returnCheck.config?.requireReturnImage ?? true}
                      onSuccess={() => {
                        checkReturnRequest(params.id as string).then(setReturnCheck).catch(() => { });
                      }}
                    />
                  ) : returnCheck.config ? (
                    /* Hết thời hạn hoặc không thể yêu cầu */
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-sm text-red-700 mb-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-semibold">Không thể yêu cầu hoàn hàng</span>
                      </div>
                      <p className="text-xs text-red-600">
                        {returnCheck.error || `Yêu cầu hoàn hàng phải được gửi trong vòng ${returnCheck.config.allowReturnDays} ngày sau khi nhận hàng.`}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Info Cards */}
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200 p-6">
              <h3 className="font-bold uppercase tracking-tight mb-4">Địa chỉ giao hàng</h3>
              <div className="text-sm space-y-1">
                <p className="font-semibold">{order.shippingName}</p>
                <p className="text-zinc-600">{order.shippingPhone}</p>
                <p className="text-zinc-600">{order.shippingAddress}</p>
                <p className="text-zinc-600">{order.shippingDistrict}, {order.shippingCity}</p>
                {order.shippingPostal && <p className="text-zinc-400">{order.shippingPostal}</p>}
              </div>
            </div>

            <div className="bg-white border border-zinc-200 p-6">
              <h3 className="font-bold uppercase tracking-tight mb-4">Thanh toán</h3>
              <p className="font-semibold text-sm">{PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</p>
              {order.isDepositRequired && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded text-xs">
                  <p className="text-amber-700 font-medium">Đơn đặt cọc 10%</p>
                  <p className="text-amber-600">Đã cọc: {formatPrice(order.depositAmount || 0)}</p>
                  {order.depositPaid ? (
                    <p className="text-green-600">Đã thanh toán đủ</p>
                  ) : (
                    <p className="text-amber-600">Còn lại: {formatPrice((order.total || 0) - (order.depositAmount || 0))} (COD)</p>
                  )}
                </div>
              )}
              <p className="text-sm font-bold mt-2 text-brand-red">
                {formatPrice(
                  order.isDepositRequired
                    ? (order.total - (order.depositAmount || 0))
                    : order.total
                )}
              </p>
            </div>

            {/* SuperShip Tracking */}
            {order.trackingCode && (
              <div className="bg-white border border-zinc-200 p-6 space-y-3">
                <h3 className="font-bold uppercase tracking-tight mb-1">SuperShip</h3>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Mã vận đơn</span>
                    <span className="text-sm font-bold font-mono">{order.trackingCode}</span>
                  </div>
                  {order.shippingStatusLabel && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Trạng thái</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${order.shippingStatus === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                          order.shippingStatus === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700' :
                            order.shippingStatus === 'RETURNED' ? 'bg-red-100 text-red-700' :
                              'bg-zinc-100 text-zinc-700'
                        }`}>
                        {order.shippingStatusLabel}
                      </span>
                    </div>
                  )}
                </div>
                <a
                  href={`https://tracking.supership.vn/?code=${order.trackingCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 mt-3 py-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" x2="21" y1="14" y2="3" />
                  </svg>
                  Theo dõi trên SuperShip
                </a>
              </div>
            )}

            <Link
              href={`/account/invoice/${order.id}`}
              className="btn-ghost w-full text-center block"
            >
              Tải hóa đơn
            </Link>
          </div>
        </div>
      )}

      {activeTab === "details" && (
        <div className="space-y-8">
          {/* Products */}
          <div className="bg-white border border-zinc-200 overflow-hidden">
            <div className="p-6 border-b border-zinc-200 bg-zinc-50">
              <h2 className="font-bold uppercase tracking-tight">Sản phẩm đã đặt</h2>
            </div>
            <div className="divide-y divide-zinc-200">
              {(order.items || []).map((item) => (
                <div key={item.id} className="p-6 flex gap-6">
                  <div className="relative w-24 h-32 bg-zinc-100 overflow-hidden flex-shrink-0">
                    {item.product?.images?.[0] ? (
                      <Image
                        src={convertDriveLink(item.product.images[0])}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs">No image</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.product?.name || "Sản phẩm đã xóa"}</h3>
                    {item.size && (
                      <p className="text-sm text-zinc-500 mt-1">Size: {item.size}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                      <span className="font-bold text-lg">{formatPrice(item.price)}</span>
                      <span className="text-zinc-500">x{item.quantity}</span>
                    </div>
                    {item.product?.slug && (
                      <div className="flex gap-3 mt-4">
                        <Link
                          href={`/product/${item.product.slug}`}
                          className="text-sm text-zinc-600 hover:text-black underline transition-colors"
                        >
                          Xem sản phẩm
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white border border-zinc-200 p-6">
            <h2 className="font-bold uppercase tracking-tight mb-6">Tổng kết đơn hàng</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Tạm tính</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Phí vận chuyển</span>
                <span>{formatPrice(order.shippingFee)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Thuế</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
              )}
              {order.couponDiscount && order.couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Giảm giá {order.coupon ? `(${order.coupon.code})` : ""}</span>
                  <span>-{formatPrice(order.couponDiscount)}</span>
                </div>
              )}
              {order.isDepositRequired && order.depositAmount != null && order.depositAmount > 0 && (
                <div className="flex justify-between text-sm text-amber-600">
                  <span>Đặt cọc (10%)</span>
                  <span>-{formatPrice(order.depositAmount!)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-3 border-t border-zinc-200">
                <span>{order.isDepositRequired ? "Số tiền còn lại (COD)" : "Tổng cộng"}</span>
                <span className="text-brand-red">
                  {formatPrice(
                    order.isDepositRequired
                      ? (order.total - (order.depositAmount || 0))
                      : order.total
                  )}
                </span>
              </div>
              {order.isDepositRequired && (
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>Tổng giá trị đơn hàng</span>
                  <span className="line-through">{formatPrice(order.total)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {order.status !== "CANCELLED" && order.status !== "DELIVERED" && order.status !== "PAYMENT_EXPIRED" && (
            <div className="flex flex-wrap gap-4 justify-end">
              <button className="btn-ghost">Liên hệ hỗ trợ</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
