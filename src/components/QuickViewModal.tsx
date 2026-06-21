"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { convertDriveLink, formatPrice } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/api/types";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { checkProductsStock } from "@/lib/api";

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function QuickViewModalContent({ product, onClose }: { product: Product; onClose: () => void }) {
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  
  const productSizes = product.sizes && product.sizes.length > 0 ? product.sizes : DEFAULT_SIZES;
  const [selectedSize, setSelectedSize] = useState(productSizes[0]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [isCheckingStock, setIsCheckingStock] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleAddToCart = async () => {
    setIsCheckingStock(true);
    setStockError(null);
    try {
      const result = await checkProductsStock([{
        productId: product.id,
        quantity: 1,
        size: selectedSize,
      }]);

      if (!result.allAvailable) {
        const failed = result.results[0];
        if (failed?.reason === 'OUT_OF_STOCK') {
          setStockError("Sản phẩm này đã hết hàng.");
        } else if (failed?.reason === 'INSUFFICIENT_STOCK') {
          setStockError(`Size ${selectedSize} chỉ còn ${failed.availableQty} sản phẩm.`);
        } else {
          setStockError("Sản phẩm không khả dụng.");
        }
        setIsCheckingStock(false);
        return;
      }

      addItem(product, selectedSize);
      onClose();
    } catch {
      // On network error, allow adding anyway (backend will validate at checkout)
      addItem(product, selectedSize);
      onClose();
    } finally {
      setIsCheckingStock(false);
    }
  };

  // Helper to format authentic type display
  const formatAuthenticType = (type?: string) => {
    if (!type) return null;
    const t = type.toUpperCase();
    if (t === "AUTHENTIC") return "AUTHENTIC";
    if (t === "LIKE_AUTHENTIC") return "LIKE AUTHENTIC";
    if (t === "REP_UNBRANDED") return "REP";
    if (t === "REP_BRANDED") return "REP BRANDED";
    return type;
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Xem nhanh ${product.name}`}
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 animate-fade-in cursor-default"
        onClick={onClose}
      />

      {/* Modal - scrollable with max-height */}
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-scale-in shadow-2xl">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white flex items-center justify-center hover:bg-zinc-100 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>

        {/* Image */}
        <div className="md:w-1/2 aspect-[3/4] md:aspect-auto bg-zinc-100 relative flex-shrink-0">
          <Image
            src={convertDriveLink(product.images?.[0]) || "/placeholder-product.jpg"}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={`object-cover transition-all duration-500 ease-out ${
              imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
            onLoad={() => setImageLoaded(true)}
            priority
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-zinc-200 animate-pulse flex items-center justify-center">
              <svg className="w-10 h-10 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="md:w-1/2 p-8 overflow-y-auto max-h-[90vh]">
          <div className="mb-6">
            <span className="font-label text-zinc-400">{product.brand?.name}</span>
            <h2 className="text-2xl font-bold text-black mt-2">{product.name}</h2>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-2xl font-bold text-brand-red">{formatPrice(product.price)}</span>
            {product.oldPrice && (
              <span className="text-lg text-zinc-400 line-through">{formatPrice(product.oldPrice)}</span>
            )}
          </div>

          {/* Product Meta Info */}
          <div className="flex flex-wrap gap-2 mb-6">
            {product.sizes && product.sizes.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
                {product.sizes.length > 2
                  ? `${product.sizes[0]} - ${product.sizes[product.sizes.length - 1]}`
                  : product.sizes.join(", ")}
              </span>
            )}
            {product.authenticType && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${
                product.authenticType.toUpperCase() === "AUTHENTIC"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : product.authenticType.toUpperCase() === "LIKE_AUTHENTIC"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-zinc-100 text-zinc-600 border border-zinc-200"
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                </svg>
                {formatAuthenticType(product.authenticType)}
              </span>
            )}
            {product.conditionPercent !== undefined && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                Mới: {product.conditionPercent}%
              </span>
            )}
          </div>

          {/* Sizing Info */}
          {(product.sizingRong || product.sizingDai || product.sizingBung || product.sizingDayQuan || product.sizingOngQuan) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {product.sizingRong && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-full">
                  <span className="text-zinc-400">Chiều rộng:</span> {product.sizingRong}
                </span>
              )}
              {product.sizingDai && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-full">
                  <span className="text-zinc-400">Chiều dài:</span> {product.sizingDai}
                </span>
              )}
              {product.sizingBung && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-full">
                  <span className="text-zinc-400">Rộng Bụng:</span> {product.sizingBung}
                </span>
              )}
              {product.sizingDayQuan && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-full">
                  <span className="text-zinc-400">Dài Quần:</span> {product.sizingDayQuan}
                </span>
              )}
              {product.sizingOngQuan && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-full">
                  <span className="text-zinc-400">Ống quần:</span> {product.sizingOngQuan}
                </span>
              )}
            </div>
          )}

          {/* Size Selection */}
          <div className="mb-6">
            <h3 className="font-label text-zinc-700 mb-3">Chọn size</h3>
            <div className="flex flex-wrap gap-2">
              {productSizes.map((size) => {
                const stockPerSize = product.stockPerSize as Record<string, number> | null;
                
                const stock = stockPerSize?.[size] ?? product.stock ?? 0;
                const availableStock = stock;
                
                const outOfStock = availableStock <= 0;
                return (
                  <button
                    key={size}
                    onClick={() => !outOfStock && setSelectedSize(size)}
                    disabled={outOfStock}
                    className={`w-12 h-12 border text-sm font-medium transition-colors cursor-pointer ${
                      outOfStock
                        ? "border-zinc-200 text-zinc-300 cursor-not-allowed opacity-50"
                        : selectedSize === size
                        ? "border-brand-red bg-brand-red text-white"
                        : "border-zinc-300 hover:border-black"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mb-3">
            {stockError && (
              <div className="mb-2 text-xs text-brand-red font-medium">{stockError}</div>
            )}
            <div className="flex gap-3">
              {(() => {
                const stockPerSize = (product.stockPerSize as Record<string, number> | null) ?? {};
                
                const availableForSize = stockPerSize[selectedSize] ?? product.stock;

                const isOutOfStock = availableForSize <= 0 || product.status === "SOLD_OUT";
                
                return isOutOfStock ? (
                  <button
                    disabled
                    className="flex-1 bg-zinc-200 text-zinc-500 py-3 font-bold uppercase tracking-wider cursor-not-allowed text-sm"
                  >
                    Hết hàng
                  </button>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={isCheckingStock}
                    className="flex-1 btn-primary cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isCheckingStock ? "Đang kiểm tra..." : "Thêm vào giỏ"}
                  </button>
                );
              })()}
              <button 
                onClick={() => toggleItem(product.id)}
                className={`w-14 border flex items-center justify-center transition-colors cursor-pointer ${
                  isInWishlist(product.id)
                    ? "border-brand-red text-brand-red"
                    : "border-zinc-300 hover:border-black"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isInWishlist(product.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Authenticity badge */}
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>
            </svg>
            Cam kết 100% hàng chính hãng
          </div>

          <Link
            href={`/product/${product.slug}`}
            onClick={onClose}
            className="block text-center border border-zinc-300 text-zinc-700 px-6 py-3 font-label hover:border-black hover:text-black transition-colors"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !product) return null;

  if (!mounted) return null;

  return createPortal(
    <QuickViewModalContent product={product} onClose={onClose} />,
    document.body
  );
}
