"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateUser, type AdminUser, type AdminOrder } from '@/lib/api/admin';
import { useAuth } from '@/lib/auth-context';
import { Search, UserCheck, ShieldAlert, Calendar, ChevronRight, Mail, Phone, ShoppingBag, ArrowRight } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: '', label: 'Tất cả vai trò' },
  { value: 'USER', label: 'Khách hàng' },
  { value: 'ADMIN', label: 'Quản trị viên' },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
}

function UserDetailPanel({ user, onClose, currentLoggedInUserId }: { user: AdminUser; onClose: () => void; currentLoggedInUserId?: string }) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  useState(() => {
    fetch(`/api/admin/users/${user.id}/orders`)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  });

  const handleRoleToggle = async () => {
    setUpdating(true);
    try {
      const newRole = currentUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
      const updated = await updateUser(user.id, { role: newRole });
      if (updated) {
        setCurrentUser({ ...currentUser, role: updated.role });
      }
    } catch {}
    finally { setUpdating(false); }
  };

  const initials = `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase();
  const isSelf = currentLoggedInUserId === user.id;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl z-[60] flex flex-col animate-slide-in-right">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-black">Hồ sơ người dùng</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Chi tiết & Lịch sử hoạt động</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* Profile Header */}
          <div className="flex items-center gap-6 pb-10 border-b border-zinc-100">
            <div className="w-20 h-20 rounded-3xl bg-zinc-900 text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-black/10 shrink-0">
              {initials}
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-black tracking-tight">{currentUser.firstName} {currentUser.lastName}</h3>
              <div className="flex flex-wrap gap-3">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${currentUser.role === 'ADMIN' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                  {currentUser.role}
                </span>
                {currentUser.isEmailVerified && (
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-100">
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-50 p-5 rounded-3xl border border-zinc-100">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Tổng đơn hàng</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-black">{currentUser._count?.orders ?? 0}</span>
                <ShoppingBag size={14} className="text-zinc-300" />
              </div>
            </div>
            <div className="bg-zinc-50 p-5 rounded-3xl border border-zinc-100">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Yêu cầu ký gửi</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-black">{currentUser._count?.sellRequests ?? 0}</span>
                <span className="text-zinc-300">📦</span>
              </div>
            </div>
          </div>

          {/* Info Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Thông tin liên hệ</h4>
            <div className="grid gap-3">
              <div className="flex items-center gap-4 p-4 bg-white border border-zinc-100 rounded-2xl hover:border-black transition-all group">
                <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email Address</p>
                  <p className="text-sm font-bold text-black">{currentUser.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white border border-zinc-100 rounded-2xl hover:border-black transition-all group">
                <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Phone Number</p>
                  <p className="text-sm font-bold text-black">{currentUser.phone || 'Chưa cập nhật'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white border border-zinc-100 rounded-2xl hover:border-black transition-all group">
                <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Ngày tham gia</p>
                  <p className="text-sm font-bold text-black">{formatDate(currentUser.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Role Action - Hidden for self */}
          {!isSelf && (
            <div className="pt-6">
              <button
                onClick={handleRoleToggle}
                disabled={updating}
                className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${
                  currentUser.role === 'ADMIN'
                    ? 'bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 shadow-none'
                    : 'bg-black text-white hover:bg-zinc-800 shadow-black/10'
                }`}
              >
                {updating ? 'Processing...' : (
                  <>
                    {currentUser.role === 'ADMIN' ? <ShieldAlert size={16} /> : <UserCheck size={16} />}
                    {currentUser.role === 'ADMIN' ? 'Hạ quyền xuống User' : 'Nâng cấp quyền Admin'}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Order History */}
          <div className="space-y-4 pt-4 pb-10">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Đơn hàng gần đây</h4>
              {orders.length > 0 && <span className="text-[10px] font-bold text-zinc-400">{orders.length} đơn hàng</span>}
            </div>
            
            {loadingOrders ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-zinc-50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="p-10 text-center bg-zinc-50 rounded-3xl border border-zinc-100 border-dashed">
                <ShoppingBag size={32} className="mx-auto text-zinc-200 mb-3" />
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Chưa có giao dịch</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="p-4 bg-white border border-zinc-100 rounded-2xl flex items-center justify-between hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center font-mono text-[10px] font-black">
                        #{order.id.slice(0, 4)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-black">{formatCurrency(order.total)}</p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                      order.status === 'DELIVERED' ? 'text-green-600 bg-green-50' : 
                      order.status === 'CANCELLED' ? 'text-red-500 bg-red-50' : 
                      'text-amber-600 bg-amber-50'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function X({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
}

export function UserTableClient({ 
  initialUsers, 
  initialTotal, 
  initialFilters 
}: { 
  initialUsers: AdminUser[];
  initialTotal: number;
  initialFilters: { role: string; search: string; page: number; limit: number };
}) {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialFilters.search);
  const [roleFilter, setRoleFilter] = useState(initialFilters.role);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const updateUrl = (overrides: any) => {
    const params = new URLSearchParams();
    const s = overrides.search !== undefined ? overrides.search : search;
    const r = overrides.role !== undefined ? overrides.role : roleFilter;
    const p = overrides.page !== undefined ? overrides.page : initialFilters.page;

    if (s) params.set('search', s);
    if (r) params.set('role', r);
    if (p > 1) params.set('page', p.toString());

    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  };

  const totalPages = Math.ceil(initialTotal / initialFilters.limit);

  return (
    <div className={`space-y-6 transition-all duration-300 ${isPending ? 'opacity-50 grayscale-[0.2]' : 'opacity-100'}`}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Tổng thành viên</p>
            <h3 className="text-2xl font-black text-black">{initialTotal}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Khách hàng</p>
            <h3 className="text-2xl font-black text-black">{initialUsers.filter(u => u.role === 'USER').length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Quản trị viên</p>
            <h3 className="text-2xl font-black text-black">{initialUsers.filter(u => u.role === 'ADMIN').length}</h3>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <form onSubmit={(e) => { e.preventDefault(); updateUrl({ page: 1 }); }}>
              <input
                type="text"
                placeholder="Tìm tên, email, số điện thoại..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-black/5 transition-all outline-none shadow-sm"
              />
            </form>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              const val = e.target.value;
              setRoleFilter(val);
              updateUrl({ role: val, page: 1 });
            }}
            className="px-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-black/5 outline-none shadow-sm cursor-pointer min-w-[160px]"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Thành viên</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Liên hệ</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Vai trò</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Hoạt động</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {initialUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="max-w-[200px] mx-auto opacity-20">
                      <Users size={48} className="mx-auto mb-4" />
                      <p className="text-sm font-black uppercase tracking-widest">Không tìm thấy người dùng</p>
                    </div>
                  </td>
                </tr>
              ) : (
                initialUsers.map((user) => {
                  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
                  return (
                    <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 bg-zinc-900 text-white rounded-xl flex items-center justify-center text-[10px] font-black shadow-lg shadow-black/5 shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-black text-black text-sm tracking-tight">{user.firstName} {user.lastName}</p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">ID: {user.id.slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-zinc-600 font-medium text-xs">
                            <Mail size={12} className="text-zinc-300" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-bold">
                            <Phone size={12} className="text-zinc-300" />
                            {user.phone || 'Chưa cập nhật'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                          user.role === 'ADMIN' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <ShoppingBag size={12} className="text-zinc-400" />
                            <span className="text-xs font-black text-zinc-900">{user._count?.orders ?? 0} Đơn hàng</span>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter ml-5">
                            Join: {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="w-10 h-10 bg-zinc-50 text-zinc-400 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all group/btn ml-auto"
                        >
                          <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-5 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
              Showing {(initialFilters.page - 1) * initialFilters.limit + 1} to {Math.min(initialFilters.page * initialFilters.limit, initialTotal)} of {initialTotal} Users
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => updateUrl({ page: initialFilters.page - 1 })}
                disabled={initialFilters.page === 1}
                className="w-10 h-10 border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-400 hover:border-black hover:text-black disabled:opacity-40 transition-all"
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
                      className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                        p === initialFilters.page ? 'bg-black text-white shadow-lg shadow-black/10' : 'border border-zinc-200 text-zinc-400 hover:border-black hover:text-black'
                      }`}
                    >
                      {p}
                    </button>
                  );
                }
                if (p === initialFilters.page - 2 || p === initialFilters.page + 2) return <span key={p} className="flex items-end pb-2 text-zinc-300">...</span>;
                return null;
              })}
              <button
                onClick={() => updateUrl({ page: initialFilters.page + 1 })}
                disabled={initialFilters.page === totalPages}
                className="w-10 h-10 border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-400 hover:border-black hover:text-black disabled:opacity-40 transition-all"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedUser && (
        <UserDetailPanel 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
          currentLoggedInUserId={authUser?.id}
        />
      )}
    </div>
  );
}

function Users({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
