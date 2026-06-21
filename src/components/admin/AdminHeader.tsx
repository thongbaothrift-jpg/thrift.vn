'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

// Inline SVGs — avoids lucide-react bundle overhead
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" x2="20" y1="12" y2="12"/>
    <line x1="4" x2="20" y1="6" y2="6"/>
    <line x1="4" x2="20" y1="18" y2="18"/>
  </svg>
);

const pageNames: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/orders': 'Đơn hàng',
  '/admin/products': 'Sản phẩm',
  '/admin/users': 'Người dùng',
  '/admin/blog': 'Quản lý Blog',
  '/admin/coupons': 'Mã giảm giá',
  '/admin/sell-requests': 'Ký gửi / Thu mua',
  '/admin/brands': 'Thương hiệu',
  '/admin/categories': 'Danh mục',
  '/admin/banners': 'Quản lý Banner',
  '/admin/attributes': 'Thuộc tính sản phẩm',
  '/admin/settings': 'Cài đặt hệ thống',
  '/admin/return-requests': 'Yêu cầu hoàn hàng',
};

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [totalBadge, setTotalBadge] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef(false);

  const fetchBadge = useCallback(async () => {
    if (isFetchingRef.current) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('thrifted_auth_token') : null;
    if (!token) return;

    const API_BASE = process.env.NEXT_PUBLIC_API_URL;
    isFetchingRef.current = true;
    let total = 0;

    try {
      const [notifRes, returnRes] = await Promise.all([
        fetch(`${API_BASE}/admin/notifications?limit=1`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/admin/return-requests?status=PENDING&limit=1`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (notifRes.ok) {
        const nd = await notifRes.json();
        total += nd.unreadCount ?? 0;
      }
      if (returnRes.ok) {
        const rd = await returnRes.json();
        total += rd.pendingCount ?? 0;
      }
      setTotalBadge(total);
    } catch {
      // ignore
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Poll every 60s instead of 30s — reduces API calls by 50%
  useEffect(() => {
    if (!user) return;
    fetchBadge();
    intervalRef.current = setInterval(fetchBadge, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, fetchBadge]);

  const pageName = pageNames[pathname] || 'Admin';

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'AD';

  return (
    <header className="h-14 md:h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4 md:px-6 shrink-0">
      {/* Left: hamburger (mobile) + page title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger menu button — mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-all shrink-0"
          aria-label="Mở menu"
        >
          <MenuIcon />
        </button>

        <h1 className="text-sm md:text-base font-semibold text-black tracking-tight truncate">
          {pageName}
        </h1>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        {/* Search button */}
        <button className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-all">
          <SearchIcon />
        </button>

        {/* Notification */}
        <button className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-all relative">
          <BellIcon />
          {totalBadge > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-brand-red text-white text-[10px] font-bold px-1 rounded-full flex items-center justify-center">
              {totalBadge > 99 ? '99+' : totalBadge}
            </span>
          )}
        </button>

        {/* User avatar */}
        <Link href="/account" className="flex items-center gap-2 ml-1 group">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-black leading-none group-hover:text-brand-red transition-colors">
              {user ? `${user.firstName} ${user.lastName}` : 'Admin'}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[140px]">{user?.email}</p>
          </div>
          <div
            className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center text-xs font-bold shrink-0 group-hover:bg-brand-red transition-colors"
          >
            {initials}
          </div>
        </Link>
      </div>
    </header>
  );
}
