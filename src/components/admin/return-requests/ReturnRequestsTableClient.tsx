"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getReturnRequests,
  approveReturnRequest,
  rejectReturnRequest,
  type ReturnRequestAdmin,
} from "@/lib/api/admin";
import { convertDriveLink } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label: "Chờ duyệt",    color: "text-yellow-700", bg: "bg-yellow-100" },
  APPROVED:   { label: "Đã duyệt",     color: "text-blue-700",  bg: "bg-blue-100" },
  REJECTED:   { label: "Từ chối",      color: "text-red-700",   bg: "bg-red-100" },
  COMPLETED:  { label: "Hoàn tiền xong", color: "text-green-700", bg: "bg-green-100" },
};

const REASON_LABELS: Record<string, string> = {
  DEFECTIVE_PRODUCT: "Sản phẩm lỗi",
  WRONG_ITEM: "Giao sai",
  SIZE_FIT_ISSUE: "Sai kích thước",
  CHANGE_MIND: "Đổi ý",
  OTHER: "Khác",
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(price);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export function AdminReturnRequestsTable() {
  const router = useRouter();
  const [requests, setRequests] = useState<ReturnRequestAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; reason: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const pages = Math.ceil(total / 10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getReturnRequests({ status: statusFilter || undefined, page, limit: 10 });
      setRequests(data.requests);
      setTotal(data.total);
      setPendingCount(data.pendingCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: string) => {
    if (!confirm("Bạn có chắc muốn duyệt yêu cầu hoàn hàng này?\n\nHệ thống sẽ tự động khôi phục tồn kho. Khách hàng sẽ được thông báo.")) return;
    setActionLoading(id);
    try {
      await approveReturnRequest(id);
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Duyệt thất bại.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối.");
      return;
    }
    setActionLoading(rejectModal.id);
    try {
      await rejectReturnRequest(rejectModal.id, rejectReason);
      setRejectModal(null);
      setRejectReason("");
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Từ chối thất bại.");
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { key: "", label: "Tất cả" },
    { key: "PENDING", label: "Chờ duyệt" },
    { key: "APPROVED", label: "Đã duyệt" },
    { key: "REJECTED", label: "Từ chối" },
    { key: "COMPLETED", label: "Hoàn tiền xong" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Yêu cầu hoàn hàng</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {pendingCount > 0 ? `${pendingCount} yêu cầu đang chờ duyệt` : "Không có yêu cầu chờ duyệt"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setPage(1); }}
              className={`pb-3 font-label text-sm transition-colors relative ${
                statusFilter === tab.key
                  ? "text-black border-b-2 border-black"
                  : "text-zinc-500 hover:text-black"
              }`}
            >
              {tab.label}
              {tab.key === "PENDING" && pendingCount > 0 && (
                <span className="ml-1.5 bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-zinc-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 animate-pulse flex gap-4">
                <div className="w-12 h-12 bg-zinc-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-zinc-100 rounded w-1/3" />
                  <div className="h-3 bg-zinc-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-zinc-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-medium">Chưa có yêu cầu hoàn hàng nào</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Yêu cầu</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Khách hàng</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Lý do</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Giá trị đơn</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Ngày gửi</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Trạng thái</th>
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {requests.map((req) => {
                const sc = STATUS_CONFIG[req.status] || { label: req.status, color: "text-zinc-700", bg: "bg-zinc-100" };
                return (
                  <tr key={req.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/return-requests/${req.id}`} className="font-mono text-sm font-bold text-black hover:text-brand-red transition-colors">
                        #{req.id.slice(0, 8).toUpperCase()}
                      </Link>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">
                        #{req.orderId.slice(0, 8).toUpperCase()}
                      </p>
                      {req.order.items[0] && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="relative w-8 h-8 bg-zinc-100 rounded overflow-hidden shrink-0">
                            {req.order.items[0].product.images[0] && (
                              <Image
                                src={convertDriveLink(req.order.items[0].product.images[0])}
                                alt={req.order.items[0].product.name}
                                fill
                                className="object-cover"
                                sizes="32px"
                              />
                            )}
                          </div>
                          <span className="text-xs text-zinc-600 truncate max-w-[120px]">
                            {req.order.items[0].product.name}
                          </span>
                          {req.order.items.length > 1 && (
                            <span className="text-xs text-zinc-400">+{req.order.items.length - 1}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold">{req.user.firstName} {req.user.lastName}</p>
                      <p className="text-xs text-zinc-400">{req.user.email}</p>
                      {req.user.phone && <p className="text-xs text-zinc-400">{req.user.phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-1 bg-zinc-100 rounded-lg">
                        {REASON_LABELS[req.reason] || req.reason}
                      </span>
                      {req.reasonText && (
                        <p className="text-xs text-zinc-400 mt-1 max-w-[150px] truncate" title={req.reasonText}>
                          {req.reasonText}
                        </p>
                      )}
                      {req.images.length > 0 && (
                        <p className="text-xs text-zinc-400 mt-1">
                          <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {req.images.length} ảnh
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold">{formatPrice(req.order.total)}</p>
                      <p className="text-xs text-zinc-400">{req.order.paymentMethod}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500">{formatDate(req.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/return-requests/${req.id}`}
                          className="px-3 py-1.5 text-xs font-bold bg-zinc-100 text-zinc-600 rounded-lg hover:bg-zinc-200 transition-colors"
                        >
                          Chi tiết
                        </Link>
                        {req.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(req.id)}
                              disabled={actionLoading === req.id}
                              className="px-3 py-1.5 text-xs font-bold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => setRejectModal({ id: req.id, reason: "" })}
                              className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-zinc-200 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-zinc-50 transition-colors"
          >
            Trước
          </button>
          <span className="px-4 py-2 text-sm font-bold">
            Trang {page} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-4 py-2 border border-zinc-200 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-zinc-50 transition-colors"
          >
            Sau
          </button>
        </div>
      )}

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
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="px-4 py-2 border border-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal.id || !rejectReason.trim()}
                className="px-4 py-2 bg-brand-red text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === rejectModal.id ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
