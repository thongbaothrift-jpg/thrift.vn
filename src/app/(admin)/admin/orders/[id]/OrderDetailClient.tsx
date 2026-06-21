"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  confirmOrder,
  cancelOrder,
  rejectOrder,
  updateOrderPaymentStatus,
  updateOrderDepositStatus,
  createSupershipOrder,
  syncSupershipByOrderId,
  getAdminOrder,
  printSuperShipLabel,
  approveReturnRequest,
  rejectReturnRequest,
  completeReturnRequest,
  type AdminOrder,
} from "@/lib/api/admin";
import { OrderEditModal } from "@/components/admin/OrderEditModal";
import { convertDriveLink } from "@/lib/utils";
import {
  ArrowLeft,
  CreditCard,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  Info,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Pencil,
  Printer,
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Đang xử lý",
  SHIPPING: "Đang giao hàng",
  SHIPPED: "Đã giao cho shipper",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
  PAYMENT_EXPIRED: "Hết hạn thanh toán",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  PAYMENT_EXPIRED: "bg-red-100 text-red-800",
};

// SuperShip shipping status
const SHIPPING_STATUS_LABELS: Record<string, string> = {
  PENDING_PICKUP: "Chờ lấy hàng",
  PICKING_UP: "Đang lấy hàng",
  IN_TRANSIT: "Đang vận chuyển",
  DELIVERING: "Đang giao hàng",
  DELIVERED: "Đã giao hàng",
  RETURNING: "Đang hoàn hàng",
  RETURNED: "Đã hoàn hàng",
  CANCELLED: "Đã hủy",
};

const SHIPPING_STATUS_COLORS: Record<string, string> = {
  PENDING_PICKUP: "bg-amber-100 text-amber-800",
  PICKING_UP: "bg-yellow-100 text-yellow-800",
  IN_TRANSIT: "bg-blue-100 text-blue-800",
  DELIVERING: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  RETURNING: "bg-orange-100 text-orange-800",
  RETURNED: "bg-red-100 text-red-800",
  CANCELLED: "bg-red-100 text-red-800",
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderDetailClient({
  initialOrder,
}: {
  initialOrder: AdminOrder;
}) {
  const router = useRouter();
  const [order, setOrder] = useState<AdminOrder>(initialOrder);
  const [updating, setUpdating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReturnApproveModal, setShowReturnApproveModal] = useState(false);
  const [returnApproveNote, setReturnApproveNote] = useState("");
  const [showReturnRejectModal, setShowReturnRejectModal] = useState(false);
  const [returnRejectNote, setReturnRejectNote] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  const refreshOrder = async () => {
    const updated = await getAdminOrder(order.id);
    if (updated) setOrder(updated);
  };

  const handleConfirm = async () => {
    if (
      !confirm(
        'Xác nhận đơn hàng này?\n\nĐơn sẽ chuyển sang trạng thái "Đang xử lý" và tạo vận đơn SuperShip.',
      )
    )
      return;
    setUpdating(true);
    try {
      const updated = await confirmOrder(order.id);
      setOrder(updated);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Loi xac nhan");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    setUpdating(true);
    try {
      const updated = await cancelOrder(order.id, cancelReason);
      setOrder(updated);
      setShowCancelModal(false);
      setCancelReason("");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi hủy đơn");
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối.");
      return;
    }
    setUpdating(true);
    try {
      const updated = await rejectOrder(order.id, rejectReason);
      setOrder(updated);
      setShowRejectModal(false);
      setRejectReason("");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi từ chối đơn");
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentConfirm = async () => {
    setUpdating(true);
    try {
      const updated = await updateOrderPaymentStatus(order.id, "SUCCESS");
      setOrder(updated);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi cập nhật");
    } finally {
      setUpdating(false);
    }
  };

  const handleDepositConfirm = async () => {
    setUpdating(true);
    try {
      const updated = await updateOrderDepositStatus(order.id, true);
      setOrder(updated);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi cập nhật");
    } finally {
      setUpdating(false);
    }
  };

  const handleReturnApprove = async () => {
    setUpdating(true);
    try {
      const updated = await approveReturnRequest(
        (order as any).returnRequests?.[0]?.id,
        returnApproveNote,
      );
      await refreshOrder();
      setShowReturnApproveModal(false);
      setReturnApproveNote("");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi duyệt hoàn hàng");
    } finally {
      setUpdating(false);
    }
  };

  const handleReturnReject = async () => {
    if (!returnRejectNote.trim()) {
      alert("Vui lòng nhập lý do từ chối.");
      return;
    }
    setUpdating(true);
    try {
      await rejectReturnRequest(
        (order as any).returnRequests?.[0]?.id,
        returnRejectNote,
      );
      await refreshOrder();
      setShowReturnRejectModal(false);
      setReturnRejectNote("");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi từ chối hoàn hàng");
    } finally {
      setUpdating(false);
    }
  };

  const handleReturnComplete = async () => {
    if (
      !confirm(
        "Xác nhận đã hoàn tiền cho khách?\n\nHành động này sẽ đánh dấu yêu cầu hoàn hàng là Hoàn thành.",
      )
    )
      return;
    setUpdating(true);
    try {
      await completeReturnRequest((order as any).returnRequests?.[0]?.id);
      await refreshOrder();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi hoàn thành hoàn hàng");
    } finally {
      setUpdating(false);
    }
  };

  const returnReq = (order as any).returnRequests?.[0] as
    | {
      id: string;
      status: string;
      reason: string;
      reasonText?: string | null;
      images: string[];
      adminNote?: string | null;
      createdAt: string;
      updatedAt: string;
    }
    | undefined;
  const RETURN_REASON_LABELS: Record<string, string> = {
    DEFECTIVE_PRODUCT: "Sản phẩm lỗi / không đúng mô tả",
    WRONG_ITEM: "Giao sai sản phẩm",
    SIZE_FIT_ISSUE: "Kích thước không phù hợp",
    CHANGE_MIND: "Đổi ý",
    OTHER: "Lý do khác",
  };
  const RETURN_STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-blue-100 text-blue-800",
    REJECTED: "bg-red-100 text-red-800",
    COMPLETED: "bg-green-100 text-green-800",
  };

  const handleCreateSupershipOrder = async () => {
    // Ràng buộc: đơn COD cọc phải xác nhận cọc, đơn VNPay/Bank phải thanh toán thành công
    if (
      order.paymentMethod === "COD" &&
      order.isDepositRequired &&
      !order.depositPaid
    ) {
      alert(
        "Đơn COD yêu cầu đặt cọc. Vui lòng xác nhận đặt cọc trước khi tạo vận đơn.",
      );
      return;
    }
    if (
      (order.paymentMethod === "VNPAY" ||
        order.paymentMethod === "BANK_TRANSFER") &&
      order.paymentStatus !== "SUCCESS"
    ) {
      alert(
        "Đơn hàng chưa được thanh toán thành công. Vui lòng xác nhận chuyển tiền trước khi tạo vận đơn.",
      );
      return;
    }
    if (!confirm("Tạo vận đơn SuperShip cho đơn này?")) return;
    setUpdating(true);
    try {
      await createSupershipOrder(order.id);
      refreshOrder();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi tạo vận đơn");
    } finally {
      setUpdating(false);
    }
  };

  const handleSyncSupershipStatus = async () => {
    if (!order.trackingCode) return;
    setUpdating(true);
    try {
      const result = await syncSupershipByOrderId(order.id);
      // Refresh order data
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${order.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("thrifted_auth_token")}`,
          },
        },
      );
      if (res.ok) {
        const fresh = await res.json();
        setOrder(fresh);
      }
      if (result.updated) {
        alert(
          `Đã sync! Trạng thái SuperShip: ${result.ssStatusName} → ${result.mappedStatus}`,
        );
      } else {
        alert(`Trạng thái giữ nguyên: ${result.ssStatusName}`);
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi sync");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintLabel = async () => {
    if (!order.trackingCode) return;
    setUpdating(true);
    try {
      const result = await printSuperShipLabel([order.id]);
      window.open(result.url, "_blank");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi tạo nhãn in");
    } finally {
      setUpdating(false);
    }
  };

  const isCancelled =
    order.status === "CANCELLED" || order.status === "PAYMENT_EXPIRED";

  return (
    <div
      className={`space-y-6 max-w-6xl mx-auto transition-all ${updating ? "opacity-60 grayscale-[0.3]" : "opacity-100"}`}
    >
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            href="/admin/orders"
            className="flex items-center gap-2 text-zinc-400 hover:text-black transition-colors mb-2"
          >
            <ArrowLeft size={16} />
            <span className="text-xs font-black uppercase tracking-widest">
              Danh sách đơn hàng
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-black tracking-tight font-mono">
              #{order.id.slice(0, 8)}
            </h1>
            <span
              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${STATUS_COLORS[order.status] || "bg-zinc-100 text-zinc-800"}`}
            >
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>
          <p className="text-sm text-zinc-400 font-bold uppercase tracking-widest mt-1">
            Đặt lúc {formatDate(order.createdAt)}
          </p>
        </div>

        {/* Actions */}
        {order.status === "PENDING" && (
          <div className="flex items-center gap-3">
            {!order.trackingCode && (
              <button
                onClick={() => setShowEditModal(true)}
                disabled={updating}
                className="px-5 py-3 bg-white border-2 border-black text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-100 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Pencil size={13} />
                Sửa đơn
              </button>
            )}
            <button
              onClick={handleConfirm}
              disabled={updating}
              className="px-6 py-3 bg-green-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 size={14} />
              Xác nhận đơn hàng
            </button>
            {order.paymentMethod !== "COD" && !order.trackingCode && (
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={updating}
                className="px-5 py-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-100 transition-all"
              >
                Từ chối
              </button>
            )}
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={updating}
              className="px-5 py-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
            >
              Huỷ đơn
            </button>
          </div>
        )}

        {order.status === "PROCESSING" && (
          <div className="flex items-center gap-3">
            {!order.trackingCode && (
              <>
                <button
                  onClick={() => setShowEditModal(true)}
                  disabled={updating}
                  className="px-5 py-3 bg-white border-2 border-black text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-100 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Pencil size={13} />
                  Sửa đơn
                </button>
                <button
                  onClick={async () => {
                    if (
                      order.paymentMethod === "COD" &&
                      order.isDepositRequired &&
                      !order.depositPaid
                    ) {
                      alert(
                        "Đơn COD yêu cầu đặt cọc. Vui lòng xác nhận đặt cọc trước khi tạo vận đơn.",
                      );
                      return;
                    }
                    if (
                      (order.paymentMethod === "VNPAY" ||
                        order.paymentMethod === "BANK_TRANSFER") &&
                      order.paymentStatus !== "SUCCESS"
                    ) {
                      alert(
                        "Đơn hàng chưa được thanh toán thành công. Vui lòng xác nhận chuyển tiền trước khi tạo vận đơn.",
                      );
                      return;
                    }
                    if (!confirm("Tao van don SuperShip cho don nay?")) return;
                    setUpdating(true);
                    try {
                      await createSupershipOrder(order.id);
                      refreshOrder();
                    } catch (e: unknown) {
                      alert(e instanceof Error ? e.message : "Loi");
                    } finally {
                      setUpdating(false);
                    }
                  }}
                  disabled={updating}
                  className="px-5 py-3 bg-blue-600 text-white border border-blue-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Truck size={13} />
                  Tạo vận đơn SuperShip
                </button>
              </>
            )}
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={updating}
              className="px-5 py-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
            >
              Huỷ đơn
            </button>
          </div>
        )}

        {(order.status === "CANCELLED" ||
          order.status === "PAYMENT_EXPIRED") && (
            <div className="flex items-center gap-2">
              <XCircle size={16} className="text-red-500" />
              <span className="text-xs text-red-600 font-bold">
                {order.status === "CANCELLED"
                  ? "Đơn đã hủy"
                  : "Hết hạn thanh toán"}
              </span>
            </div>
          )}

        {order.status === "DELIVERED" && (
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600" />
            <span className="text-xs text-green-700 font-bold">
              Giao thanh cong
            </span>
          </div>
        )}
      </div>

      {/* Progress Track - order status (admin xu ly) */}
      <div className="bg-white rounded-[32px] border border-zinc-100 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">
              1
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                Xu ly don hang
              </p>
              <p className="text-sm font-bold text-black">
                Admin xac nhan thu cong
              </p>
            </div>
          </div>
          <div
            className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest ${order.status === "PENDING"
              ? "bg-amber-100 text-amber-700"
              : order.status === "PROCESSING"
                ? "bg-blue-100 text-blue-700"
                : order.status === "SHIPPING"
                  ? "bg-indigo-100 text-indigo-700"
                  : order.status === "SHIPPED"
                    ? "bg-purple-100 text-purple-700"
                    : order.status === "DELIVERED"
                      ? "bg-green-100 text-green-700"
                      : order.status === "CANCELLED" ||
                        order.status === "PAYMENT_EXPIRED"
                        ? "bg-red-100 text-red-700"
                        : "bg-zinc-100 text-zinc-700"
              }`}
          >
            {order.status === "PENDING"
              ? "Chờ xử lý"
              : order.status === "PROCESSING"
                ? "Đang xử lý"
                : order.status === "SHIPPING"
                  ? "Đang giao hàng"
                  : order.status === "SHIPPED"
                    ? "Đã giao cho shipper"
                    : order.status === "DELIVERED"
                      ? "Đã giao"
                      : order.status === "CANCELLED"
                        ? "Đã hủy"
                        : order.status === "PAYMENT_EXPIRED"
                          ? "Hết hạn thanh toán"
                          : order.status}
          </div>
        </div>

        {order.status !== "PENDING" &&
          order.status !== "CANCELLED" &&
          order.status !== "PAYMENT_EXPIRED" && (
            <>
              <div className="border-t border-zinc-100 my-4" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-black">
                    2
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                      Van chuyen
                    </p>
                    <p className="text-sm font-bold text-black">
                      SuperShip xu ly tu dong
                    </p>
                  </div>
                </div>
                <div
                  className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest ${order.shippingStatus
                    ? SHIPPING_STATUS_COLORS[order.shippingStatus] ||
                    "bg-zinc-100 text-zinc-700"
                    : "bg-zinc-100 text-zinc-500"
                    }`}
                >
                  {order.shippingStatus
                    ? SHIPPING_STATUS_LABELS[order.shippingStatus] ||
                    order.shippingStatus
                    : "Chua co van don"}
                </div>
              </div>

              {order.trackingCode && (
                <div className="mt-4 p-4 bg-zinc-50 rounded-2xl space-y-3">
                  {/* Mã nội bộ SuperShip (shortcode) — dùng khi giao/nhận hàng khi không quét mã vạch */}
                  {order.ghnTrackingCode && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Truck size={16} className="text-green-600" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-green-600">
                            Mã nội bộ SuperShip
                          </p>
                          <p className="text-base font-black text-black font-mono">
                            {order.ghnTrackingCode}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`https://tracking.supership.vn/?code=${order.trackingCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1"
                      >
                        Theo dõi <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                  {/* Mã nội bộ SuperShip */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck size={16} className="text-zinc-400" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          Mã nội bộ
                        </p>
                        <p className="text-sm font-black text-black font-mono">
                          {order.trackingCode}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-50 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-black">
                Sản phẩm ({order.items?.length || 0})
              </h3>
              <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">
                Premium THRIFT.VN Goods
              </span>
            </div>
            <div className="divide-y divide-zinc-50">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="p-8 flex gap-6 hover:bg-zinc-50/50 transition-colors group"
                >
                  <div className="w-20 h-20 bg-white border border-zinc-100 rounded-2xl overflow-hidden shrink-0 shadow-sm p-1">
                    {item.product.images[0] ? (
                      <img
                        src={convertDriveLink(item.product.images[0])}
                        alt={item.product.name}
                        className="w-full h-full object-contain"
                        loading="eager"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300 bg-zinc-50">
                        <Package size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-lg font-black text-black tracking-tight group-hover:text-zinc-600 transition-colors line-clamp-1">
                      {item.product.name}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2">
                      {item.size && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-50 px-2 py-1 rounded-lg">
                          Size: {item.size}
                        </span>
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-50 px-2 py-1 rounded-lg">
                        SL: {item.quantity}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col justify-center shrink-0">
                    <p className="text-lg font-black text-black tracking-tight">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter mt-1">
                      {formatCurrency(item.price)} / đơn vị
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="p-8 bg-zinc-50/50 space-y-3">
              <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest">
                <span>Tạm tính</span>
                <span className="text-zinc-600">
                  {formatCurrency(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest">
                <span>Vận chuyển</span>
                <span className="text-zinc-600">
                  {order.shippingFee === 0
                    ? "Free"
                    : formatCurrency(order.shippingFee)}
                </span>
              </div>
              {order.couponDiscount && order.couponDiscount > 0 && (
                <div className="flex justify-between text-xs font-bold text-green-500 uppercase tracking-widest">
                  <span>Giảm giá</span>
                  <span>−{formatCurrency(order.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-6 border-t border-zinc-100">
                <span className="text-sm font-black text-black uppercase tracking-widest">
                  Tổng cộng
                </span>
                <span className="text-3xl font-black text-black tracking-tight">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.orderNote && (
            <div className="bg-amber-50/50 border border-amber-100 rounded-[32px] p-8 flex gap-4">
              <Info className="text-amber-500 shrink-0" size={20} />
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">
                  Ghi chú từ khách hàng
                </p>
                <p className="text-sm font-medium text-amber-900 leading-relaxed italic">
                  "{order.orderNote}"
                </p>
              </div>
            </div>
          )}

          {/* Return Request Section */}
          {order.hasReturnRequest && returnReq && (
            <div className="bg-white rounded-[32px] border border-zinc-100 p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                      <path d="M8 16H3v5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      Yêu cầu hoàn hàng
                    </p>
                    <p className="text-sm font-bold text-black">
                      {RETURN_REASON_LABELS[returnReq.reason] ??
                        returnReq.reason}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${RETURN_STATUS_COLORS[returnReq.status] ?? "bg-zinc-100 text-zinc-800"}`}
                  >
                    {returnReq.status === "PENDING"
                      ? "Chờ duyệt"
                      : returnReq.status === "APPROVED"
                        ? "Đã duyệt"
                        : returnReq.status === "REJECTED"
                          ? "Đã từ chối"
                          : "Hoàn thành"}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    {new Date(returnReq.createdAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {returnReq.reasonText && (
                <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                    Mô tả của khách
                  </p>
                  <p className="text-sm text-zinc-700">
                    {returnReq.reasonText}
                  </p>
                </div>
              )}

              {returnReq.images && returnReq.images.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">
                    Ảnh minh chứng ({returnReq.images.length}/5)
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {returnReq.images.map((img, i) => (
                      <a
                        key={i}
                        href={img}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-24 h-24 rounded-2xl overflow-hidden border border-zinc-200 hover:border-brand-red transition-colors"
                      >
                        <img
                          src={convertDriveLink(img)}
                          alt={`Ảnh ${i + 1}`}
                          className="w-full h-full object-cover"
                          loading="eager"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {returnReq.adminNote && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">
                    Ghi chú của admin
                  </p>
                  <p className="text-sm text-blue-900">{returnReq.adminNote}</p>
                </div>
              )}

              {/* Actions */}
              {returnReq.status === "PENDING" && (
                <div className="flex items-center gap-3 pt-2 border-t border-zinc-100">
                  <button
                    onClick={() => setShowReturnApproveModal(true)}
                    disabled={updating}
                    className="px-5 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50"
                  >
                    ✓ Duyệt hoàn hàng
                  </button>
                  <button
                    onClick={() => setShowReturnRejectModal(true)}
                    disabled={updating}
                    className="px-5 py-3 bg-white text-red-600 border border-red-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-all disabled:opacity-50"
                  >
                    ✗ Từ chối
                  </button>
                </div>
              )}

              {returnReq.status === "APPROVED" && (
                <div className="flex items-center gap-3 pt-2 border-t border-zinc-100">
                  <button
                    onClick={handleReturnComplete}
                    disabled={updating}
                    className="px-5 py-3 bg-green-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-sm disabled:opacity-50"
                  >
                    ✓ Đã hoàn tiền cho khách
                  </button>
                </div>
              )}

              {returnReq.status === "COMPLETED" && (
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                  <CheckCircle2 size={16} className="text-green-500" />
                  <span className="text-sm text-green-700 font-bold">
                    Yêu cầu hoàn hàng đã hoàn thành
                  </span>
                </div>
              )}

              {returnReq.status === "REJECTED" && (
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                  <XCircle size={16} className="text-red-500" />
                  <span className="text-sm text-red-600 font-bold">
                    Yêu cầu hoàn hàng đã bị từ chối
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Customer & Shipping */}
          <div className="bg-white rounded-[32px] border border-zinc-100 p-8 shadow-sm space-y-8">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6">
                Thông tin giao hàng
              </h3>
              <div className="space-y-5">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Người nhận
                    </p>
                    <p className="text-sm font-black text-black">
                      {order.shippingName}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Liên hệ
                    </p>
                    <p className="text-sm font-black text-black">
                      {order.shippingPhone}
                    </p>
                    {order.shippingEmail && (
                      <p className="text-xs text-zinc-500 font-medium mt-0.5">
                        {order.shippingEmail}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Địa chỉ
                    </p>
                    <p className="text-sm font-black text-black leading-relaxed">
                      {order.shippingAddress}, {order.shippingDistrict},{" "}
                      {order.shippingCity}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {order.user && (
              <div className="pt-8 border-t border-zinc-50">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">
                  Tài khoản khách hàng
                </h3>
                <Link
                  href={`/admin/users/${order.user.id}`}
                  className="flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center text-[10px] font-black group-hover:scale-105 transition-transform">
                    {order.user.firstName?.[0]}
                    {order.user.lastName?.[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-black group-hover:underline">
                      {order.user.firstName} {order.user.lastName}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                      Xem hồ sơ →
                    </p>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Payment Card */}
          <div className="bg-white rounded-[32px] border border-zinc-100 p-8 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Trạng thái thanh toán
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <CreditCard className="text-zinc-400" size={18} />
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-600">
                    {order.paymentMethod}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${order.paymentStatus === "SUCCESS" ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "bg-amber-100 text-amber-700"}`}
                >
                  {order.paymentStatus === "SUCCESS"
                    ? "Đã thanh toán"
                    : order.paymentMethod === "COD"
                      ? "Chờ COD"
                      : order.paymentMethod === "VNPAY"
                        ? "Chờ VNPay"
                        : "Chờ chuyển khoản"}
                </span>
              </div>

              {order.isDepositRequired && (
                <div className="p-5 border border-amber-100 bg-amber-50/30 rounded-[24px] space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                      Tiền cọc (10%)
                    </p>
                    <p className="text-lg font-black text-black tracking-tight">
                      {formatCurrency(order.depositAmount || 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${order.depositPaid ? "bg-green-500" : "bg-amber-500 animate-pulse"}`}
                    />
                    <span className="text-xs font-black text-zinc-900 uppercase tracking-widest">
                      {order.depositPaid ? "Đã nhận cọc" : "Đang chờ cọc"}
                    </span>
                  </div>
                  {!order.depositPaid && !isCancelled && (
                    <button
                      onClick={handleDepositConfirm}
                      disabled={updating}
                      className="w-full py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                    >
                      Xác nhận tiền cọc
                    </button>
                  )}
                </div>
              )}

              {order.paymentContent && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-1">
                    Nội dung chuyển khoản
                  </p>
                  <p className="text-sm font-black text-red-600 font-mono select-all tracking-wider uppercase">
                    {order.paymentContent}
                  </p>
                </div>
              )}

              {/* Chỉ hiện nút xác nhận thanh toán cho VNPay và BANK_TRANSFER
                  COD: tự động xác nhận khi giao hàng thành công (DELIVERED) */}
              {!isCancelled &&
                order.paymentStatus !== "SUCCESS" &&
                order.paymentMethod !== "COD" && (
                  <button
                    onClick={handlePaymentConfirm}
                    disabled={updating}
                    className="w-full py-4 bg-black text-white rounded-[24px] text-xs font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3"
                  >
                    <CheckCircle2 size={16} />
                    Xác nhận thanh toán
                  </button>
                )}
            </div>
          </div>

          {/* SuperShip Tracking Card */}
          <div className="bg-white rounded-[32px] border border-zinc-100 p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                SuperShip
              </h3>
              {order.trackingCode && (
                <span
                  className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${SHIPPING_STATUS_COLORS[order.shippingStatus || ""] || "bg-zinc-100 text-zinc-600"}`}
                >
                  {SHIPPING_STATUS_LABELS[order.shippingStatus || ""] ||
                    order.shippingStatus ||
                    "N/A"}
                </span>
              )}
            </div>

            {order.trackingCode ? (
              <div className="space-y-4">
                <div className="p-4 bg-zinc-50 rounded-2xl space-y-2">
                  {order.ghnTrackingCode && (
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                        Mã nội bộ SuperShip
                      </p>
                      <span className="text-sm font-black text-black font-mono">
                        {order.ghnTrackingCode}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      Mã nội bộ
                    </p>
                    <span className="text-sm font-black text-zinc-500 font-mono">
                      {order.trackingCode}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      Trạng thái
                    </p>
                    <span className="text-sm font-black text-zinc-700">
                      {SHIPPING_STATUS_LABELS[order.shippingStatus || ""] ||
                        "—"}
                    </span>
                  </div>
                </div>
                <a
                  href={`https://tracking.supership.vn/?code=${order.trackingCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink size={14} />
                  Theo dõi trên SuperShip
                </a>
                <button
                  onClick={handlePrintLabel}
                  disabled={updating}
                  className="w-full py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={14} />
                  In nhãn
                </button>
                {/* <button
                  onClick={handleSyncSupershipStatus}
                  disabled={updating}
                  className="w-full py-3 bg-zinc-50 text-zinc-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} className={updating ? 'animate-spin' : ''} />
                  Sync trạng thái
                </button> */}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <AlertTriangle
                    className="text-amber-500 shrink-0 mt-0.5"
                    size={16}
                  />
                  <div>
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">
                      Chưa tạo vận đơn
                    </p>
                    <p className="text-xs text-amber-800 font-medium">
                      Vận đơn sẽ được tạo tự động khi thanh toán thành công. Nếu
                      chưa thấy, hãy tạo thủ công.
                    </p>
                  </div>
                </div>
                {!isCancelled &&
                  (order.paymentStatus === "SUCCESS" ||
                    (order.paymentMethod === "COD" &&
                      !order.isDepositRequired) ||
                    (order.paymentMethod === "COD" &&
                      order.isDepositRequired &&
                      order.depositPaid)) && (
                    <button
                      onClick={handleCreateSupershipOrder}
                      disabled={updating}
                      className="w-full py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                    >
                      {updating ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Truck size={14} />
                      )}
                      Tạo vận đơn SuperShip
                    </button>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-scale-up">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-[24px] flex items-center justify-center mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-2xl font-black text-black tracking-tight mb-2">
              Hủy đơn hàng?
            </h3>
            <p className="text-zinc-500 text-sm font-medium mb-6">
              Hành động này không thể hoàn tác. Vui lòng nhập lý do nếu có.
            </p>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy đơn..."
              className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-red-500/5 outline-none mb-6 resize-none transition-all"
              rows={3}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-4 bg-zinc-50 text-zinc-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-all"
              >
                Quay lại
              </button>
              <button
                onClick={handleCancel}
                disabled={updating}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-600/20 disabled:opacity-50 transition-all"
              >
                {updating ? "Processing..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-scale-up">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-[24px] flex items-center justify-center mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-2xl font-black text-black tracking-tight mb-2">
              Từ chối đơn hàng?
            </h3>
            <p className="text-zinc-500 text-sm font-medium mb-4">
              Khác với "Hủy đơn". Nếu khách đã thanh toán, hệ thống sẽ tự động
              hoàn tiền.
            </p>
            <p className="text-zinc-400 text-xs font-medium mb-4">
              Lý do này sẽ được gửi cho khách hàng và ghi vào đơn hàng.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="VD: Sản phẩm hết hàng, không đúng mô tả..."
              className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-amber-500/5 outline-none mb-6 resize-none transition-all"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="flex-1 py-4 bg-zinc-50 text-zinc-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-all"
              >
                Quay lại
              </button>
              <button
                onClick={handleReject}
                disabled={updating}
                className="flex-1 py-4 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 shadow-xl shadow-amber-500/20 disabled:opacity-50 transition-all"
              >
                {updating ? "Processing..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Approve Modal */}
      {showReturnApproveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-scale-up">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-[24px] flex items-center justify-center mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-2xl font-black text-black tracking-tight mb-2">
              Duyệt hoàn hàng
            </h3>
            <p className="text-zinc-500 text-sm font-medium mb-4">
              Sau khi duyệt, khách sẽ được thông báo và bạn cần tự hoàn tiền cho
              khách bên ngoài hệ thống.
            </p>
            <textarea
              value={returnApproveNote}
              onChange={(e) => setReturnApproveNote(e.target.value)}
              placeholder="Ghi chú (tùy chọn)..."
              className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/5 outline-none mb-6 resize-none transition-all"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReturnApproveModal(false);
                  setReturnApproveNote("");
                }}
                className="flex-1 py-4 bg-zinc-50 text-zinc-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-all"
              >
                Quay lại
              </button>
              <button
                onClick={handleReturnApprove}
                disabled={updating}
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-600/20 disabled:opacity-50 transition-all"
              >
                {updating ? "Đang xử lý..." : "Xác nhận duyệt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Reject Modal */}
      {showReturnRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-scale-up">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-[24px] flex items-center justify-center mb-6">
              <XCircle size={32} />
            </div>
            <h3 className="text-2xl font-black text-black tracking-tight mb-2">
              Từ chối hoàn hàng
            </h3>
            <p className="text-zinc-500 text-sm font-medium mb-4">
              Vui lòng nhập lý do từ chối. Khách sẽ được thông báo.
            </p>
            <textarea
              value={returnRejectNote}
              onChange={(e) => setReturnRejectNote(e.target.value)}
              placeholder="VD: Sản phẩm không thuộc diện hoàn, đã quá thời hạn..."
              className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-red-500/5 outline-none mb-6 resize-none transition-all"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReturnRejectModal(false);
                  setReturnRejectNote("");
                }}
                className="flex-1 py-4 bg-zinc-50 text-zinc-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-all"
              >
                Quay lại
              </button>
              <button
                onClick={handleReturnReject}
                disabled={updating}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-600/20 disabled:opacity-50 transition-all"
              >
                {updating ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && (
        <OrderEditModal
          order={order}
          onClose={() => setShowEditModal(false)}
          onSaved={(updated) => {
            setOrder(updated);
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}
