"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateOrderStatus, cancelOrder, printShippingLabels, type AdminOrder } from '@/lib/api/admin';
import { Search, AlertTriangle, Printer } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'PROCESSING', label: 'Đang xử lý' },
  { value: 'SHIPPING', label: 'Đang giao hàng' },
  { value: 'SHIPPED', label: 'Đã giao shipper' },
  { value: 'DELIVERED', label: 'Đã giao' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'PAYMENT_EXPIRED', label: 'Hết hạn TT' },
  { value: 'RETURNED', label: 'Hoàn hàng' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPING: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  PAYMENT_EXPIRED: 'bg-red-100 text-red-800',
  RETURNED: 'bg-orange-100 text-orange-800',
};

const ALL_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'PROCESSING', label: 'Đang xử lý' },
  { value: 'SHIPPING', label: 'Đang giao hàng' },
  { value: 'SHIPPED', label: 'Đã giao cho shipper' },
  { value: 'DELIVERED', label: 'Đã giao' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'PAYMENT_EXPIRED', label: 'Hết hạn thanh toán' },
  { value: 'RETURNED', label: 'Hoàn hàng' },
];

function formatCurrency(v: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
}

interface OrderTableClientProps {
  initialOrders: AdminOrder[];
  initialTotal: number;
  initialFilters: {
    status: string;
    search: string;
    page: number;
    limit: number;
    hasReturnRequest?: boolean;
  };
}

const RETURN_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
  COMPLETED: 'Hoàn thành',
};

export function OrderTableClient({ initialOrders, initialTotal, initialFilters }: OrderTableClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [search, setSearch] = useState(initialFilters.search);
  const [statusFilter, setStatusFilter] = useState(initialFilters.status);
  const [hasReturnFilter, setHasReturnFilter] = useState(!!initialFilters.hasReturnRequest);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<{ orderId: string; orderCode: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);

  // Trigger state to fire the navigation effect
  const [navTrigger, setNavTrigger] = useState(0);

  // Pending navigation ref — avoids calling router.push during render
  const pendingNavigation = useRef<{
    search?: string;
    status?: string;
    hasReturnRequest?: boolean;
    page?: number;
  } | null>(null);

  // Sync state when initialOrders/initialFilters change (e.g., server navigation)
  useEffect(() => {
    setOrders(initialOrders);
    setSearch(initialFilters.search);
    setStatusFilter(initialFilters.status);
    setHasReturnFilter(!!initialFilters.hasReturnRequest);
  }, [initialOrders, initialFilters.search, initialFilters.status, initialFilters.hasReturnRequest]);

  // Apply pending navigation — runs after render, never during render
  useEffect(() => {
    if (!navTrigger) return;
    const nav = pendingNavigation.current;
    if (!nav) return;
    pendingNavigation.current = null;

    const params = new URLSearchParams();
    const s = nav.search !== undefined ? nav.search : search;
    const st = nav.status !== undefined ? nav.status : statusFilter;
    const rr = nav.hasReturnRequest !== undefined ? nav.hasReturnRequest : hasReturnFilter;
    const p = nav.page !== undefined ? nav.page : initialFilters.page;

    if (s) params.set('search', s);
    if (st) params.set('status', st);
    if (rr) params.set('hasReturnRequest', 'true');
    if (p > 1) params.set('page', p.toString());

    startTransition(() => {
      router.push(`/admin/orders?${params.toString()}`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navTrigger]);

  const updateUrl = useCallback((overrides: {
    search?: string;
    status?: string;
    hasReturnRequest?: boolean;
    page?: number;
  }) => {
    pendingNavigation.current = overrides;
    setSelectedIds(new Set()); // clear selection on navigation
    setNavTrigger((n) => n + 1); // fire the effect
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Lỗi cập nhật');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancel = async () => {
    if (!cancelModal) return;
    setUpdatingId(cancelModal.orderId);
    try {
      const updated = await cancelOrder(cancelModal.orderId, cancelReason);
      setOrders((prev) => prev.map((o) => (o.id === cancelModal.orderId ? updated : o)));
      setCancelModal(null);
      setCancelReason('');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Lỗi hủy đơn');
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePrintLabels = async () => {
    if (selectedIds.size === 0) {
      alert('Vui lòng chọn ít nhất 1 đơn hàng để in nhãn.');
      return;
    }
    const ids = Array.from(selectedIds);
    setBatchLoading(true);
    try {
      const result = await printShippingLabels(ids);
      window.open(result.url, '_blank');
      const now = new Date().toISOString();
      setOrders((prev) => prev.map((o) => ids.includes(o.id) ? { ...o, printedAt: now } : o));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Lỗi in nhãn');
    } finally {
      setBatchLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    // Không cho chọn đơn đã huỷ
    const order = orders.find((o) => o.id === id);
    if (order?.status === 'CANCELLED') return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalPages = Math.ceil(initialTotal / initialFilters.limit);

  return (
    <div className={`space-y-3 transition-all duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <form onSubmit={(e) => { e.preventDefault(); updateUrl({ page: 1 }); }}>
            <input
              type="text"
              placeholder="Tìm mã đơn, tên, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-black/10 outline-none"
            />
          </form>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            updateUrl({ status: e.target.value, page: 1 });
          }}
          className="px-3 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl">
              {selectedIds.size} đơn
            </span>
            <button
              onClick={handlePrintLabels}
              disabled={batchLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white border border-blue-600 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              <Printer size={13} />
              In nhãn
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2.5 text-zinc-400 hover:text-zinc-600 text-xs font-semibold transition-colors"
            >
              Bỏ chọn
            </button>
          </div>
        )}
      </div>

      {/* Table — compact card layout, no horizontal scroll */}
      <div className="bg-transparent md:bg-white md:rounded-2xl md:border md:border-zinc-100 md:shadow-sm md:overflow-hidden flex flex-col gap-3 md:gap-0 md:block md:divide-y md:divide-zinc-100">
        {/* Header */}
        <div className="hidden md:grid md:grid-cols-12 gap-0 bg-zinc-50/50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100">
          <div className="col-span-1 flex items-center">
            <input type="checkbox" checked={false} readOnly className="w-4 h-4 accent-black" />
          </div>
          <div className="col-span-2">Mã đơn</div>
          <div className="col-span-3">Khách hàng</div>
          <div className="col-span-2">Thanh toán</div>
          <div className="col-span-2">Trạng thái</div>
          <div className="col-span-2 text-right">Thao tác</div>
        </div>

        {/* Rows */}
        {orders.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">Không có đơn hàng nào.</div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className={`px-4 py-4 md:py-3 bg-white rounded-2xl border border-zinc-100 shadow-sm md:shadow-none md:border-none md:rounded-none md:grid md:grid-cols-12 md:gap-0 md:items-center hover:bg-zinc-50/50 transition-colors ${order.trackingCode && selectedIds.has(order.id) ? 'bg-blue-50/30' : ''}`}
            >
              {/* Checkbox */}
              <div className="hidden md:flex col-span-1 items-center">
                {order.trackingCode && order.status !== 'CANCELLED' ? (
                  <input type="checkbox" checked={selectedIds.has(order.id)} onChange={() => toggleSelect(order.id)} className="w-4 h-4 accent-black cursor-pointer" />
                ) : (
                  <div className="w-4" />
                )}
              </div>

              {/* Mã đơn */}
              <div className="col-span-12 md:col-span-2 mb-2 md:mb-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs text-brand-red hover:underline font-bold">
                    #{order.id.slice(0, 8)}
                  </Link>
                  {order.hasReturnRequest && (
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                        order.returnRequestStatus === 'PENDING'
                          ? 'bg-amber-200 text-amber-900 border-amber-400 animate-pulse'
                          : order.returnRequestStatus === 'APPROVED'
                          ? 'bg-blue-200 text-blue-900 border-blue-400'
                          : order.returnRequestStatus === 'COMPLETED'
                          ? 'bg-green-200 text-green-900 border-green-400'
                          : 'bg-zinc-200 text-zinc-700 border-zinc-300'
                      }`}
                    >
                      ↩ {RETURN_STATUS_LABELS[order.returnRequestStatus ?? ''] ?? 'Hoàn'}
                    </Link>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  {order.ghnTrackingCode ? (
                    <span className="font-mono text-[9px] text-green-600 font-bold">{order.ghnTrackingCode}</span>
                  ) : order.trackingCode ? (
                    <span className="italic">Chờ xử lý</span>
                  ) : '—'}
                  {order.printedAt && (
                    <span className="ml-1.5 text-green-500">✓</span>
                  )}
                </p>
              </div>

              {/* Khách hàng */}
              <div className="col-span-12 md:col-span-3 mb-1 md:mb-0">
                <p className="text-xs font-semibold text-black">{order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Khách vãng lai'}</p>
                <p className="text-[10px] text-zinc-400">{order.shippingPhone}</p>
              </div>

              {/* Thanh toán */}
              <div className="col-span-12 md:col-span-2 mb-1 md:mb-0">
                <p className="text-xs font-bold text-black">{formatCurrency(order.total)}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${order.paymentStatus === 'SUCCESS' ? 'bg-green-500' : 'bg-amber-500'}`} />
                  <span className="text-[9px] font-bold uppercase">
                    {order.isDepositRequired && order.paymentStatus !== 'SUCCESS'
                      ? (order.depositPaid ? "Đã cọc" : "Chờ cọc")
                      : (order.paymentStatus === 'SUCCESS' ? 'Đã TT' : 'Chưa TT')}
                  </span>
                </div>
                {order.paymentMethod === 'COD' && order.isDepositRequired && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600 mt-0.5">
                    Cọc: {formatCurrency(order.depositAmount || 0)}
                  </span>
                )}
              </div>

              {/* Trạng thái */}
              <div className="col-span-12 md:col-span-2 mb-2 md:mb-0">
                <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-zinc-100 text-zinc-800'}`}>
                  {STATUS_OPTIONS.find((o) => o.value === order.status)?.label ?? order.status}
                </span>
                <select
                  value=""
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  disabled={updatingId === order.id}
                  className="mt-1 block w-full text-[10px] font-bold px-2 py-1 rounded border border-dashed border-zinc-300 cursor-pointer bg-white text-zinc-400 hover:border-zinc-500 hover:text-zinc-700 transition-all appearance-none focus:outline-none focus:ring-2 focus:ring-black/10"
                >
                  <option value="">↡ Đổi trạng thái</option>
                  {ALL_STATUS_OPTIONS.filter((opt) => opt.value !== order.status).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Thao tác */}
              <div className="col-span-12 md:col-span-2 flex items-center gap-2">
                {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && order.status !== 'PAYMENT_EXPIRED' && (
                  <button
                    onClick={() => setCancelModal({ orderId: order.id, orderCode: order.id.slice(0, 8) })}
                    disabled={updatingId === order.id}
                    className="px-2.5 py-1 bg-red-50 text-red-500 border border-red-100 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white hover:border-red-500 transition-all whitespace-nowrap disabled:opacity-40"
                  >
                    Hủy
                  </button>
                )}
                <Link href={`/admin/orders/${order.id}`} className="px-3 py-1 text-[10px] font-bold text-zinc-400 hover:text-black transition-colors whitespace-nowrap">
                  Chi tiết →
                </Link>
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-white md:bg-zinc-50/50 rounded-2xl border border-zinc-100 shadow-sm md:shadow-none md:rounded-none md:border-x-0 md:border-b-0 md:border-t flex items-center justify-between">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
              {(initialFilters.page - 1) * initialFilters.limit + 1}–{Math.min(initialFilters.page * initialFilters.limit, initialTotal)} / {initialTotal} đơn
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => updateUrl({ page: initialFilters.page - 1 })}
                disabled={initialFilters.page === 1}
                className="w-8 h-8 border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-400 hover:border-black hover:text-black disabled:opacity-40 transition-all text-xs"
              >
                ←
              </button>
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                if (p === 1 || p === totalPages || (p >= initialFilters.page - 1 && p <= initialFilters.page + 1)) {
                  return (
                    <button
                      key={p}
                      onClick={() => updateUrl({ page: p })}
                      className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                        p === initialFilters.page ? 'bg-black text-white shadow' : 'border border-zinc-200 text-zinc-400 hover:border-black hover:text-black'
                      }`}
                    >
                      {p}
                    </button>
                  );
                }
                if (p === initialFilters.page - 2 || p === initialFilters.page + 2) return <span key={p} className="flex items-end pb-1 text-zinc-300 text-xs">…</span>;
                return null;
              })}
              <button
                onClick={() => updateUrl({ page: initialFilters.page + 1 })}
                disabled={initialFilters.page === totalPages}
                className="w-8 h-8 border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-400 hover:border-black hover:text-black disabled:opacity-40 transition-all text-xs"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-[24px] flex items-center justify-center mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-2xl font-black text-black tracking-tight mb-2">Hủy đơn #{cancelModal.orderCode}?</h3>
            <p className="text-zinc-500 text-sm font-medium mb-6">
              Hành động này sẽ hủy đơn trên cả website và SuperShip. Không thể hoàn tác.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy đơn..."
              className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-red-500/5 outline-none mb-6 resize-none"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setCancelModal(null); setCancelReason(''); }}
                className="flex-1 py-4 bg-zinc-50 text-zinc-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-all"
              >
                Quay lại
              </button>
              <button
                onClick={handleCancel}
                disabled={updatingId === cancelModal.orderId}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-600/20 disabled:opacity-50 transition-all"
              >
                {updatingId === cancelModal.orderId ? 'Processing...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
