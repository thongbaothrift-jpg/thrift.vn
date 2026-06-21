"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { QuickViewModal } from "@/components/QuickViewModal";
import { searchProducts, getProducts } from "@/lib/api";
import type { Product } from "@/lib/api/types";

type SortOption = "relevance" | "price-low" | "price-high" | "newest";

const PAGE_SIZE = 12;

interface SearchContentProps {
  initialProducts: Product[];
  initialTotal: number;
  initialQuery: string;
}

export function SearchContent({ 
  initialProducts, 
  initialTotal, 
  initialQuery 
}: SearchContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialProducts.length < initialTotal);
  const [totalResults, setTotalResults] = useState(initialTotal);
  
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Sync with Server Data
  useEffect(() => {
    setProducts(initialProducts);
    setTotalResults(initialTotal);
    setHasMore(initialProducts.length < initialTotal);
    setSearchInput(initialQuery);
    setCurrentPage(1);
  }, [initialProducts, initialTotal, initialQuery]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading || isPending) return;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      let result: Product[] = [];
      
      if (initialQuery) {
        const allResults = await searchProducts(initialQuery);
        const start = (nextPage - 1) * PAGE_SIZE;
        result = allResults.slice(start, start + PAGE_SIZE);
      } else {
        const res = await getProducts({ page: nextPage, limit: PAGE_SIZE });
        result = res.products || [];
      }
      
      if (result.length > 0) {
        setProducts(prev => [...prev, ...result]);
        setCurrentPage(nextPage);
        setHasMore(products.length + result.length < totalResults);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Load more failed", error);
    } finally {
      setLoadingMore(false);
    }
  }, [initialQuery, currentPage, hasMore, loading, loadingMore, isPending, products.length, totalResults]);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading && !isPending) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const target = document.querySelector("#search-infinite-trigger");
    if (target) observer.observe(target);

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, isPending, loadMore]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    });
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    // Ideally sort should be via URL too for SSR, but for now we can do client-side if it's small
    // or better: router.push with sort param
  };

  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  return (
    <>
      <div className="mb-12">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-6">
          {initialQuery ? `Kết quả tìm kiếm "${initialQuery}"` : "Tìm kiếm"}
        </h1>
        
        <form onSubmit={handleSearchSubmit} className="max-w-2xl">
          <div className="flex group">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="flex-1 border border-zinc-300 px-6 py-4 text-lg focus:border-black focus:outline-none transition-all"
            />
            <button 
              type="submit"
              disabled={isPending}
              className={`bg-black text-white px-8 py-4 font-semibold hover:bg-brand-red transition-all flex items-center gap-2 ${isPending ? 'opacity-50' : ''}`}
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
              )}
              <span>Tìm kiếm</span>
            </button>
          </div>
        </form>
      </div>

      {initialQuery && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-zinc-200">
          <p className="text-zinc-500">
            Tìm thấy <span className="font-semibold text-black">{totalResults}</span> kết quả
          </p>
          
          <div className="flex items-center gap-3">
            <span className="font-label text-zinc-500">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="border border-zinc-300 px-4 py-2 text-sm focus:border-black focus:outline-none bg-white cursor-pointer"
            >
              <option value="relevance">Liên quan</option>
              <option value="newest">Mới nhất</option>
              <option value="price-low">Giá: Thấp đến cao</option>
              <option value="price-high">Giá: Cao đến thấp</option>
            </select>
          </div>
        </div>
      )}

      <div className={`transition-opacity duration-300 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
        {initialQuery ? (
          products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
              {products.map((p, idx) => (
                <div
                  key={`${p.id}-${idx}`}
                  className="product-card-animated"
                  style={{ animationDelay: `${Math.min(idx, 15) * 40}ms` }}
                >
                  <ProductCard
                    product={p}
                    onQuickView={handleQuickView}
                    index={idx % 8}
                  />
                </div>
              ))}
              
              {loadingMore && (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={`skeleton-${i}`} className="product-card-animated" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="aspect-[3/4] bg-zinc-200 animate-pulse mb-5" />
                    <div className="space-y-2">
                      <div className="h-3 bg-zinc-200 animate-pulse w-16" />
                      <div className="h-4 bg-zinc-200 animate-pulse w-3/4" />
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : !isPending && (
            <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-zinc-300 mx-auto mb-6">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">Không tìm thấy kết quả</h2>
              <p className="text-zinc-500 mb-8 max-w-md mx-auto">
                Rất tiếc, chúng tôi không tìm thấy sản phẩm nào phù hợp với từ khóa "{initialQuery}". Hãy thử từ khóa khác hoặc xem các gợi ý bên dưới.
              </p>
              <Link href="/shop" className="btn-primary inline-block">
                Xem tất cả sản phẩm
              </Link>
            </div>
          )
        ) : (
          <div className="py-20">
            <h2 className="text-xl font-bold mb-8 uppercase tracking-widest border-l-4 border-black pl-4">Tìm kiếm phổ biến</h2>
            <div className="flex flex-wrap gap-3 mb-16">
              {["Hermès Birkin", "Túi Chanel", "Đồng hồ Rolex", "Gucci", "Supreme", "Balenciaga"].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchInput(term);
                    startTransition(() => {
                      router.push(`/search?q=${encodeURIComponent(term)}`);
                    });
                  }}
                  className="px-6 py-3 border border-zinc-300 text-sm hover:border-black hover:bg-black hover:text-white transition-all uppercase font-medium tracking-wider"
                >
                  {term}
                </button>
              ))}
            </div>

            <h2 className="text-xl font-bold mb-8 uppercase tracking-widest border-l-4 border-black pl-4">Gợi ý cho bạn</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {products.slice(0, 4).map((p, idx) => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  onQuickView={handleQuickView}
                  index={idx}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <QuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => {
          setIsQuickViewOpen(false);
          setQuickViewProduct(null);
        }}
      />

      <div id="search-infinite-trigger" className="h-40 flex items-center justify-center">
        {products.length > 0 && hasMore && (
          loadingMore ? (
            <div className="flex flex-col items-center gap-3 text-zinc-400">
              <div className="w-6 h-6 border-2 border-zinc-200 border-t-black rounded-full animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Đang tải thêm...</span>
            </div>
          ) : (
            <div className="w-1 h-1 bg-zinc-200 rounded-full" />
          )
        )}
        {products.length > 0 && !hasMore && initialQuery && (
          <div className="text-center py-10 opacity-50">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Đã hiển thị tất cả kết quả</p>
          </div>
        )}
      </div>
    </>
  );
}
