"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { convertDriveLink } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, checkProductsStock, type StockCheckResult } from "@/lib/api";

export function CartSlideOver() {
  const { items, totalItems, totalPrice, isOpen, closeCart, removeItem, updateQuantity } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [stockError, setStockError] = useState<StockCheckResult[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      document.body.style.overflow = "";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleCheckout = async () => {
    setIsCheckingStock(true);
    setStockError(null);
    try {
      const stockItems = items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        size: item.size,
      }));
      const result = await checkProductsStock(stockItems);

      if (!result.allAvailable) {
        setStockError(result.results.filter(r => !r.available));
        setIsCheckingStock(false);
        return;
      }

      closeCart();
      router.push("/checkout");
    } catch {
      closeCart();
      router.push("/checkout");
    } finally {
      setIsCheckingStock(false);
    }
  };

  const handleRemoveUnavailable = (result: StockCheckResult) => {
    const item = items.find(i => i.product.id === result.productId);
    if (item) removeItem(item.product.id, item.size);
    setStockError(prev => prev?.filter(r => r.productId !== result.productId) ?? null);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div 
        className={`fixed inset-0 sm:inset-y-0 sm:left-auto sm:right-0 w-full sm:max-w-md bg-white z-[60] flex flex-col shadow-2xl transition-transform duration-300 ease-out ${isOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full pointer-events-none"}`}
        role="dialog"
        aria-label="Giỏ hàng"
      >
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6 border-b border-zinc-100 bg-white sticky top-0 z-10">
          <h2 className="text-base sm:text-lg font-black uppercase tracking-tighter">
            Giỏ hàng ({totalItems})
          </h2>
          <button 
            onClick={closeCart}
            className="p-3 -mr-2 hover:bg-zinc-50 rounded-full btn-transition cursor-pointer group"
            aria-label="Close cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:rotate-90 transition-transform duration-300">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-8 text-center">
              <div className="w-20 h-20 bg-zinc-100 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <p className="text-zinc-500 font-medium mb-6">Giỏ hàng trống</p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="btn-primary"
              >
                Bắt đầu mua sắm
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {items.map(({ product, quantity, size }) => (
                <li key={`${product.id}-${size}`} className="px-8 py-6 hover:bg-zinc-50 btn-transition">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <Link href={`/product/${product.slug}`} onClick={closeCart} className="w-20 h-28 bg-zinc-100 flex-shrink-0 overflow-hidden hover:opacity-80 btn-transition relative">
                      <Image
                        src={convertDriveLink(product.images?.[0]) || "/placeholder-product.jpg"}
                        alt={product.name}
                        fill
                        sizes="80px"
                        className={`object-cover transition-opacity duration-300 ${
                          loadedImages[`${product.id}-${size}`] ? "opacity-100" : "opacity-0"
                        }`}
                        onLoad={() => setLoadedImages(prev => ({ ...prev, [`${product.id}-${size}`]: true }))}
                        loading="lazy"
                      />
                      {!loadedImages[`${product.id}-${size}`] && (
                        <div className="absolute inset-0 bg-zinc-200 animate-pulse" />
                      )}
                    </Link>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <span className="font-label text-zinc-400 text-[10px] uppercase tracking-wider">{product.brand?.name}</span>
                      <h3 className="font-semibold text-sm text-zinc-900 truncate mt-0.5">{product.name}</h3>
                      {size && (
                        <p className="text-xs text-zinc-500 mt-1">Size: <span className="text-black font-medium">{size}</span></p>
                      )}
                      
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mt-2">
                        <span className="font-bold text-zinc-900 text-sm">{formatPrice(product.price)}</span>
                        {product.oldPrice && (
                          <span className="text-[10px] text-zinc-400 line-through">{formatPrice(product.oldPrice)}</span>
                        )}
                      </div>

                      {/* Quantity Controls & Remove */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border border-zinc-200 rounded-sm">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1, size)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-zinc-50 btn-transition"
                            aria-label="Giảm số lượng"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14"/>
                            </svg>
                          </button>
                          <span className="w-6 text-center text-xs font-bold">{quantity}</span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1, size)}
                            disabled={quantity >= ((product.stockPerSize as Record<string, number> | null)?.[size ?? ''] ?? product.stock)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-zinc-50 btn-transition disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Tăng số lượng"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14"/><path d="M12 5v14"/>
                            </svg>
                          </button>
                        </div>
                        
                        <button
                          onClick={() => removeItem(product.id, size)}
                          className="text-zinc-400 hover:text-zinc-900 btn-transition text-[10px] font-bold uppercase tracking-widest border-b border-transparent hover:border-zinc-900"
                        >
                          Gỡ bỏ
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-zinc-200 px-8 py-6 space-y-4 bg-white">
            <div className="flex justify-between items-center">
              <span className="font-label text-zinc-500">Tạm tính</span>
              <span className="text-lg font-bold text-zinc-900">{formatPrice(totalPrice)}</span>
            </div>
            <p className="text-xs text-zinc-400">Giao hàng và thuế được tính khi thanh toán</p>
            <button
              onClick={handleCheckout}
              disabled={isCheckingStock}
              className="block w-full text-center btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCheckingStock ? "Đang kiểm tra..." : "Thanh toán"}
            </button>
            <button
              onClick={closeCart}
              className="block w-full text-center border border-zinc-300 text-zinc-600 px-6 py-3 font-label hover:border-black hover:text-black btn-transition"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        )}
      </div>

      {/* Stock Error Modal */}
      {stockError && stockError.length > 0 && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setStockError(null)} />
          <div className="relative bg-white w-full max-w-sm p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-brand-red/10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-red">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-black">Sản phẩm không khả dụng</h3>
                <p className="text-xs text-zinc-500">Một số sản phẩm đã hết hàng hoặc vượt quá tồn kho.</p>
              </div>
            </div>

            <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
              {stockError.map((item) => (
                <div key={item.productId} className="flex items-start gap-2 p-2.5 bg-zinc-50 border border-zinc-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-black truncate">{item.productName}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {item.requestedSize && <span>Size: <strong>{item.requestedSize}</strong> · </span>}
                      {item.reason === 'OUT_OF_STOCK'
                        ? "Đã hết hàng."
                        : item.reason === 'INSUFFICIENT_STOCK'
                        ? `Chỉ còn ${item.availableQty}.`
                        : "Không tìm thấy."}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveUnavailable(item)}
                    className="text-[10px] font-bold uppercase tracking-wider text-brand-red hover:text-black border border-brand-red hover:border-black px-1.5 py-0.5 transition-colors flex-shrink-0"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { stockError.forEach(r => handleRemoveUnavailable(r)); }}
                className="flex-1 border border-zinc-300 text-zinc-700 px-3 py-2.5 text-xs font-bold uppercase tracking-wider hover:border-black btn-transition"
              >
                Xóa tất cả
              </button>
              <button
                onClick={() => setStockError(null)}
                className="flex-1 btn-primary py-2.5 text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
