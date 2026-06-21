"use client";

import Link from 'next/link';
import type { DashboardStats } from '@/lib/api/admin';
import { convertDriveLink } from '@/lib/utils';

const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xử lý', color: 'bg-amber-100 text-amber-800' },
  PROCESSING: { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800' },
  SHIPPED: { label: 'Đang giao', color: 'bg-purple-100 text-purple-800' },
  DELIVERED: { label: 'Đã giao', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
};

const SELL_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-800' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-blue-100 text-blue-800' },
  REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-800' },
  RECEIVED: { label: 'Đã nhận', color: 'bg-purple-100 text-purple-800' },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function DashboardContentClient({ stats }: { stats: DashboardStats }) {
  const kpis = [
    { label: 'Đơn hàng hôm nay', value: stats.ordersToday, icon: '📦', color: 'border-l-black' },
    { label: 'Doanh thu hôm nay', value: formatCurrency(stats.revenueToday), icon: '💰', color: 'border-l-green-600' },
    { label: 'Sản phẩm đang bán', value: stats.totalProducts, icon: '🛍️', color: 'border-l-blue-600' },
    { label: 'Yêu cầu ký gửi chờ duyệt', value: stats.pendingSellRequests, icon: '📋', color: 'border-l-amber-500' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`bg-white border border-zinc-200 p-5 border-l-4 ${kpi.color}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{kpi.icon}</span>
            </div>
            <p className="text-sm text-zinc-500 font-medium">{kpi.label}</p>
            <p className="text-2xl font-bold text-black mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-zinc-200 p-4 text-center">
          <p className="text-2xl font-bold text-black">{stats.totalOrders}</p>
          <p className="text-xs text-zinc-500 mt-1">Tổng đơn hàng</p>
        </div>
        <div className="bg-white border border-zinc-200 p-4 text-center">
          <p className="text-2xl font-bold text-black">{stats.totalUsers}</p>
          <p className="text-xs text-zinc-500 mt-1">Người dùng</p>
        </div>
        <div className="bg-white border border-zinc-200 p-4 text-center">
          <p className="text-2xl font-bold text-black">
            {stats.ordersByStatus.find((s) => s.status === 'PENDING')?.count ?? 0}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Đơn chờ xử lý</p>
        </div>
        <div className="bg-white border border-zinc-200 p-4 text-center">
          <p className="text-2xl font-bold text-black">{stats.pendingSellRequests}</p>
          <p className="text-xs text-zinc-500 mt-1">Yêu cầu ký gửi mới</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white border border-zinc-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
            <h2 className="text-sm font-semibold text-black">Đơn hàng gần đây</h2>
            <Link href="/admin/orders" className="text-xs text-brand-red hover:underline font-medium">
              Xem tất cả →
            </Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-zinc-400 py-8 text-center">Chưa có đơn hàng nào.</p>
            ) : (
              stats.recentOrders.map((order) => {
                const st = ORDER_STATUS_LABELS[order.status] || { label: order.status, color: 'bg-zinc-100 text-zinc-800' };
                return (
                  <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-black">
                        {order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Khách vãng lai'}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">{formatDate(order.createdAt)} · #{order.id.slice(0, 8)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-black">{formatCurrency(order.total)}</p>
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded mt-1 ${st.color}`}>{st.label}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Sell Requests */}
        <div className="bg-white border border-zinc-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
            <h2 className="text-sm font-semibold text-black">Yêu cầu ký gửi mới</h2>
            <Link href="/admin/sell-requests" className="text-xs text-brand-red hover:underline font-medium">
              Xem tất cả →
            </Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {stats.recentSellRequests.length === 0 ? (
              <p className="text-sm text-zinc-400 py-8 text-center">Không có yêu cầu nào đang chờ.</p>
            ) : (
              stats.recentSellRequests.map((req) => {
                const st = SELL_STATUS_LABELS[req.status] || { label: req.status, color: 'bg-zinc-100 text-zinc-800' };
                return (
                  <Link key={req.id} href={`/admin/sell-requests`} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-black">{req.contactName}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {formatDate(req.createdAt)} · {req.items.length} sản phẩm
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${st.color}`}>{st.label}</span>
                      <p className="text-xs text-zinc-400 mt-1">{req.saleType === 'CONSIGNMENT' ? 'Ký gửi' : 'Thu mua'}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Orders by Status */}
      <div className="bg-white border border-zinc-200">
        <div className="px-5 py-4 border-b border-zinc-200">
          <h2 className="text-sm font-semibold text-black">Trạng thái đơn hàng</h2>
        </div>
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(Object.keys(ORDER_STATUS_LABELS) as Array<keyof typeof ORDER_STATUS_LABELS>).map((status) => {
              const count = stats.ordersByStatus.find((s) => s.status === status)?.count ?? 0;
              const info = ORDER_STATUS_LABELS[status];
              const total = stats.totalOrders || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status} className="border border-zinc-200 rounded p-3 text-center">
                  <p className="text-2xl font-bold text-black">{count}</p>
                  <div className="mt-2 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-black rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2">{info.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Products */}
      {stats.topProducts.length > 0 && (
        <div className="bg-white border border-zinc-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
            <h2 className="text-sm font-semibold text-black">Sản phẩm bán chạy</h2>
            <Link href="/admin/products" className="text-xs text-brand-red hover:underline font-medium">
              Xem tất cả →
            </Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {stats.topProducts.map((product, idx) => (
              <div key={product.id} className="flex items-center gap-4 px-5 py-3">
                <span className="text-sm font-bold text-zinc-300 w-4 shrink-0">{idx + 1}</span>
                <div className="w-10 h-10 bg-zinc-100 rounded overflow-hidden shrink-0">
                  {product.images[0] ? (
                    <img src={convertDriveLink(product.images[0])} alt={product.name} className="w-full h-full object-cover" loading="eager" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">No img</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">{product.name}</p>
                  <p className="text-xs text-zinc-400">{product.orderCount} đơn hàng</p>
                </div>
                <p className="text-sm font-semibold text-black shrink-0">{formatCurrency(product.price)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/products/new" className="bg-white border border-zinc-200 px-5 py-4 hover:border-black transition-colors group">
          <p className="text-sm font-semibold text-black group-hover:text-brand-red transition-colors">+ Thêm sản phẩm mới</p>
          <p className="text-xs text-zinc-400 mt-1">Tạo sản phẩm mới cho cửa hàng</p>
        </Link>
        <Link href="/admin/orders?status=PENDING" className="bg-white border border-zinc-200 px-5 py-4 hover:border-black transition-colors group">
          <p className="text-sm font-semibold text-black group-hover:text-brand-red transition-colors">Xem đơn hàng chờ</p>
          <p className="text-xs text-zinc-400 mt-1">{(stats.ordersByStatus.find((s) => s.status === 'PENDING')?.count ?? 0)} đơn chưa xử lý</p>
        </Link>
        <Link href="/admin/sell-requests" className="bg-white border border-zinc-200 px-5 py-4 hover:border-black transition-colors group">
          <p className="text-sm font-semibold text-black group-hover:text-brand-red transition-colors">Duyệt ký gửi</p>
          <p className="text-xs text-zinc-400 mt-1">{stats.pendingSellRequests} yêu cầu đang chờ</p>
        </Link>
      </div>
    </div>
  );
}
