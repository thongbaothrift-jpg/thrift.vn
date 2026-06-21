"use client";

import { memo, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/api/types";
import { convertDriveLink, formatPrice } from "@/lib/utils";
import { useWishlist } from "@/lib/wishlist-context";

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  showQuickView?: boolean;
  showWishlist?: boolean;
  index?: number;
  priority?: boolean;
}

function ProductCardComponent({ 
  product, 
  onQuickView, 
  showQuickView = true, 
  showWishlist = true,
  index = 0,
  priority = false
}: ProductCardProps) {
  const { isInWishlist, toggleItem } = useWishlist();
  const [imageLoaded, setImageLoaded] = useState(false);

  const inWishlist = isInWishlist(product.id);

  const imageUrl = useMemo(
    () => convertDriveLink(product.images?.[0]) || "/placeholder-product.jpg",
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product.images?.[0]]
  );

  const isSoldOut = useMemo(() => {
    if (!product) return false;
    if (product.status === 'SOLD_OUT') return true;

    const sizes = product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : [];

    if (sizes.length > 0) {
      let totalAvailable = 0;
      const stockPerSize = (product.stockPerSize as Record<string, number>) || {};
      
      for (const size of sizes) {
        totalAvailable += Math.max(0, stockPerSize[size] ?? product.stock ?? 0);
      }
      return totalAvailable <= 0;
    } else {
      return (product.stock || 0) <= 0;
    }
  }, [product]);

  const discountPercent = useMemo(
    () => product.oldPrice
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product.oldPrice, product.price]
  );

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product.id);
  };

  const sizeDisplay = useMemo(() => {
    if (!product.sizes || product.sizes.length === 0) return null;
    return `Size ${product.sizes.join(", ")}`;
  }, [product.sizes]);

  return (
    <div className="group">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative overflow-hidden bg-zinc-100 mb-4">
          {/* Image container with zoom */}
          <div className="aspect-square overflow-hidden relative">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 25vw, 400px"
              className={`object-cover transition-all duration-500 ${
                imageLoaded
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-[1.02]"
              } ${isSoldOut ? 'grayscale-[0.4] opacity-70' : ''}`}
              onLoad={() => setImageLoaded(true)}
              loading={priority ? "eager" : "lazy"}
              priority={priority}
            />
            
            {/* Skeleton Placeholder */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-zinc-200 animate-pulse flex items-center justify-center">
                <svg className="w-8 h-8 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Sold Out Badge Overlay */}
            {isSoldOut && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                <div className="bg-white text-black px-4 py-1.5 font-black text-sm tracking-tighter border-2 border-black rotate-[-10deg] shadow-2xl">
                  SOLD OUT
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {(product.tags?.length > 0 || discountPercent > 0) && (
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {product.tags?.map((tag, idx) => (
                <span key={idx} className="inline-block bg-black text-white text-[10px] font-bold px-2 py-1 tracking-wider uppercase">{tag}</span>
              ))}
              {discountPercent > 0 && (
                <span className="inline-block bg-brand-red text-white text-[10px] font-bold px-2 py-1 tracking-wider">-{discountPercent}%</span>
              )}
            </div>
          )}
          
          {/* Wishlist Heart Button */}
          {showWishlist && (
            <button
              onClick={handleToggleWishlist}
              className={`absolute top-3 right-3 w-9 h-9 bg-transparent flex items-center justify-center transition-transform duration-150 active:scale-90 ${
                inWishlist
                  ? "text-brand-red"
                  : "text-zinc-400 hover:text-brand-red"
              }`}
              aria-label={inWishlist ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={inWishlist ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            </button>
          )}

          {/* Action buttons */}
          {showQuickView && onQuickView && (
            <div className="absolute bottom-0 left-0 w-full translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out">
              <button 
                onClick={handleQuickView}
                className="w-full py-3 font-medium text-xs tracking-wider uppercase btn-transition bg-black/90 backdrop-blur-sm text-white hover:bg-brand-red"
              >
                Xem nhanh
              </button>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className={`space-y-1 ${isSoldOut ? 'opacity-40' : ''}`}>
          {sizeDisplay && (
            <span className="text-[10px] text-zinc-400 tracking-wider uppercase">
              {sizeDisplay}
            </span>
          )}
          <h3 className="text-sm font-medium text-zinc-900 leading-tight line-clamp-2 group-hover:text-brand-red btn-transition">
            {product.name}
          </h3>

          {!isSoldOut && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-brand-red">
                {formatPrice(product.price)}
              </span>
              {product.oldPrice && (
                <span className="text-xs text-zinc-400 line-through">{formatPrice(product.oldPrice)}</span>
              )}
            </div>
          )}

          {isSoldOut && (
            <div className="pt-1 text-[10px] font-bold text-brand-red uppercase tracking-wider">
              ĐÃ BÁN — HẾT HÀNG
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

export const ProductCard = memo(ProductCardComponent);
