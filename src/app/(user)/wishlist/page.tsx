"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { QuickViewModal } from "@/components/QuickViewModal";
import { getProducts } from "@/lib/api";
import type { Product } from "@/lib/api/types";
import { useWishlist } from "@/lib/wishlist-context";

export default function WishlistPage() {
  const { items, toggleItem } = useWishlist();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getProducts()
      .then((res) => setProducts(res.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const wishlistIds = items.map((i) => i.id);
  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));

  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  if (!loading && items.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-8 py-20">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-zinc-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-zinc-300">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-4">Danh sách yêu thích trống</h1>
          <p className="text-zinc-500 mb-8">Lưu sản phẩm bạn yêu thích bằng cách nhấn biểu tượng trái tim trên sản phẩm.</p>
          <Link href="/shop" className="btn-primary inline-block px-10">
            Bắt đầu mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-8 py-12">
      <div className="flex justify-between items-end mb-16 border-b border-zinc-100 pb-8">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">Yêu thích</h1>
          <p className="text-zinc-400 mt-3 font-medium uppercase tracking-widest text-[10px]">
            {wishlistIds.length} {wishlistIds.length === 1 ? "Sản phẩm" : "Sản phẩm"} đã lưu
          </p>
        </div>
        <Link href="/shop" className="text-sm font-bold border-b-2 border-black pb-1 hover:text-brand-red hover:border-brand-red transition-all uppercase tracking-widest">
          Tiếp tục mua sắm
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-zinc-100 mb-4" />
              <div className="h-4 bg-zinc-100 w-1/2 mb-2" />
              <div className="h-4 bg-zinc-100 w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {wishlistProducts.map((product, idx) => (
            <div key={product.id} className="relative group">
              <ProductCard 
                product={product} 
                onQuickView={handleQuickView}
                showWishlist={false} 
                index={idx}
              />
              <button
                onClick={() => toggleItem(product.id)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white hover:scale-110 transition-all z-10 shadow-sm"
                aria-label="Xóa khỏi yêu thích"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-brand-red">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => {
          setIsQuickViewOpen(false);
          setQuickViewProduct(null);
        }}
      />
    </div>
  );
}
