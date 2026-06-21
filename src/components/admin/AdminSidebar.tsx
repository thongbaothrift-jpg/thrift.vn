"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

// Inline SVGs for sidebar icons — avoids lucide-react bundle overhead
// Each SVG is ~300-500 bytes, tree-shaken individually
const icons = {
  LayoutDashboard: (size: number) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  ),
  ShoppingCart: (size: number) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  ),
  Package: (size: number) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  ),
  Users: (size: number) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  FileText: (size: number) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  ),
  Ticket: (size: number) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  ),
  HandCoins: (size: number) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
      <path d="M7 21h1.5a1.5 1.5 0 0 0 0-3H5a2 2 0 0 1 0-4h3c.6 0 1.1.2 1.4.6l1.8 2.4a1.5 1.5 0 0 0 2.8-.6Z" />
      <path d="m14 14 1-1a2 2 0 0 1 3 3l-1.5 1.5a2 2 0 0 1-3-.5l-.5-.5a2 2 0 0 1 .5-3l1-1" />
    </svg>
  ),
  LogOut: (size: number) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  ),
  ExternalLink: (size: number) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  ),
  LayoutGrid: (size: number) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  ),
  Image: (size: number) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  ),
  Settings2: (size: number) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 7h-9" />
      <path d="M14 17H5" />
      <circle cx="17" cy="17" r="3" />
      <circle cx="7" cy="7" r="3" />
    </svg>
  ),
  X: (size: number) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  ),
  Tags: (size: number) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  ),
  Layers: (size: number) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </svg>
  ),
  Settings: (size: number) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  TrendingUp: (size: number) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  MessageSquare: (size: number) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
} as const;

type IconName = keyof typeof icons;

const ICON_SIZE = 18 as const;

interface NavItemBase {
  label: string;
  href: string;
  icon: IconName;
}

const MAIN_NAV_BASE: NavItemBase[] = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { label: "Đơn hàng", href: "/admin/orders", icon: "ShoppingCart" },
  { label: "Sản phẩm", href: "/admin/products", icon: "Package" },
  { label: "Doanh thu", href: "/admin/revenue", icon: "TrendingUp" },
  { label: "Người dùng", href: "/admin/users", icon: "Users" },
  { label: "Blog", href: "/admin/blog", icon: "FileText" },
  { label: "Danh mục", href: "/admin/categories", icon: "Layers" },
  { label: "Thương hiệu", href: "/admin/brands", icon: "Tags" },
  { label: "Mã giảm giá", href: "/admin/coupons", icon: "Ticket" },
  { label: "Banner", href: "/admin/banners", icon: "Image" },
  { label: "Thuộc tính", href: "/admin/attributes", icon: "Settings2" },
  { label: "Bình luận", href: "/admin/comments", icon: "MessageSquare" },
];

const SECONDARY_NAV_BASE: NavItemBase[] = [
  {
    label: "Ký gửi / Thu mua",
    href: "/admin/sell-requests",
    icon: "HandCoins",
  },
  { label: "Vận chuyển", href: "/admin/shipping", icon: "Package" },
  { label: "Nội dung", href: "/admin/site-texts", icon: "FileText" },
  { label: "Menu Navigation", href: "/admin/navigation", icon: "LayoutGrid" },
  { label: "Cài đặt", href: "/admin/settings", icon: "Settings" },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
  onNavClick: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AdminSidebar({
  open,
  onClose,
  onNavClick,
  collapsed,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);

  // Reset optimistic path when real pathname changes
  React.useEffect(() => {
    setOptimisticPath(null);
  }, [pathname]);

  const mainNav = MAIN_NAV_BASE;
  const secondaryNav = SECONDARY_NAV_BASE;

  const handleLogout = () => {
    logout();
    router.push("/");
    onClose();
  };

  const isActive = (href: string) => {
    const currentPath = optimisticPath || pathname;
    if (href === "/admin") return currentPath === "/admin";
    return currentPath.startsWith(href);
  };

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "AD";

  const NavLink = ({
    item,
  }: {
    item: { label: string; href: string; icon: IconName; badge?: number };
  }) => {
    const active = isActive(item.href);

    const handleClick = () => {
      if (item.href === pathname) return;
      setOptimisticPath(item.href);
      if (onNavClick) onNavClick();
      // next/link handles navigation — no router.push needed
    };

    return (
      <Link
        href={item.href}
        onClick={handleClick}
        className={`
          flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold
          transition-all duration-500 relative group
          ${
            active
              ? "bg-white text-black shadow-lg shadow-white/5"
              : "text-zinc-500 hover:text-white hover:bg-white/5"
          }
        `}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-red rounded-r-full shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
        )}
        <span className={`shrink-0 ${active ? "text-black" : "text-zinc-400"}`}>
          {icons[item.icon](ICON_SIZE)}
        </span>
        <span
          className={`flex-1 truncate transition-all duration-300 ${collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"}`}
        >
          {item.label}
        </span>
        {item.badge && item.badge > 0 && !collapsed && (
          <span className="ml-auto bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-full flex-col z-40 border-r border-white/5 transition-all duration-300 ${collapsed ? "w-[68px]" : "w-[260px]"}`}
        style={{ background: "#1c1c1c" }}
      >
        <SidebarContent
          initials={initials}
          NavLink={NavLink}
          handleLogout={handleLogout}
          mainNav={mainNav}
          secondaryNav={secondaryNav}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`
          md:hidden fixed left-0 top-0 h-full w-[280px] flex-col z-50
          transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ background: "#1c1c1c" }}
      >
        <SidebarContent
          initials={initials}
          NavLink={NavLink}
          handleLogout={handleLogout}
          mainNav={mainNav}
          secondaryNav={secondaryNav}
          onClose={onClose}
          mobile
        />
      </aside>
    </>
  );
}

function SidebarContent({
  initials,
  NavLink,
  handleLogout,
  mainNav,
  secondaryNav,
  onClose,
  mobile,
  collapsed,
  onToggleCollapse,
}: {
  initials: string;
  NavLink: (props: {
    item: { label: string; href: string; icon: IconName; badge?: number };
  }) => React.ReactElement;
  handleLogout: () => void;
  mainNav: NavItemBase[];
  secondaryNav: NavItemBase[];
  onClose?: () => void;
  mobile?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 shrink-0 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0">
            {icons.LayoutGrid(16)}
          </div>
          {!collapsed && (
            <span className="font-black text-sm tracking-widest text-white uppercase whitespace-nowrap">
              THRIFTED<span className="text-brand-red">.ADMIN</span>
            </span>
          )}
        </Link>
        {mobile && onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            {icons.X(16)}
          </button>
        )}
        {!mobile && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 rounded transition-colors shrink-0"
            title={collapsed ? "Mở rộng sidebar" : "Thu hẹp sidebar"}
          >
            {collapsed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="px-4 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-semibold truncate uppercase tracking-tighter">
                Admin Panel
              </p>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest truncate">
                Administrator
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-hide">
        <div>
          {!collapsed && (
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-3 mb-3">
              Core Management
            </p>
          )}
          <div className="space-y-1">
            {mainNav.map((item) => (
              <div key={item.href} className="relative group">
                <NavLink item={item} />
                {collapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-black text-white text-xs font-bold rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-lg">
                    {item.label}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div>
          {!collapsed && (
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-3 mb-3">
              Services
            </p>
          )}
          <div className="space-y-1">
            {secondaryNav.map((item) => (
              <div key={item.href} className="relative group">
                <NavLink item={item} />
                {collapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-black text-white text-xs font-bold rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-lg">
                    {item.label}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-3 space-y-1 shrink-0">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          {icons.ExternalLink(16)}
          {!collapsed && (
            <span className="text-xs font-bold uppercase tracking-widest">
              Xem trang chủ
            </span>
          )}
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200"
        >
          {icons.LogOut(16)}
          {!collapsed && (
            <span className="text-xs font-bold uppercase tracking-widest">
              Đăng xuất
            </span>
          )}
        </button>
      </div>
    </>
  );
}
