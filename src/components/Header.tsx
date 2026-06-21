"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getCategories, getBrands, getPublicSiteTexts } from "@/lib/api";
import type { Category, Brand } from "@/lib/api/types";

const CACHE_KEY = "thrifted_nav_data";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface NavCache {
  categories: Category[];
  brands: Brand[];
  siteTexts: Record<string, string>;
  timestamp: number;
}

export function Header() {
  const { toggleCart, totalItems } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState<
    Record<string, boolean>
  >({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [siteTexts, setSiteTexts] = useState<Record<string, string>>({});
  const pathname = usePathname();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const loadData = async () => {
      try {
        // Check localStorage cache first
        const cached =
          localStorage.getItem(CACHE_KEY) || sessionStorage.getItem(CACHE_KEY); // fallback to session if existing
        if (cached) {
          try {
            const parsed: NavCache = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < CACHE_TTL) {
              setCategories(parsed.categories);
              setBrands(parsed.brands);
              setSiteTexts(parsed.siteTexts || {});
              return;
            }
          } catch {
            // Invalid cache, fetch fresh
          }
        }

        const [cats, brs, texts] = await Promise.all([
          getCategories(),
          getBrands(),
          getPublicSiteTexts(),
        ]);
        const catList = cats ?? [];
        const brandList = brs ?? [];
        const textData = texts ?? {};

        setCategories(catList);
        setBrands(brandList);
        setSiteTexts(textData);

        // Cache for next navigation
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            categories: catList,
            brands: brandList,
            siteTexts: textData,
            timestamp: Date.now(),
          }),
        );
      } catch {
        setCategories([]);
        setBrands([]);
        setSiteTexts({});
      }
    };
    loadData();
  }, []);

  let navLinks: Array<{
    id: string;
    href: string;
    label: string;
    type: string;
    hasDropdown: boolean;
  }> = [];
  try {
    const rawMenu = siteTexts["config.main_menu"];
    if (rawMenu) {
      const parsed = JSON.parse(rawMenu);
      if (Array.isArray(parsed)) {
        navLinks = parsed.map((item: any, i: number) => ({
          id: item.id || `nav-${i}`,
          href: item.href,
          label: item.label,
          type: item.type || "LINK",
          hasDropdown: ["MEGA_MENU", "CATEGORIES", "BRANDS"].includes(
            item.type,
          ),
        }));
      }
    }
  } catch (err) {
    console.error("Lỗi parse menu:", err);
  }

  if (navLinks.length === 0) {
    navLinks = [
      {
        id: "1",
        href: "/shop",
        label: "Cửa hàng",
        type: "MEGA_MENU",
        hasDropdown: true,
      },
      {
        id: "2",
        href: "/sell",
        label: "Ký gửi",
        type: "LINK",
        hasDropdown: false,
      },
      {
        id: "3",
        href: "/blog",
        label: "Tin tức",
        type: "LINK",
        hasDropdown: false,
      },
      {
        id: "4",
        href: "/voucher",
        label: "Voucher",
        type: "LINK",
        hasDropdown: false,
      },
      {
        id: "5",
        href: "/contact",
        label: "Liên hệ",
        type: "LINK",
        hasDropdown: false,
      },
    ];
  }
  return (
    <header className="bg-white sticky top-0 z-40 border-b border-zinc-200">
      <nav className="relative max-w-[1440px] mx-auto px-4 sm:px-8 py-4 sm:py-5">
        {/* Desktop */}
        <div className="hidden md:flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-black tracking-tighter hover:text-brand-red transition-colors duration-300"
          >
            {siteTexts["brand.shop_name"] || "THRIFT☆"}
          </Link>

          <div className="flex items-center gap-8">
            {navLinks.map((link) => (
              <div
                key={link.id}
                className="relative group"
                onMouseEnter={() =>
                  link.hasDropdown && setActiveDropdown(link.id)
                }
                onMouseLeave={() => link.hasDropdown && setActiveDropdown(null)}
              >
                <Link
                  href={link.href}
                  className={`nav-link font-label ${pathname.startsWith(link.href) ? "active text-black" : "text-zinc-500"}`}
                >
                  {link.label}
                </Link>

                {link.hasDropdown && activeDropdown === link.id && (
                  <div className="absolute top-full left-0 pt-4 w-64 animate-[slideDown_0.2s_ease-out] z-50">
                    <div className="bg-white border border-zinc-100 shadow-xl py-4 flex flex-col rounded-xl">
                      {(link.type === "MEGA_MENU" ||
                        link.type === "CATEGORIES") && (
                        <>
                          <Link
                            href="/shop"
                            className="px-6 py-2.5 text-sm font-bold text-zinc-900 hover:text-brand-red hover:bg-zinc-50 transition-colors"
                          >
                            Tất cả sản phẩm
                          </Link>
                          <div className="h-[1px] bg-zinc-100 my-2 mx-6" />
                          {categories.length > 0 ? (
                            categories.map((parent) => {
                              const children = (parent as any).children || [];
                              return (
                                <div
                                  key={parent.id}
                                  className="relative group/item"
                                >
                                  <Link
                                    href={`/shop?category=${parent.slug}`}
                                    className="px-6 py-2.5 text-sm text-zinc-600 hover:text-brand-red hover:bg-zinc-50 transition-colors flex items-center justify-between capitalize"
                                  >
                                    {parent.name}
                                    {children.length > 0 && (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="m9 18 6-6-6-6" />
                                      </svg>
                                    )}
                                  </Link>

                                  {children.length > 0 && (
                                    <div className="absolute top-0 left-full w-56 hidden group-hover/item:flex flex-col bg-white border border-zinc-100 shadow-xl py-2 ml-1 rounded-xl">
                                      {children.map((child: any) => (
                                        <Link
                                          key={child.id}
                                          href={`/shop?category=${child.slug}`}
                                          className="px-6 py-2.5 text-sm text-zinc-600 hover:text-brand-red hover:bg-zinc-50 transition-colors capitalize"
                                        >
                                          {child.name}
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="px-6 py-2.5 text-sm text-zinc-500">
                              Đang cập nhật danh mục...
                            </div>
                          )}
                        </>
                      )}

                      {link.type === "MEGA_MENU" && (
                        <div className="h-[1px] bg-zinc-100 my-2 mx-6" />
                      )}

                      {(link.type === "MEGA_MENU" ||
                        link.type === "BRANDS") && (
                        <>
                          <div className="px-6 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            Thương hiệu
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {brands.slice(0, 8).map((brand) => (
                              <Link
                                key={brand.id}
                                href={`/shop?brand=${brand.slug}`}
                                className="px-6 py-2 text-sm text-zinc-600 hover:text-brand-red hover:bg-zinc-50 transition-colors block"
                              >
                                {brand.name}
                              </Link>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="p-2 hover:text-brand-red transition-all duration-300 hover:scale-110 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </Link>
            <Link
              href="/wishlist"
              className="p-2 hover:text-brand-red transition-all duration-300 hover:scale-110 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/account"
                  className="p-2 hover:text-brand-red transition-all duration-300 hover:scale-110 cursor-pointer"
                >
                  <span className="text-xs font-semibold">
                    {user?.firstName}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 hover:text-brand-red transition-all duration-300 hover:scale-110 cursor-pointer"
                  title="Đăng xuất"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" x2="9" y1="12" y2="12" />
                  </svg>
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="p-2 hover:text-brand-red transition-all duration-300 hover:scale-110 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="5" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                </svg>
              </Link>
            )}
            <button
              onClick={toggleCart}
              className="p-2 hover:text-brand-red transition-all duration-300 hover:scale-110 relative cursor-pointer"
              aria-label="Mở giỏ hàng"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-2"
            aria-label="Toggle menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mobileMenuOpen ? (
                <>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </>
              ) : (
                <>
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </>
              )}
            </svg>
          </button>
          <Link
            href="/search"
            className="p-2 hover:text-brand-red transition-all duration-300 hover:scale-110 cursor-pointer"
            aria-label="Tìm kiếm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </Link>
          <div className="flex-1" />
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 text-xl font-black tracking-tighter hover:text-brand-red transition-colors duration-300"
          >
            {siteTexts["brand.shop_name"] || "THRIFT☆"}
          </Link>
          <div className="flex-1" />
          <Link
            href="/wishlist"
            className="p-2 hover:text-brand-red transition-all duration-300 hover:scale-110 cursor-pointer"
            aria-label="Yêu thích"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                href="/account"
                className="p-2 hover:text-brand-red transition-all duration-300 hover:scale-110 cursor-pointer"
                aria-label="Tài khoản"
              >
                <span className="text-xs font-semibold hidden sm:inline">
                  {user?.firstName}
                </span>
                <svg
                  className="sm:hidden"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="5" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                </svg>
              </Link>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="p-2 hover:text-brand-red transition-all duration-300 hover:scale-110 cursor-pointer"
              aria-label="Đăng nhập"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="5" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
            </Link>
          )}
          <button
            onClick={toggleCart}
            className="p-2 hover:text-brand-red transition-all duration-300 hover:scale-110 relative cursor-pointer"
            aria-label="Mở giỏ hàng"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-brand-red text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white animate-[slideDown_0.2s_ease-out] max-h-[calc(100vh-80px)] overflow-y-auto">
          <div className="px-8 py-6 space-y-1">
            {navLinks.map((link) => (
              <div key={link.id}>
                <div className="flex items-center justify-between py-3 border-b border-zinc-50 group">
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`font-label text-base ${pathname.startsWith(link.href) ? "text-brand-red font-bold" : "text-zinc-700"} hover:text-brand-red transition-colors`}
                  >
                    {link.label}
                  </Link>
                  {link.hasDropdown && (
                    <button
                      onClick={() =>
                        setMobileDropdownOpen((prev) => ({
                          ...prev,
                          [link.id]: !prev[link.id],
                        }))
                      }
                      className="p-2 -mr-2 text-zinc-400 hover:text-black transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`transition-transform duration-300 ${mobileDropdownOpen[link.id] ? "rotate-180" : ""}`}
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  )}
                </div>
                {link.hasDropdown && mobileDropdownOpen[link.id] && (
                  <div className="pl-4 py-3 space-y-4 bg-zinc-50/50 my-2 animate-[slideDown_0.2s_ease-out] rounded-xl">
                    {(link.type === "MEGA_MENU" ||
                      link.type === "CATEGORIES") && (
                      <div className="space-y-2">
                        <Link
                          href="/shop"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block text-sm font-bold text-zinc-800 py-1"
                        >
                          Tất cả sản phẩm
                        </Link>
                        {categories.map((parent) => {
                          const children = (parent as any).children || [];
                          const isOpen = mobileDropdownOpen[`cat-${parent.id}`];
                          return (
                            <div key={parent.id} className="pt-2">
                              <div className="flex items-center justify-between">
                                <Link
                                  href={`/shop?category=${parent.slug}`}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="block text-sm font-bold text-zinc-700 py-1 capitalize flex-1"
                                >
                                  {parent.name}
                                </Link>
                                {children.length > 0 && (
                                  <button
                                    className="p-2 -mr-2 text-zinc-400"
                                    onClick={() =>
                                      setMobileDropdownOpen((prev) => ({
                                        ...prev,
                                        [`cat-${parent.id}`]:
                                          !prev[`cat-${parent.id}`],
                                      }))
                                    }
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                                    >
                                      <path d="m6 9 6 6 6-6" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              {children.length > 0 && isOpen && (
                                <div className="pl-3 mt-1 space-y-1 border-l-2 border-zinc-200 animate-[slideDown_0.2s_ease-out]">
                                  {children.map((child: any) => (
                                    <Link
                                      key={child.id}
                                      href={`/shop?category=${child.slug}`}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="block text-sm text-zinc-500 py-1.5 hover:text-brand-red capitalize"
                                    >
                                      {child.name}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {(link.type === "MEGA_MENU" || link.type === "BRANDS") && (
                      <div
                        className={`pt-4 ${link.type === "MEGA_MENU" ? "border-t border-zinc-200 mt-2" : ""}`}
                      >
                        <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">
                          Thương hiệu nổi bật
                        </div>
                        <div className="space-y-1">
                          {brands.slice(0, 8).map((brand) => (
                            <Link
                              key={brand.id}
                              href={`/shop?brand=${brand.slug}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block text-sm font-medium text-zinc-700 py-1.5 hover:text-brand-red uppercase"
                            >
                              {brand.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div className="mt-6 pt-4">
              <Link
                href="/sell"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full bg-brand-red text-white text-center py-4 font-black text-sm tracking-widest uppercase hover:bg-red-700 transition-colors"
              >
                Dọn tủ cùng {siteTexts["brand.shop_name"] || "THRIFT☆"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
