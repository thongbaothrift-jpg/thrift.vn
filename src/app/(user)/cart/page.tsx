"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { formatPrice, checkProductsStock, type StockCheckResult } from "@/lib/api";
import { convertDriveLink } from "@/lib/utils";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, totalItems, appliedCoupon, setAppliedCoupon, clearCart } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [stockError, setStockError] = useState<StockCheckResult[] | null>(null);
  
  // Re-validate coupon if total price changes
  useEffect(() => {
    if (appliedCoupon && appliedCoupon.minOrderValue && totalPrice < appliedCoupon.minOrderValue) {
      setAppliedCoupon(null);
      setCouponError("Mã giảm giá đã bị gỡ do chưa đủ điều kiện đơn hàng tối thiểu.");
    }
  }, [totalPrice, appliedCoupon, setAppliedCoupon]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsApplying(true);
    setCouponError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coupons/validate?code=${couponCode}&amount=${totalPrice}`);
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || "Mã không hợp lệ");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data);
        setCouponCode("");
      }
    } catch (error) {
      setCouponError("Lỗi kết nối máy chủ");
    } finally {
      setIsApplying(false);
    }
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountPercent) {
      return (totalPrice * appliedCoupon.discountPercent) / 100;
    }
    return appliedCoupon.discountAmount || 0;
  };

  const discount = calculateDiscount();
  // Phí ship chỉ xác định được khi có địa chỉ giao hàng (ở trang checkout)
  // Trang cart KHÔNG tính phí ship — chỉ hiển thị thông báo
  const finalTotal = Math.max(0, totalPrice - discount);

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

      // Stock OK → navigate to checkout
      window.location.href = "/checkout";
    } catch {
      // On error, allow checkout anyway (don't block user)
      window.location.href = "/checkout";
    } finally {
      setIsCheckingStock(false);
    }
  };

  const handleRemoveUnavailable = (result: StockCheckResult) => {
    const item = items.find(i => i.product.id === result.productId);
    if (item) removeItem(item.product.id, item.size);
    setStockError(prev => prev?.filter(r => r.productId !== result.productId) ?? null);
  };

  const handleRemoveAllUnavailable = () => {
    stockError?.forEach(r => {
      const item = items.find(i => i.product.id === r.productId);
      if (item) removeItem(item.product.id, item.size);
    });
    setStockError(null);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-20">
        <div className="text-center max-w-md mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-zinc-300 mx-auto mb-8">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <h1 className="text-3xl font-bold uppercase tracking-tight mb-4 text-zinc-900">Giỏ hàng trống</h1>
          <p className="text-zinc-500 mb-8">Bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
          <Link href="/shop" className="btn-primary inline-block">
            Bắt đầu mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter">Giỏ hàng ({totalItems})</h1>
        <button
          onClick={clearCart}
          className="text-xs sm:text-sm text-zinc-500 hover:text-brand-red transition-colors font-label uppercase tracking-wider"
        >
          Xóa tất cả
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-zinc-200">
            {items.map(({ product, quantity, size }, index) => (
              <div 
                key={`${product.id}-${size}`} 
                className={`px-4 sm:px-8 py-6 sm:py-8 ${index !== items.length - 1 ? "border-b border-zinc-100" : ""}`}
              >
                <div className="flex gap-4 sm:gap-8">
                  {/* Product Image */}
                  <Link href={`/product/${product.slug}`} className="w-24 h-32 sm:w-32 sm:h-44 bg-zinc-100 flex-shrink-0 overflow-hidden relative">
                    <Image
                      src={convertDriveLink(product.images?.[0]) || "/placeholder-product.jpg"}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 96px, 128px"
                      className="object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between relative">
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0 flex-1">
                          <span className="font-label text-zinc-400 text-[10px] sm:text-xs uppercase tracking-wider truncate block">{product.brand?.name}</span>
                          <Link href={`/product/${product.slug}`}>
                            <h3 className="font-bold text-sm sm:text-lg text-black hover:text-brand-red transition-colors mt-1 leading-tight line-clamp-2">
                              {product.name}
                            </h3>
                          </Link>
                          {size && (
                            <p className="text-[10px] sm:text-sm text-zinc-500 mt-1 sm:mt-2">Size: <span className="text-black font-semibold uppercase">{size}</span></p>
                          )}
                        </div>
                        
                        {/* Remove button */}
                        <button 
                          onClick={() => removeItem(product.id, size)}
                          className="text-zinc-300 hover:text-brand-red transition-colors p-1 flex-shrink-0"
                          aria-label="Xóa sản phẩm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                          </svg>
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4 sm:mt-8">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-zinc-200">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1, size)}
                            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-zinc-100 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14"/>
                            </svg>
                          </button>
                          <span className="w-8 sm:w-12 text-center text-xs sm:text-sm font-bold">{quantity}</span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1, size)}
                            disabled={quantity >= ((product.stockPerSize as Record<string, number> | null)?.[size ?? ''] ?? product.stock)}
                            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14"/><path d="M12 5v14"/>
                            </svg>
                          </button>
                        </div>
 
                        {/* Price */}
                        <div className="text-right flex flex-col items-end">
                          <span className="font-black text-brand-red text-base sm:text-xl leading-none">
                            {formatPrice(product.price * quantity)}
                          </span>
                          {product.oldPrice && (
                            <span className="text-[10px] sm:text-xs text-zinc-400 line-through mt-1">
                              {formatPrice(product.oldPrice * quantity)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 sm:mt-8">
            <Link href="/shop" className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-500 hover:text-black transition-colors uppercase tracking-wider">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-zinc-200 p-5 sm:p-6 sticky top-28">
            <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight mb-5 sm:mb-6">Tóm tắt đơn hàng</h2>
            
            <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-6">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-zinc-500">Tạm tính ({totalItems} sản phẩm)</span>
                <span className="font-bold text-zinc-900">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-zinc-500">Vận chuyển dự kiến</span>
                <span className="font-bold text-amber-600 italic text-[10px]">Chưa bao gồm</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed">Phí vận chuyển sẽ được tính chính xác khi bạn nhập địa chỉ giao hàng ở bước thanh toán.</p>
              
              {/* Coupon Section */}
              <div className="pt-3 border-t border-zinc-50">
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Mã giảm giá</p>
                <div className="flex gap-1.5">
                  <input 
                    type="text" 
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError("");
                    }}
                    placeholder="NHẬP MÃ"
                    className="min-w-0 flex-1 border border-zinc-200 px-2.5 py-1.5 text-xs focus:outline-none focus:border-black"
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    disabled={isApplying || !couponCode}
                    className="bg-zinc-900 text-white px-3 py-1.5 text-[9px] font-bold hover:bg-black transition-colors uppercase disabled:opacity-50"
                  >
                    {isApplying ? "..." : "Áp dụng"}
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-brand-red mt-1 font-medium">{couponError}</p>}
                {appliedCoupon && (
                  <div className="mt-1.5 flex justify-between items-center bg-green-50 px-2.5 py-1.5 border border-green-100">
                    <span className="text-[10px] font-bold text-green-700">ĐÃ ÁP DỤNG: {appliedCoupon.code}</span>
                    <button onClick={() => setAppliedCoupon(null)} className="text-[10px] text-zinc-400 hover:text-black">Gỡ bỏ</button>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-5 mb-5 sm:mb-6 space-y-3">
              {appliedCoupon && (
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-zinc-500 font-medium italic">Giảm giá ({appliedCoupon.code})</span>
                  <span className="font-bold text-brand-red">-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-end pt-2 border-t border-zinc-50">
                <span className="font-bold text-zinc-900 uppercase text-sm sm:text-base">Tạm tính</span>
                <span className="font-black text-xl sm:text-2xl text-brand-red">{formatPrice(finalTotal)}</span>
              </div>
              <p className="text-[10px] text-zinc-400 italic">Chưa bao gồm phí vận chuyển. Phí ship sẽ được cộng khi nhập địa chỉ.</p>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isCheckingStock}
              className="block w-full btn-primary text-center py-4 font-black text-sm tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCheckingStock ? "ĐANG KIỂM TRA..." : "TIẾN HÀNH THANH TOÁN"}
            </button>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-[10px] text-zinc-400 uppercase tracking-widest justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Thanh toán bảo mật 100%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Error Modal */}
      {stockError && stockError.length > 0 && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setStockError(null)} />
          <div className="relative bg-white w-full max-w-md p-8 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-brand-red/10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-red">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-black">Sản phẩm không khả dụng</h3>
                <p className="text-sm text-zinc-500">Một số sản phẩm trong giỏ hàng đã hết hàng hoặc vượt quá số lượng tồn kho.</p>
              </div>
            </div>

            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {stockError.map((item) => (
                <div key={item.productId} className="flex items-start gap-3 p-3 bg-zinc-50 border border-zinc-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black truncate">{item.productName}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {item.requestedSize && <span>Size: <strong>{item.requestedSize}</strong> · </span>}
                      {item.reason === 'OUT_OF_STOCK'
                        ? "Sản phẩm đã hết hàng."
                        : item.reason === 'INSUFFICIENT_STOCK'
                        ? `Chỉ còn ${item.availableQty} sản phẩm (bạn đặt ${item.requestedQty}).`
                        : "Sản phẩm không tìm thấy."}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveUnavailable(item)}
                    className="text-[10px] font-bold uppercase tracking-wider text-brand-red hover:text-black border border-brand-red hover:border-black px-2 py-1 transition-colors flex-shrink-0"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRemoveAllUnavailable}
                className="flex-1 border border-zinc-300 text-zinc-700 px-4 py-3 text-sm font-bold uppercase tracking-wider hover:border-black hover:text-black btn-transition"
              >
                Xóa tất cả
              </button>
              <button
                onClick={() => setStockError(null)}
                className="flex-1 btn-primary"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
