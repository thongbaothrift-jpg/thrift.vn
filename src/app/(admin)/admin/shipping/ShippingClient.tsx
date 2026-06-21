"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getShippingSummary, getPendingShipOrders, getActiveShipOrders,
  getReturnedShipOrders, getAdminNotifications,
  createSupershipOrderManual, cancelSupershipOrder,
  markNotificationRead, markAllNotificationsRead, deleteNotification,
  trackSupershipOrder,
  type ShippingSummary, type ShippingOrder, type AdminNotification,
} from "@/lib/api/admin";
import { Truck, Package, RotateCcw, Bell, CheckCircle2, Clock, AlertTriangle, RefreshCw, ExternalLink, X, Trash2, Eye, XCircle } from "lucide-react";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

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

const NOTIF_TYPE_LABELS: Record<string, string> = {
  SUPERSHIP_ORDER_FAIL: "Lỗi tạo vận đơn",
  SUPERSHIP_CANCEL_FAIL: "Lỗi huỷ vận đơn",
  PICKUP_FAIL: "Lỗi tạo pickup",
  ORDER_ISSUE: "Vấn đề đơn hàng",
  PAYMENT_ISSUE: "Vấn đề thanh toán",
};

interface Props {
  initialTab: string;
  initialPage: number;
  initialSummary: ShippingSummary;
  pendingData: { orders: ShippingOrder[]; total: number };
  activeData: { orders: ShippingOrder[]; total: number };
  returnedData: { orders: ShippingOrder[]; total: number };
  notificationsData: { notifications: AdminNotification[]; total: number; unreadCount: number };
}

export function ShippingClient({
  initialTab, initialPage, initialSummary,
  pendingData, activeData, returnedData, notificationsData,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(initialTab);
  const [summary, setSummary] = useState(initialSummary);
  const [pending, setPending] = useState(pendingData);
  const [active, setActive] = useState(activeData);
  const [returned, setReturned] = useState(returnedData);
  const [notifications, setNotifications] = useState(notificationsData);
  const [loading, setLoading] = useState<string | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<Record<string, any>>({});
  const [selectedNotif, setSelectedNotif] = useState<AdminNotification | null>(null);

  const changeTab = (newTab: string) => {
    setTab(newTab);
    router.push(`/admin/shipping?tab=${newTab}&page=1`, { scroll: false });
  };

  const refreshAll = async () => {
    setLoading("refresh");
    try {
      const [s, p, a, r, n] = await Promise.all([
        getShippingSummary(),
        getPendingShipOrders({ page: 1 }),
        getActiveShipOrders({ page: 1 }),
        getReturnedShipOrders({ page: 1 }),
        getAdminNotifications({ limit: 20 }),
      ]);
      setSummary(s);
      setPending(p);
      setActive(a);
      setReturned(r);
      setNotifications(n);
    } finally {
      setLoading(null);
    }
  };

  const handleCreateOrder = async (orderId: string) => {
    if (!confirm("Tạo vận đơn SuperShip cho đơn này?")) return;
    setLoading(orderId);
    try {
      const res = await createSupershipOrderManual(orderId);
      if (res.success) {
        await refreshAll();
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi tạo vận đơn");
    } finally {
      setLoading(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Huỷ vận đơn SuperShip? Hành động này không thể hoàn tác.")) return;
    setLoading(`cancel-${orderId}`);
    try {
      await cancelSupershipOrder(orderId);
      await refreshAll();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi huỷ vận đơn");
    } finally {
      setLoading(null);
    }
  };

  const handleTrackOrder = async (trackingCode: string) => {
    if (trackingInfo[trackingCode]) {
      setTrackingInfo(prev => { const n = { ...prev }; delete n[trackingCode]; return n; });
      return;
    }
    setLoading(`track-${trackingCode}`);
    try {
      const info = await trackSupershipOrder(trackingCode);
      setTrackingInfo(prev => ({ ...prev, [trackingCode]: info }));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Không lấy được thông tin");
    } finally {
      setLoading(null);
    }
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
      unreadCount: Math.max(0, prev.unreadCount - 1),
    }));
    if (selectedNotif?.id === id) {
      setSelectedNotif(prev => prev ? { ...prev, isRead: true } : null);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  };

  const handleDeleteNotif = async (id: string) => {
    await deleteNotification(id);
    setNotifications(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id),
      total: prev.total - 1,
      unreadCount: prev.notifications.find(n => n.id === id && !n.isRead)
        ? prev.unreadCount - 1
        : prev.unreadCount,
    }));
    if (selectedNotif?.id === id) setSelectedNotif(null);
  };

  const tabs = [
    {
      id: "pending",
      label: "Chờ tạo vận đơn",
      count: summary.pendingOrders,
      icon: <Clock size={14} />,
      color: "text-amber-600",
    },
    {
      id: "active",
      label: "Đang vận chuyển",
      count: summary.shippedOrders,
      icon: <Truck size={14} />,
      color: "text-blue-600",
    },
    {
      id: "returned",
      label: "Hoàn về",
      count: summary.returnedOrders,
      icon: <RotateCcw size={14} />,
      color: "text-red-600",
    },
    {
      id: "notifications",
      label: "Thông báo",
      count: notifications.unreadCount,
      icon: <Bell size={14} />,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Clock size={18} className="text-amber-500" />}
          label="Chờ tạo vận đơn"
          value={summary.pendingOrders}
          bg="bg-amber-50"
          onClick={() => changeTab("pending")}
        />
        <SummaryCard
          icon={<Truck size={18} className="text-blue-500" />}
          label="Đang vận chuyển"
          value={summary.shippedOrders}
          bg="bg-blue-50"
          onClick={() => changeTab("active")}
        />
        <SummaryCard
          icon={<RotateCcw size={18} className="text-red-500" />}
          label="Hoàn về"
          value={summary.returnedOrders}
          bg="bg-red-50"
          onClick={() => changeTab("returned")}
        />
        <SummaryCard
          icon={<Bell size={18} className="text-purple-500" />}
          label="Cần xử lý"
          value={notifications.unreadCount + summary.failedNotifs}
          bg="bg-purple-50"
          onClick={() => changeTab("notifications")}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-zinc-100 rounded-2xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => changeTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === t.id
                ? "bg-black text-white shadow-lg"
                : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
              }`}
          >
            {t.icon}
            <span>{t.label}</span>
            {t.count > 0 && (
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${tab === t.id ? "bg-white text-black" : "bg-zinc-100 text-zinc-600"
                }`}>
                {t.count > 99 ? "99+" : t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "pending" && (
        <OrdersTable
          title="Đơn đã thanh toán — chưa tạo vận đơn"
          subtitle="Tạo vận đơn SuperShip để bắt đầu vận chuyển."
          orders={pending.orders}
          total={pending.total}
          emptyMessage="Không có đơn nào chờ tạo vận đơn."
          loading={loading}
          actions={(order) => (
            <button
              onClick={() => handleCreateOrder(order.id)}
              disabled={loading === order.id}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading === order.id ? <RefreshCw size={10} className="animate-spin" /> : <Truck size={10} />}
              Tạo vận đơn
            </button>
          )}
        />
      )}

      {tab === "active" && (
        <div className="space-y-4">
          <OrdersTable
            title="Đơn đang vận chuyển"
            subtitle="Theo dõi trạng thái từ SuperShip."
            orders={active.orders}
            total={active.total}
            emptyMessage="Không có đơn nào đang vận chuyển."
            loading={loading}
            showTracking
            trackingInfo={trackingInfo}
            onTrack={(code) => handleTrackOrder(code)}
            actions={(order) => (
              <div className="flex items-center gap-2">
                {order.trackingCode && (
                  <>
                    <a
                      href={`https://tracking.supership.vn/?code=${order.trackingCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-1.5"
                    >
                      <ExternalLink size={10} />
                      SuperShip
                    </a>
                    {order.shippingStatus && order.shippingStatus !== "DELIVERED" && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={loading === `cancel-${order.id}`}
                        className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle size={10} />
                        Huỷ vận đơn
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          />
        </div>
      )}

      {tab === "returned" && (
        <OrdersTable
          title="Đơn hoàn về"
          subtitle="Liên hệ khách hàng và xử lý đơn hoàn."
          orders={returned.orders}
          total={returned.total}
          emptyMessage="Không có đơn hoàn về."
          loading={loading}
          actions={(order) => (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-700`}>
              {SHIPPING_STATUS_LABELS[order.shippingStatus || ""] || order.shippingStatus || "—"}
            </span>
          )}
        />
      )}

      {tab === "notifications" && (
        <div className="bg-white border border-zinc-100 rounded-[32px] overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-zinc-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Thông báo</h3>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">{notifications.unreadCount} chưa đọc / {notifications.total} tổng</p>
            </div>
            {notifications.unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-black text-zinc-400 hover:text-black uppercase tracking-widest transition-colors"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {notifications.notifications.length === 0 ? (
            <div className="p-12 text-center text-zinc-300">
              <Bell size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Không có thông báo nào.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {notifications.notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => {
                    setSelectedNotif(notif);
                    if (!notif.isRead) handleMarkRead(notif.id);
                  }}
                  className={`px-8 py-5 cursor-pointer hover:bg-zinc-50/50 transition-colors ${!notif.isRead ? "bg-blue-50/20" : ""}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notif.type === "SUPERSHIP_ORDER_FAIL" ? "bg-red-50 text-red-500" :
                        notif.type === "ORDER_ISSUE" ? "bg-amber-50 text-amber-500" :
                          "bg-purple-50 text-purple-500"
                      }`}>
                      <AlertTriangle size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            {NOTIF_TYPE_LABELS[notif.type] || notif.type}
                          </span>
                          {!notif.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <span className="text-[10px] font-black text-zinc-400 whitespace-nowrap">
                          {formatDate(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-zinc-900 mt-1 leading-snug">{notif.title}</p>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteNotif(notif.id); }}
                      className="p-2 text-zinc-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notification Detail Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedNotif(null)}>
          <div className="bg-white rounded-[32px] max-w-lg w-full p-8 shadow-2xl animate-scale-up"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedNotif.type === "SUPERSHIP_ORDER_FAIL" ? "bg-red-50 text-red-500" :
                    selectedNotif.type === "ORDER_ISSUE" ? "bg-amber-50 text-amber-500" :
                      "bg-purple-50 text-purple-500"
                  }`}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    {NOTIF_TYPE_LABELS[selectedNotif.type] || selectedNotif.type}
                  </p>
                  <p className="text-[10px] font-black text-zinc-400 mt-0.5">{formatDate(selectedNotif.createdAt)}</p>
                </div>
              </div>
              <button onClick={() => setSelectedNotif(null)} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                <X size={16} className="text-zinc-400" />
              </button>
            </div>
            <h3 className="text-xl font-black text-zinc-900 mb-3">{selectedNotif.title}</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">{selectedNotif.message}</p>
            {selectedNotif.data && (
              <div className="mt-6 p-4 bg-zinc-50 rounded-2xl text-xs font-mono text-zinc-500 space-y-1">
                {Object.entries(selectedNotif.data).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="font-black text-zinc-700">{k}:</span>
                    <span>{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 flex gap-3">
              {selectedNotif.data?.orderId && (
                <a
                  href={`/admin/orders/${selectedNotif.data.orderId}`}
                  className="flex-1 py-3 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest text-center hover:bg-zinc-800 transition-all"
                >
                  Xem đơn hàng
                </a>
              )}
              <button
                onClick={() => setSelectedNotif(null)}
                className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-2xl text-xs font-black uppercase tracking-widest text-center hover:bg-zinc-200 transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function SummaryCard({ icon, label, value, bg, onClick }: {
  icon: React.ReactNode; label: string; value: number; bg: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={`${bg} border border-zinc-100 rounded-2xl p-5 text-left hover:scale-[1.02] transition-all cursor-pointer active:scale-[0.98]`}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <span className="text-2xl font-black text-zinc-900">{value}</span>
      </div>
      <p className="text-xs font-black uppercase tracking-widest text-zinc-500">{label}</p>
    </button>
  );
}

function OrdersTable({ title, subtitle, orders, total, emptyMessage, loading, showTracking, trackingInfo, onTrack, actions }: {
  title: string; subtitle: string; orders: ShippingOrder[]; total: number; emptyMessage: string;
  loading: string | null; showTracking?: boolean; trackingInfo?: Record<string, any>; onTrack?: (code: string) => void;
  actions: (order: ShippingOrder) => React.ReactNode;
}) {
  return (
    <div className="bg-white border border-zinc-100 rounded-[32px] overflow-hidden shadow-sm">
      <div className="px-8 py-6 border-b border-zinc-50">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">{title}</h3>
        <p className="text-xs text-zinc-400 font-medium mt-0.5">{subtitle} ({total} đơn)</p>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center text-zinc-300">
          <Package size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">{emptyMessage}</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-50">
          {orders.map(order => (
            <div key={order.id} className="px-8 py-5 hover:bg-zinc-50/30 transition-colors">
              <div className="flex items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-black text-zinc-900 font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                    {order.trackingCode && (
                      <span className="text-[10px] font-black text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full font-mono">
                        {order.trackingCode}
                      </span>
                    )}
                    {order.shippingStatus && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${order.shippingStatus === "DELIVERED" ? "bg-green-100 text-green-700" :
                          order.shippingStatus === "IN_TRANSIT" ? "bg-blue-100 text-blue-700" :
                            order.shippingStatus === "RETURNED" ? "bg-red-100 text-red-700" :
                              "bg-zinc-100 text-zinc-600"
                        }`}>
                        {SHIPPING_STATUS_LABELS[order.shippingStatus] || order.shippingStatus}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>{order.shippingName}</span>
                    <span>{order.shippingPhone}</span>
                    <span className="truncate max-w-[200px]">{order.shippingAddress}</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                  {showTracking && order.trackingCode && trackingInfo?.[order.trackingCode] && (
                    <div className="mt-3 p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-xs space-y-1.5">
                      {(() => {
                        const info = trackingInfo[order.trackingCode];
                        if (!info) return null;
                        return (
                          <>
                            {info.status && (
                              <div className="flex gap-2">
                                <span className="font-black text-zinc-500">Trạng thái:</span>
                                <span className="font-bold text-zinc-900">{info.status_name || info.status}</span>
                              </div>
                            )}
                            {info.created && (
                              <div className="flex gap-2">
                                <span className="font-black text-zinc-500">Tạo lúc:</span>
                                <span className="text-zinc-700">{info.created}</span>
                              </div>
                            )}
                            {info.updated && (
                              <div className="flex gap-2">
                                <span className="font-black text-zinc-500">Cập nhật:</span>
                                <span className="text-zinc-700">{info.updated}</span>
                              </div>
                            )}
                            {info.history && Array.isArray(info.history) && info.history.length > 0 && (
                              <div className="pt-1 border-t border-zinc-100 mt-1.5">
                                {info.history.slice(0, 3).map((h: any, i: number) => (
                                  <div key={i} className="flex gap-2 py-0.5">
                                    <span className="font-black text-zinc-400">{h.time || ""}</span>
                                    <span className="text-zinc-600">{h.status_name || h.status || h.action || ""}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {showTracking && order.trackingCode && (
                    <button
                      onClick={() => onTrack?.(order.trackingCode!)}
                      disabled={loading === `track-${order.trackingCode}`}
                      className="px-3 py-1.5 bg-zinc-50 border border-zinc-100 text-zinc-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {loading === `track-${order.trackingCode}` ? <RefreshCw size={10} className="animate-spin" /> : <Eye size={10} />}
                      Chi tiết
                    </button>
                  )}
                  {actions(order)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
