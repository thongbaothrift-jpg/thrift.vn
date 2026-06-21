"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  getReturnRequestAdminDetail,
  approveReturnRequest,
  rejectReturnRequest,
  completeReturnRequest,
  type ReturnRequestAdmin,
} from "@/lib/api/admin";
import { convertDriveLink } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label: "Chờ duyệt",        color: "text-yellow-700", bg: "bg-yellow-100" },
  APPROVED:   { label: "Đã duyệt",          color: "text-blue-700",  bg: "bg-blue-100" },
  REJECTED:   { label: "Từ chối",           color: "text-red-700",   bg: "bg-red-100" },
  COMPLETED:  { label: "Hoàn tiền xong",     color: "text-green-700", bg: "bg-green-100" },
};

const REASON_LABELS: Record<string, string> = {
  DEFECTIVE_PRODUCT: "Sản phẩm lỗi / không đúng mô tả",
  WRONG_ITEM: "Giao sai sản phẩm",
  SIZE_FIT_ISSUE: "Kích thước không phù hợp",
  CHANGE_MIND: "Đổi ý",
  OTHER: "Lý do khác",
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(price);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

interface Props {
  returnRequestId: string;
}

export function AdminReturnRequestDetail({ returnRequestId }: Props) {
  const router = useRouter();
  const [data, setData] = useState<ReturnRequestAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [completeModal, setCompleteModal] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getReturnRequestAdminDetail(returnRequestId);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [returnRequestId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleApprove = async () => {
    if (!confirm("Bạn có chắc muốn duyệt yêu cầu hoàn hàng này?\n\nHệ thống sẽ tự động khôi phục tồn kho. Khách hàng sẽ được thông báo.")) return;
    setActionLoading(true);
    try {
      await approveReturnRequest(returnRequestId);
      await fetchDetail();
    } catch (err: any) {
      alert(err.message || "Duyệt thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối.");
      return;
    }
    setActionLoading(true);
    try {
      await rejectReturnRequest(returnRequestId, rejectReason);
      setRejectModal(false);
      setRejectReason("");
      await fetchDetail();
    } catch (err: any) {
      alert(err.message || "Từ chối thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await completeReturnRequest(returnRequestId);
      setCompleteModal(false);
      await fetchDetail();
    } catch (err: any) {
      alert(err.message || "Hoàn tiền thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-100 animate-pulse rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-zinc-100 animate-pulse rounded-2xl" />
          <div className="h-64 bg-zinc-100 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-zinc-400">
        <p>Không tìm thấy yêu cầu hoàn hàng.</p>
        <Link href="/admin/return-requests" className="btn-ghost mt-4 inline-block">Quay lại</Link>
      </div>
    );
  }

  const sc = STATUS_CONFIG[data.status] || { label: data.status, color: "text-zinc-700", bg: "bg-zinc-100" };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/admin" className="hover:text-black transition-colors">Admin</Link>
        <span>/</span>
        <Link href="/admin/return-requests" className="hover:text-black transition-colors">Yêu cầu hoàn hàng</Link>
        <span>/</span>
        <span className="text-black font-medium">#{data.id.slice(0, 8).toUpperCase()}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">
            Chi tiết yêu cầu hoàn hàng
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            #{data.id.slice(0, 8).toUpperCase()} — Đơn hàng #{data.orderId.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <span className={`text-sm font-bold px-4 py-2 rounded-full ${sc.bg} ${sc.color}`}>
          {sc.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Return request info */}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50">
              <h2 className="font-bold uppercase tracking-tight">Thông tin yêu cầu hoàn hàng</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Lý do</p>
                  <p className="text-sm font-semibold">{REASON_LABELS[data.reason] || data.reason}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Ngày gửi</p>
                  <p className="text-sm">{formatDate(data.createdAt)}</p>
                </div>
              </div>
              {data.reasonText && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Mô tả chi tiết</p>
                  <p className="text-sm bg-zinc-50 rounded-xl p-3">{data.reasonText}</p>
                </div>
              )}
              {data.images.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Ảnh minh chứng</p>
                  <div className="flex flex-wrap gap-3">
                    {data.images.map((url, idx) => (
                      <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-zinc-200">
                        <Image
                          src={convertDriveLink(url)}
                          alt={`Ảnh ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.adminNote && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-400 mb-1">Ghi chú admin</p>
                  <p className="text-sm text-red-700">{data.adminNote}</p>
                </div>
              )}
              {data.status === "APPROVED" && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Địa chỉ gửi hàng hoàn trả
                  </h3>
                  <p className="text-sm text-green-700 font-medium">
                    {data.order?.shopName || "THRIFTED"}
                  </p>
                  <p className="text-sm text-green-700">
                    {[data.order?.pickupAddress, data.order?.pickupWard, data.order?.pickupDistrict, data.order?.pickupProvince].filter(Boolean).join(", ")}
                  </p>
                  {data.order?.pickupPhone && (
                    <p className="text-sm text-green-700">SĐT: {data.order.pickupPhone}</p>
                  )}
                  <p className="text-xs text-green-600 mt-2 pt-2 border-t border-green-200">
                    Khách tự thanh toán phí vận chuyển khi gửi hàng. Ghi mã đơn hàng <strong>#{data.orderId.slice(0, 8).toUpperCase()}</strong> bên ngoài gói hàng.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order items */}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50">
              <h2 className="font-bold uppercase tracking-tight">Sản phẩm trong đơn hàng</h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {data.order.items.map((item) => (
                <div key={item.id} className="p-6 flex gap-6">
                  <div className="relative w-20 h-28 bg-zinc-100 rounded-xl overflow-hidden shrink-0">
                    {item.product.images[0] && (
                      <Image
                        src={convertDriveLink(item.product.images[0])}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.product.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer info */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h3 className="font-bold uppercase tracking-tight mb-4">Khách hàng</h3>
            <div className="space-y-2 text-sm">
              <p className="font-semibold">{data.user.firstName} {data.user.lastName}</p>
              <p className="text-zinc-500">{data.user.email}</p>
              {data.user.phone && <p className="text-zinc-500">{data.user.phone}</p>}
            </div>
          </div>

          {/* Order info */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h3 className="font-bold uppercase tracking-tight mb-4">Đơn hàng</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Mã đơn</span>
                <Link href={`/admin/orders/${data.orderId}`} className="font-bold font-mono text-brand-red hover:underline">
                  #{data.orderId.slice(0, 8).toUpperCase()}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Giá trị</span>
                <span className="font-bold">{formatPrice(data.order.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Thanh toán</span>
                <span className="font-medium">{data.order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Trạng thái thanh toán</span>
                <span className={`font-medium ${data.order.paymentStatus === 'REFUNDED' ? 'text-orange-600' : ''}`}>
                  {data.order.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Ngày đặt</span>
                <span>{formatDate(data.order.createdAt)}</span>
              </div>
              {data.order.deliveredAt && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Ngày giao</span>
                  <span>{formatDate(data.order.deliveredAt)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Người xử lý</span>
                <span>{data.admin ? `${data.admin.firstName} ${data.admin.lastName}` : "—"}</span>
              </div>
              {data.approvedAt && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Ngày duyệt</span>
                  <span>{formatDate(data.approvedAt)}</span>
                </div>
              )}
              {data.completedAt && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Ngày hoàn tiền</span>
                  <span className="text-green-600 font-semibold">{formatDate(data.completedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {data.status === "PENDING" && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="w-full bg-green-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Đang xử lý..." : "Duyệt hoàn hàng"}
                </button>
                <button
                  onClick={() => setRejectModal(true)}
                  disabled={actionLoading}
                  className="w-full bg-red-50 text-red-600 border border-red-100 py-3 rounded-xl font-bold text-sm hover:bg-red-500 hover:text-white transition-colors"
                >
                  Từ chối
                </button>
              </>
            )}
            {data.status === "APPROVED" && (
              <button
                onClick={() => setCompleteModal(true)}
                disabled={actionLoading}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Đang xử lý..." : "Xác nhận đã hoàn tiền"}
              </button>
            )}
            <Link
              href="/admin/return-requests"
              className="w-full block text-center border border-zinc-200 py-3 rounded-xl font-bold text-sm text-zinc-500 hover:bg-zinc-50 transition-colors"
            >
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-lg">Từ chối yêu cầu hoàn hàng</h3>
            <p className="text-sm text-zinc-500">
              Vui lòng nhập lý do từ chối. Khách hàng sẽ nhận được thông báo kèm lý do này.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              rows={4}
              className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red resize-none"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setRejectModal(false); setRejectReason(""); }}
                className="px-4 py-2 border border-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="px-4 py-2 bg-brand-red text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {completeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-lg">Xác nhận hoàn tiền</h3>
            <p className="text-sm text-zinc-500">
              Xác nhận đã hoàn tiền cho khách hàng qua {data.order.paymentMethod}.
              Hệ thống sẽ cập nhật trạng thái thanh toán của đơn hàng thành <strong>Đã hoàn tiền</strong>.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCompleteModal(false)}
                className="px-4 py-2 border border-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleComplete}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Đang xử lý..." : "Xác nhận hoàn tiền"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
