"use client";

import { useState, useEffect, useTransition, useCallback, useMemo } from "react";
import {
  updateSellRequestItem,
  getAdminSellRequest,
  updateSellRequestStatus,
  type SellRequest,
  type SellRequestStats,
  type SellRequestItem,
} from "@/lib/api/sell";
import { useRouter } from "next/navigation";
import { DetailModal } from "./DetailModal";
import { printSuperShipLabel } from "@/lib/api/admin";
import { Printer } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label: "Chờ duyệt",  color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  APPROVED:   { label: "Đã duyệt",   color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  REJECTED:   { label: "Từ chối",    color: "text-red-700",    bg: "bg-red-50 border-red-200" },
  RECEIVED:   { label: "Đã nhận",     color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  COMPLETED:  { label: "Hoàn thành",  color: "text-green-700",  bg: "bg-green-50 border-green-200" },
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

interface SellRequestTableClientProps {
  initialRequests: SellRequest[];
  initialTotal: number;
  initialFilters: {
    status: string;
    saleType: string;
    page: number;
  };
}

export function SellRequestTableClient({
  initialRequests,
  initialTotal,
  initialFilters
}: SellRequestTableClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [requests, setRequests] = useState<SellRequest[]>(initialRequests);
  const [selectedRequest, setSelectedRequest] = useState<SellRequest | null>(null);
  const [savingItem, setSavingItem] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState(initialFilters.status);
  const [filterSaleType, setFilterSaleType] = useState(initialFilters.saleType);

  // Sync state when initialRequests changes (e.g. after filter/pagination)
  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);

  // Sync filter state when URL params change (SSR navigation)
  useEffect(() => {
    setFilterStatus(initialFilters.status);
    setFilterSaleType(initialFilters.saleType);
  }, [initialFilters.status, initialFilters.saleType]);

  // Memoize status lookups for table rows
  const getRowStatus = useCallback((status: string) => {
    return statusConfig[status] || { label: status, color: "text-zinc-700", bg: "bg-zinc-50" };
  }, []);

  const updateUrl = useCallback((overrides: { status?: string; saleType?: string; page?: number }) => {
    const params = new URLSearchParams();
    const st = overrides.status !== undefined ? overrides.status : filterStatus;
    const ty = overrides.saleType !== undefined ? overrides.saleType : filterSaleType;
    const p = overrides.page !== undefined ? overrides.page : initialFilters.page;

    if (st) params.set("status", st);
    if (ty) params.set("saleType", ty);
    if (p > 1) params.set("page", p.toString());

    startTransition(() => {
      router.push(`/admin/sell-requests?${params.toString()}`);
    });
  }, [filterStatus, filterSaleType, initialFilters.page, router]);

  const handleItemStatusChange = useCallback(async (item: SellRequestItem, newStatus: string) => {
    setSavingItem(item.id);
    try {
      await updateSellRequestItem(item.id, { itemStatus: newStatus });
      setRequests((prev) => prev.map(r => ({
        ...r,
        items: r.items?.map(i => i.id === item.id ? { ...i, itemStatus: newStatus } : i)
      })));
      setSelectedRequest((prev) => prev ? {
        ...prev,
        items: prev.items?.map(i => i.id === item.id ? { ...i, itemStatus: newStatus } : i)
      } : null);
    } catch (e: any) {
      alert(e.message || "Lỗi khi cập nhật");
    } finally {
      setSavingItem(null);
    }
  }, []);

  const handleItemOfferPrice = useCallback(async (item: SellRequestItem, offeredPrice: string, note?: string) => {
    const price = parseFloat(offeredPrice);
    if (isNaN(price) || price <= 0) return;
    setSavingItem(item.id);
    try {
      await updateSellRequestItem(item.id, { offeredPrice: price, note });
      
      const newHistory = [...(item.dealHistory || []), { actor: 'ADMIN', price, note: note || '', timestamp: new Date().toISOString() }];
      
      setRequests((prev) => prev.map(r => ({
        ...r,
        items: r.items?.map(i => i.id === item.id ? { ...i, offeredPrice: price, dealHistory: newHistory as any } : i)
      })));
      setSelectedRequest((prev) => prev ? {
        ...prev,
        items: prev.items?.map(i => i.id === item.id ? { ...i, offeredPrice: price, dealHistory: newHistory as any } : i)
      } : null);
    } catch (e: any) {
      alert(e.message || "Lỗi khi cập nhật giá");
    } finally {
      setSavingItem(null);
    }
  }, []);

  const handleRejectWithNote = useCallback(async (item: SellRequestItem, note: string) => {
    setSavingItem(item.id);
    try {
      await updateSellRequestItem(item.id, { itemStatus: "REJECTED", rejectionNote: note });
      setRequests((prev) => prev.map(r => ({
        ...r,
        items: r.items?.map(i => i.id === item.id ? { ...i, itemStatus: "REJECTED", rejectionNote: note } : i)
      })));
      setSelectedRequest((prev) => prev ? {
        ...prev,
        items: prev.items?.map(i => i.id === item.id ? { ...i, itemStatus: "REJECTED", rejectionNote: note } : i)
      } : null);
    } catch (e: any) {
      alert(e.message || "Lỗi khi từ chối");
    } finally {
      setSavingItem(null);
    }
  }, []);

  const handleRequestStatusChange = useCallback(async (requestId: string, newStatus: string) => {
    try {
      await updateSellRequestStatus(requestId, { status: newStatus, notes: 'Admin huỷ đơn' });
      
      setRequests((prev) => prev.map(r => r.id === requestId ? { ...r, status: newStatus, items: r.items?.map(i => ({ ...i, itemStatus: newStatus })) } : r));
      setSelectedRequest((prev) => prev ? { ...prev, status: newStatus, items: prev.items?.map(i => ({ ...i, itemStatus: newStatus })) } : null);
    } catch (e: any) {
      alert(e.message || "Lỗi khi cập nhật");
    }
  }, []);

  const handleNoteChange = useCallback(async (requestId: string, note: string) => {
    try {
      // Giữ nguyên status hiện tại, chỉ update note
      // updateSellRequestStatus trong backend cập nhật cả hai. Lấy status hiện tại của selectedRequest:
      const req = requests.find(r => r.id === requestId);
      if (!req) return;
      await updateSellRequestStatus(requestId, { status: req.status, notes: note });
      
      setRequests((prev) => prev.map(r => r.id === requestId ? { ...r, notes: note } : r));
      setSelectedRequest((prev) => prev ? { ...prev, notes: note } : null);
    } catch (e: any) {
      alert(e.message || "Lỗi khi lưu ghi chú");
    }
  }, [requests]);

  const totalPages = Math.ceil(initialTotal / 20);

  return (
    <>
      <div className={`space-y-6 transition-all duration-300 ${isPending ? 'opacity-50 grayscale-[0.2]' : 'opacity-100'}`}>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={filterStatus}
            onChange={(e) => {
              const val = e.target.value;
              setFilterStatus(val);
              updateUrl({ status: val, page: 1 });
            }}
            className="input-field py-2 text-sm w-auto"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
            <option value="RECEIVED">Đã nhận hàng</option>
            <option value="COMPLETED">Hoàn thành</option>
          </select>
          <select
            value={filterSaleType}
            onChange={(e) => {
              const val = e.target.value;
              setFilterSaleType(val);
              updateUrl({ saleType: val, page: 1 });
            }}
            className="input-field py-2 text-sm w-auto"
          >
            <option value="">Tất cả loại</option>
            <option value="CONSIGNMENT">Ký gửi</option>
            <option value="BUYOUT">Thu mua</option>
          </select>
          <button
            onClick={() => updateUrl({})}
            className="btn-secondary py-2 text-xs"
          >
            Làm mới
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-zinc-200 overflow-hidden rounded">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-6 py-4 font-label text-zinc-500 text-[10px] font-bold uppercase tracking-widest">MÃ</th>
                <th className="text-left px-6 py-4 font-label text-zinc-500 text-[10px] font-bold uppercase tracking-widest">KHÁCH HÀNG</th>
                <th className="text-left px-6 py-4 font-label text-zinc-500 text-[10px] font-bold uppercase tracking-widest">LOẠI</th>
                <th className="text-left px-6 py-4 font-label text-zinc-500 text-[10px] font-bold uppercase tracking-widest">SẢN PHẨM</th>
                <th className="text-left px-6 py-4 font-label text-zinc-500 text-[10px] font-bold uppercase tracking-widest">TRẠNG THÁI</th>
                <th className="text-left px-6 py-4 font-label text-zinc-500 text-[10px] font-bold uppercase tracking-widest">NGÀY GỬI</th>
                <th className="text-left px-6 py-4 font-label text-zinc-500 text-[10px] font-bold uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-zinc-400">
                    Không có yêu cầu nào
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const sc = getRowStatus(req.status);
                  return (
                    <tr key={req.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold">
                        {req.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-black">{req.contactName}</div>
                        <div className="text-zinc-400 text-xs">{req.contactPhone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                          req.saleType === "CONSIGNMENT"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {req.saleType === "CONSIGNMENT" ? "Ký gửi" : "Thu mua"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-black">{req._count?.items ?? req.items?.length ?? 0}</span>
                        <span className="text-zinc-400 text-xs"> sản phẩm</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${sc.bg} ${sc.color} border`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 text-xs">
                        {formatDate(req.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {req.supershipPickupCode && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const result = await printSuperShipLabel([], [req.supershipPickupCode!]);
                                  window.open(result.url, '_blank');
                                } catch (error: any) {
                                  alert(error.message || 'Lỗi khi in đơn');
                                }
                              }}
                              className="text-xs flex items-center gap-1 text-blue-600 font-bold hover:underline"
                            >
                              <Printer size={13} />
                              In đơn
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="text-xs text-brand-red font-bold hover:underline"
                          >
                            Chi tiết →
                          </button>
                          {req.status !== 'REJECTED' && req.status !== 'COMPLETED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Bạn có chắc chắn muốn huỷ đơn này không? Mọi sản phẩm bên trong sẽ bị chuyển sang trạng thái TỪ CHỐI.")) {
                                  handleRequestStatusChange(req.id, 'REJECTED');
                                }
                              }}
                              className="text-xs text-zinc-400 hover:text-red-600 font-bold hover:underline"
                            >
                              Huỷ
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => updateUrl({ page: initialFilters.page - 1 })}
              disabled={initialFilters.page <= 1}
              className="btn-ghost py-2 text-xs disabled:opacity-30"
            >
              ← Trước
            </button>
            <span className="px-4 py-2 text-sm text-zinc-500">
              Trang {initialFilters.page} / {totalPages}
            </span>
            <button
              onClick={() => updateUrl({ page: initialFilters.page + 1 })}
              disabled={initialFilters.page >= totalPages}
              className="btn-ghost py-2 text-xs disabled:opacity-30"
            >
              Sau →
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal — loaded from separate module */}
      {selectedRequest && (
        <DetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onItemStatusChange={handleItemStatusChange}
          onItemOfferPrice={handleItemOfferPrice}
          onRejectWithNote={handleRejectWithNote}
          onRequestStatusChange={handleRequestStatusChange}
          onRequestNoteChange={handleNoteChange}
          savingItem={savingItem}
          onLoadFullData={(data) => {
            setRequests(prev => prev.map(r => r.id === data.id ? data : r));
            setSelectedRequest(data);
          }}
        />
      )}
    </>
  );
}
