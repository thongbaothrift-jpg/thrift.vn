"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { QuickViewModal } from "@/components/QuickViewModal";
import { getProducts, getSizes, type ProductsResponse } from "@/lib/api";
import type { Product, Brand, ProductFilter, Category } from "@/lib/api/types";

export type SortOption = "newest" | "price-low" | "price-high" | "popular";

const PAGE_SIZE = 20;

interface ShopContentProps {
  initialData: ProductsResponse | null;
  initialBrands: Brand[];
  initialCategories: Category[];
  initialFilters: {
    category: string;
    brand: string;
    sort: SortOption;
    minPrice: number;
    maxPrice: number;
    hotDeals: boolean;
    sizes?: string[];
    hideOutOfStock?: boolean;
  };
}

export function ShopContent({
  initialData,
  initialBrands,
  initialCategories,
  initialFilters,
}: ShopContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter state - initialized with SSR data
  const [hotDealsOnly, setHotDealsOnly] = useState(initialFilters.hotDeals);
  const [selectedCategory, setSelectedCategory] = useState(
    initialFilters.category,
  );
  const [selectedBrand, setSelectedBrand] = useState(initialFilters.brand);
  const [sortBy, setSortBy] = useState<SortOption>(initialFilters.sort);
  const [priceMin, setPriceMin] = useState(initialFilters.minPrice);
  const [priceMax, setPriceMax] = useState<number>(initialFilters.maxPrice);
  const [debouncedPriceMin, setDebouncedPriceMin] = useState<number>(initialFilters.minPrice);
  const [debouncedPriceMax, setDebouncedPriceMax] = useState<number>(initialFilters.maxPrice);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    initialFilters.sizes || [],
  );
  const [hideOutOfStock, setHideOutOfStock] = useState(
    initialFilters.hideOutOfStock ?? false,
  );

  const [brands] = useState<Brand[]>(initialBrands);
  const [categories] = useState<Category[]>(initialCategories);

  // Products state
  const [data, setData] = useState<ProductsResponse | null>(initialData);
  const [products, setProducts] = useState<Product[]>(
    initialData?.products || [],
  );
  const [hasMore, setHasMore] = useState(
    (initialData?.page || 1) < (initialData?.pages || 1),
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // QuickView
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null,
  );
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Mobile dropdown state
  const [mobileOpenCatId, setMobileOpenCatId] = useState<string | null>(null);
  const categoryContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryContainerRef.current &&
        !categoryContainerRef.current.contains(event.target as Node)
      ) {
        setMobileOpenCatId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sizes from API
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);

  // Debounce ref for URL updates
  const urlDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch sizes on mount
  useEffect(() => {
    getSizes()
      .then((sizes) => {
        if (sizes.length > 0) {
          setAvailableSizes(sizes);
        }
      })
      .catch(() => {
        setAvailableSizes(["XS", "S", "M", "L", "XL", "XXL"]);
      });
  }, []);

  // Track prev filter snapshot to detect real changes
  const prevFilterRef = useRef<string>(
    JSON.stringify({
      hotDealsOnly: initialFilters.hotDeals,
      selectedCategory: initialFilters.category,
      selectedBrand: initialFilters.brand,
      sortBy: initialFilters.sort,
      priceMin: initialFilters.minPrice,
      priceMax: initialFilters.maxPrice,
      selectedSizes: initialFilters.sizes || [],
      hideOutOfStock: initialFilters.hideOutOfStock ?? false,
    }),
  );

  // Debounce price changes for fetching
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPriceMin(priceMin);
      setDebouncedPriceMax(priceMax);
    }, 500);
    return () => clearTimeout(handler);
  }, [priceMin, priceMax]);

  // Sync when navigating back/forward
  useEffect(() => {
    const filterStr = JSON.stringify({
      hotDealsOnly,
      selectedCategory,
      selectedBrand,
      sortBy,
      priceMin: debouncedPriceMin,
      priceMax: debouncedPriceMax,
      selectedSizes,
      hideOutOfStock,
    });
    if (filterStr === prevFilterRef.current) return;

    const newFilter = {
      hotDealsOnly,
      selectedCategory,
      selectedBrand,
      sortBy,
      priceMin: debouncedPriceMin,
      priceMax: debouncedPriceMax,
      selectedSizes,
      hideOutOfStock,
    };
    prevFilterRef.current = filterStr;
    fetchProducts(newFilter, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hotDealsOnly,
    selectedCategory,
    selectedBrand,
    sortBy,
    debouncedPriceMin,
    debouncedPriceMax,
    selectedSizes,
    hideOutOfStock,
  ]);

  // Sync state when URL search params change externally (e.g. clicking header links)
  useEffect(() => {
    const urlCategory = searchParams.get("category") || "";
    const urlBrand = searchParams.get("brand") || "";
    
    let changed = false;
    if (selectedCategory !== urlCategory) {
      setSelectedCategory(urlCategory);
      changed = true;
    }
    if (selectedBrand !== urlBrand) {
      setSelectedBrand(urlBrand);
      changed = true;
    }
    
    if (changed) {
      setMobileOpenCatId(null);
      setLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Fetch products from API
  const fetchProducts = useCallback(
    async (
      filter: {
        hotDealsOnly: boolean;
        selectedCategory: string;
        selectedBrand: string;
        sortBy: SortOption;
        priceMin: number;
        priceMax: number;
        selectedSizes: string[];
        hideOutOfStock: boolean;
      },
      resetPage = false,
    ) => {
      setLoading(true);
      try {
        const filterParams: ProductFilter & { page?: number; limit?: number } =
          {
            hotDealsOnly: filter.hotDealsOnly,
            sortBy: filter.sortBy,
            categories: filter.selectedCategory
              ? [filter.selectedCategory]
              : undefined,
            brands: filter.selectedBrand ? [filter.selectedBrand] : undefined,
            priceRange:
              filter.priceMin > 0 || filter.priceMax > 0
                ? [filter.priceMin, filter.priceMax]
                : undefined,
            sizes:
              filter.selectedSizes.length > 0
                ? filter.selectedSizes
                : undefined,
            hideOutOfStock: filter.hideOutOfStock || undefined,
            page: resetPage ? 1 : currentPage,
            limit: PAGE_SIZE,
          };
        const result = await getProducts(filterParams);
        setData(result);
        setProducts(result.products || []);
        if (resetPage) setCurrentPage(1);
        setHasMore(result.page < result.pages);
      } catch {
        setData(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [currentPage],
  );

  // Build URL params
  const buildUrlParams = useCallback(
    (overrides?: {
      hotDeals?: boolean;
      category?: string;
      brand?: string;
      sort?: SortOption;
      minPrice?: number;
      maxPrice?: number;
      sizes?: string[];
      hideOutOfStock?: boolean;
    }) => {
      const params = new URLSearchParams();
      const hot =
        overrides?.hotDeals !== undefined ? overrides.hotDeals : hotDealsOnly;
      const cat =
        overrides?.category !== undefined
          ? overrides.category
          : selectedCategory;
      const brd =
        overrides?.brand !== undefined ? overrides.brand : selectedBrand;
      const sort = overrides?.sort !== undefined ? overrides.sort : sortBy;
      const min =
        overrides?.minPrice !== undefined ? overrides.minPrice : priceMin;
      const max =
        overrides?.maxPrice !== undefined ? overrides.maxPrice : priceMax;
      const sizes =
        overrides?.sizes !== undefined ? overrides.sizes : selectedSizes;
      const hide =
        overrides?.hideOutOfStock !== undefined
          ? overrides.hideOutOfStock
          : hideOutOfStock;

      if (hot) params.set("filter", "hot-deals");
      if (cat) params.set("category", cat);
      if (brd) params.set("brand", brd);
      if (sort !== "newest") params.set("sort", sort);
      if (min > 0) params.set("minPrice", String(min));
      if (max > 0) params.set("maxPrice", String(max));
      if (sizes.length > 0) params.set("sizes", sizes.join(","));
      if (hide) params.set("hideOutOfStock", "1");
      return params.toString();
    },
    [
      hotDealsOnly,
      selectedCategory,
      selectedBrand,
      sortBy,
      priceMin,
      priceMax,
      selectedSizes,
      hideOutOfStock,
    ],
  );

  // Sync URL with debounce
  const syncUrl = useCallback(
    (overrides?: {
      hotDeals?: boolean;
      category?: string;
      brand?: string;
      sort?: SortOption;
      minPrice?: number;
      maxPrice?: number;
      sizes?: string[];
      hideOutOfStock?: boolean;
    }) => {
      if (urlDebounceRef.current) clearTimeout(urlDebounceRef.current);
      urlDebounceRef.current = setTimeout(() => {
        const qs = buildUrlParams(overrides);
        router.replace(`/shop${qs ? `?${qs}` : ""}`, { scroll: false });
      }, 300);
    },
    [buildUrlParams, router],
  );

  // Filter handlers - optimistic UI, update immediately
  const handleCategoryChange = (cat: string) => {
    if (cat === selectedCategory) return;
    const newCat = cat || "";
    setSelectedCategory(newCat);
    syncUrl({ category: newCat });
    setLoading(true);
  };

  const handleBrandChange = (brd: string) => {
    setSelectedBrand(brd);
    syncUrl({ brand: brd });
    setLoading(true);
  };

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    syncUrl({ sort });
    setLoading(true);
  };

  const handleHotDealsToggle = () => {
    const next = !hotDealsOnly;
    setHotDealsOnly(next);
    syncUrl({ hotDeals: next });
    setLoading(true);
  };

  const handlePriceChange = (min: number, max: number) => {
    setPriceMin(min);
    setPriceMax(max);
    if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
    priceDebounceRef.current = setTimeout(() => {
      syncUrl({ minPrice: min, maxPrice: max });
      // We don't clear products here because the useEffect handles the debounced fetch
      // which will clear products when it fires.
    }, 500);
  };

  const handleSizeToggle = (size: string) => {
    const next = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    setSelectedSizes(next);
    syncUrl({ sizes: next });
    setLoading(true);
  };

  const handleHideOutOfStockToggle = () => {
    const next = !hideOutOfStock;
    setHideOutOfStock(next);
    syncUrl({ hideOutOfStock: next });
    setLoading(true);
  };

  const clearFilters = () => {
    setHotDealsOnly(false);
    setSelectedCategory("");
    setSelectedBrand("");
    setSortBy("newest");
    setPriceMin(0);
    setPriceMax(0);
    setDebouncedPriceMin(0);
    setDebouncedPriceMax(0);
    setSelectedSizes([]);
    setHideOutOfStock(false);
    router.replace("/shop", { scroll: false });
    setLoading(true);
  };

  // Load More
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const filterParams: ProductFilter & { page?: number; limit?: number } = {
        hotDealsOnly,
        sortBy,
        categories: selectedCategory ? [selectedCategory] : undefined,
        brands: selectedBrand ? [selectedBrand] : undefined,
        priceRange:
          priceMin > 0 || priceMax > 0 ? [priceMin, priceMax] : undefined,
        sizes: selectedSizes.length > 0 ? selectedSizes : undefined,
        hideOutOfStock: hideOutOfStock || undefined,
        page: nextPage,
        limit: PAGE_SIZE,
      };
      const result = await getProducts(filterParams);
      if (result.products && result.products.length > 0) {
        setProducts((prev) => [...prev, ...result.products]);
        setCurrentPage(nextPage);
        setHasMore(result.page < result.pages);
      } else {
        setHasMore(false);
      }
    } catch {
      // silent fail
    } finally {
      setLoadingMore(false);
    }
  }, [
    hotDealsOnly,
    sortBy,
    selectedCategory,
    selectedBrand,
    priceMin,
    priceMax,
    selectedSizes,
    hideOutOfStock,
    currentPage,
    loadingMore,
    hasMore,
    loading,
  ]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );
    const target = document.querySelector("#shop-infinite-trigger");
    if (target) observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMore]);

  const hasFilters =
    hotDealsOnly ||
    selectedCategory ||
    selectedBrand ||
    priceMin > 0 ||
    priceMax > 0 ||
    selectedSizes.length > 0 ||
    hideOutOfStock;

  return (
    <>
      <section className="mb-6 md:mb-12">
        <h1 className="text-5xl md:text-7xl font-black uppercase mb-4 md:mb-6 tracking-tighter">
          Shop
        </h1>
        <p className="text-sm md:text-base text-zinc-500 max-w-2xl leading-relaxed">
          Khám phá thời trang cao cấp đã qua sử dụng. Những món đồ được tuyển
          chọn kỹ lưỡng và xác thực từ các nhà thiết kế danh tiếng nhất thế
          giới.
        </p>
      </section>

      {/* Filter Bar */}
      <div className="mb-6 md:mb-12">
        <div className="flex flex-col gap-2 py-2 md:py-4 border-y border-zinc-200 mb-3 md:mb-4">
          <div className="relative" ref={categoryContainerRef}>
            <div className="flex sm:flex-wrap items-center gap-2 overflow-x-auto sm:overflow-x-visible scrollbar-hide pb-2 sm:pb-0">
            <button
              onClick={() => handleCategoryChange("")}
              className={`flex-shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium border transition-all duration-200 ${
                selectedCategory === ""
                  ? "bg-black border-black text-white"
                  : "border-zinc-300 hover:border-black text-zinc-600 hover:text-black bg-white"
              }`}
            >
              Tất cả
            </button>
            {categories.map((cat) => {
              const children = (cat as any).children || [];
              const isSelected =
                selectedCategory === cat.slug ||
                children.some((c: any) => c.slug === selectedCategory);
              return (
                <div key={cat.id} className="relative group">
                  <button
                    onClick={(e) => {
                      if (children.length > 0) {
                        e.preventDefault();
                        setMobileOpenCatId((prev) => (prev === cat.id ? null : cat.id));
                        return;
                      }
                      handleCategoryChange(cat.slug);
                    }}
                    className={`flex-shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium border transition-all duration-200 flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-black border-black text-white"
                        : "border-zinc-300 hover:border-black text-zinc-600 hover:text-black bg-white"
                    }`}
                  >
                    {cat.name}
                    {children.length > 0 && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`opacity-70 transition-transform ${
                          mobileOpenCatId === cat.id ? "rotate-180" : ""
                        }`}
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    )}
                  </button>

                  {children.length > 0 && mobileOpenCatId === cat.id && (
                    <div
                      className="absolute top-full left-0 mt-1 flex-col bg-white border border-zinc-200 shadow-xl rounded-md overflow-hidden z-50 min-w-[160px] py-1 hidden sm:flex"
                    >
                      <button
                        onClick={() => {
                          setMobileOpenCatId(null);
                          handleCategoryChange(cat.slug);
                        }}
                        className={`text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors ${
                          selectedCategory === cat.slug
                            ? "font-bold text-brand-red"
                            : "text-zinc-600"
                        }`}
                      >
                        Tất cả {cat.name}
                      </button>
                      {children.map((child: any) => (
                        <button
                          key={child.id}
                          onClick={() => {
                            setMobileOpenCatId(null);
                            handleCategoryChange(child.slug);
                          }}
                          className={`text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors ${
                            selectedCategory === child.slug
                              ? "font-bold text-brand-red"
                              : "text-zinc-600"
                          }`}
                        >
                          {child.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            </div>
            {/* Mobile subcategories rendering outside overflow container */}
            {mobileOpenCatId && (
              <div className="sm:hidden absolute top-full left-0 right-0 mt-1 flex flex-col bg-white shadow-xl border border-zinc-200 rounded-lg animate-[slideDown_0.2s_ease-out] overflow-hidden z-50">
              {(() => {
                const openCat = categories.find(c => c.id === mobileOpenCatId);
                if (!openCat) return null;
                const children = (openCat as any).children || [];
                return (
                  <>
                    <button
                      onClick={() => {
                        setMobileOpenCatId(null);
                        handleCategoryChange(openCat.slug);
                      }}
                      className={`text-left px-4 py-3 text-sm transition-colors border-b border-zinc-100 last:border-0 ${
                        selectedCategory === openCat.slug
                          ? "font-bold text-brand-red bg-white"
                          : "text-zinc-600 hover:bg-white"
                      }`}
                    >
                      Tất cả {openCat.name}
                    </button>
                    {children.map((child: any) => (
                      <button
                        key={child.id}
                        onClick={() => {
                          setMobileOpenCatId(null);
                          handleCategoryChange(child.slug);
                        }}
                        className={`text-left px-4 py-3 text-sm transition-colors border-b border-zinc-100 last:border-0 ${
                          selectedCategory === child.slug
                            ? "font-bold text-brand-red bg-white"
                            : "text-zinc-600 hover:bg-white"
                        }`}
                      >
                        {child.name}
                      </button>
                    ))}
                  </>
                );
              })()}
            </div>
          )}
          </div>
        </div>

        <div className="flex sm:flex-wrap items-center gap-3 sm:gap-4 overflow-x-auto sm:overflow-x-visible scrollbar-hide pb-2 sm:pb-0">
          <button
            onClick={handleHideOutOfStockToggle}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border text-sm font-medium transition-colors ${
              hideOutOfStock
                ? "border-black bg-black text-white"
                : "border-zinc-300 hover:border-black text-zinc-600 bg-white"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            Ẩn hết hàng
          </button>

          <div className="relative flex-shrink-0">
            <select
              value={selectedBrand}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="appearance-none bg-white border border-zinc-300 px-4 py-2.5 pr-9 text-sm cursor-pointer hover:border-black min-w-[140px]"
            >
              <option value="">Thương hiệu</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.name}>
                  {brand.name}
                </option>
              ))}
            </select>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          <div className="relative flex-shrink-0">
            <select
              value={selectedSizes.length === 1 ? selectedSizes[0] : ""}
              onChange={(e) =>
                e.target.value && handleSizeToggle(e.target.value)
              }
              className="appearance-none bg-white border border-zinc-300 px-4 py-2.5 pr-9 text-sm cursor-pointer hover:border-black min-w-[100px]"
            >
              <option value="">Tất cả Size</option>
              {(availableSizes.length > 0
                ? availableSizes
                : ["XS", "S", "M", "L", "XL", "XXL"]
              ).map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          <button
            onClick={handleHotDealsToggle}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border text-sm font-medium transition-all duration-200 ${
              hotDealsOnly
                ? "bg-brand-red border-brand-red text-white"
                : "border-zinc-300 hover:border-black text-zinc-600 hover:text-black"
            }`}
          >
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
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153 0.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
            Khuyến mãi
          </button>

          <div className="flex flex-shrink-0 items-center gap-2">
            <input
              type="number"
              value={priceMin || ""}
              onChange={(e) =>
                handlePriceChange(parseInt(e.target.value) || 0, priceMax)
              }
              placeholder="Từ"
              className="w-24 border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
            <span className="text-zinc-400">–</span>
            <input
              type="number"
              value={priceMax || ""}
              onChange={(e) =>
                handlePriceChange(priceMin, parseInt(e.target.value) || 0)
              }
              placeholder="Đến"
              className="w-24 border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
          </div>

          <div className="relative flex-shrink-0">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="appearance-none bg-white border border-zinc-300 px-4 py-2.5 pr-9 text-sm cursor-pointer hover:border-black"
            >
              <option value="newest">Mới nhất</option>
              <option value="price-low">Giá: Thấp → Cao</option>
              <option value="price-high">Giá: Cao → Thấp</option>
              <option value="popular">Phổ biến</option>
            </select>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex-shrink-0 text-sm text-zinc-400 hover:text-brand-red transition-colors ml-2"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      <div>
        <div className="mb-6 text-sm text-zinc-500">
          {loading && products.length === 0
            ? "Đang tải..."
            : `${data?.total ?? 0} sản phẩm`}
          {hasFilters && " (đã lọc)"}
        </div>

        {loading && products.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-16">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="product-card-animated"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="aspect-[3/4] bg-zinc-200 animate-pulse mb-4" />
                <div className="space-y-3">
                  <div className="h-2 bg-zinc-200 animate-pulse w-12" />
                  <div className="h-3 bg-zinc-200 animate-pulse w-3/4" />
                  <div className="h-3 bg-zinc-200 animate-pulse w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="relative">
            <div
              id="products-grid"
              className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 transition-opacity duration-300 ${
                loading && !loadingMore ? "opacity-30 pointer-events-none" : "opacity-100"
              }`}
            >
              {products.map((product, idx) => (
                <div
                  key={product.id}
                  className="product-card-animated"
                  style={{ animationDelay: `${Math.min(idx, 15) * 40}ms` }}
                >
                  <ProductCard
                    product={product}
                    onQuickView={(p) => {
                      setQuickViewProduct(p);
                      setIsQuickViewOpen(true);
                    }}
                    index={idx % 8}
                    priority={idx < 4}
                  />
                </div>
              ))}

              {loadingMore &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="product-card-animated"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="aspect-[3/4] bg-zinc-200 animate-pulse mb-4" />
                    <div className="space-y-2">
                      <div className="h-3 bg-zinc-200 animate-pulse w-16" />
                      <div className="h-4 bg-zinc-200 animate-pulse w-3/4" />
                    </div>
                  </div>
                ))}
            </div>

            {loading && !loadingMore && (
              <div className="absolute inset-0 flex items-start justify-center z-10 pt-[20vh]">
                <div className="w-10 h-10 border-4 border-zinc-200 border-t-black rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-zinc-500 mb-4">Không tìm thấy sản phẩm</p>
            <button onClick={clearFilters} className="btn-ghost">
              Xóa bộ lọc
            </button>
          </div>
        )}

        <div
          id="shop-infinite-trigger"
          className="h-40 flex items-center justify-center"
        >
          {products.length > 0 &&
            hasMore &&
            (loadingMore ? (
              <div className="flex flex-col items-center gap-3 text-zinc-400">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-black rounded-full animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Đang tải thêm sản phẩm...
                </span>
              </div>
            ) : (
              <div className="w-1 h-1 bg-zinc-200 rounded-full" />
            ))}
          {products.length > 0 && !hasMore && (
            <div className="text-center py-10 opacity-50">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Bạn đã xem hết {products.length} sản phẩm
              </p>
            </div>
          )}
        </div>
      </div>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => {
          setIsQuickViewOpen(false);
          setQuickViewProduct(null);
        }}
      />
    </>
  );
}
