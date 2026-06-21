"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { CommentsSection } from "@/components/CommentsSection";
import {
  getProductBySlug,
  getSizes,
  formatPrice,
  calculateDiscount,
  checkProductsStock,
} from "@/lib/api";
import { convertDriveLink } from "@/lib/utils";
import type { Product } from "@/lib/api/types";
import { useCart } from "@/lib/cart-context";
import { useSiteTexts } from "@/lib/site-texts-context";

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

interface Props {
  slug: string;
  initialProduct?: Product | null;
}

export function ProductClientPage({ slug, initialProduct }: Props) {
  const siteTexts = useSiteTexts();
  const [product, setProduct] = useState<Product | null>(
    initialProduct || null,
  );
  const [loading, setLoading] = useState(!initialProduct);

  const [activeImage, setActiveImage] = useState(0);
  const [mainImagesLoaded, setMainImagesLoaded] = useState<Record<number, boolean>>({});
  const [thumbnailsLoaded, setThumbnailsLoaded] = useState<
    Record<number, boolean>
  >({});

  const { addItem, items, updateQuantity } = useCart();
  const productSizes =
    product?.sizes && product.sizes.length > 0 ? product.sizes : DEFAULT_SIZES;
  const [selectedSize, setSelectedSize] = useState(productSizes[0]);
  const [stockError, setStockError] = useState<string | null>(null);
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const isSoldOut = useMemo(() => {
    if (!product) return false;
    if (product.status === "SOLD_OUT") return true;

    const sizes =
      product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0
        ? product.sizes
        : [];

    if (sizes.length > 0) {
      let totalAvailable = 0;
      const stockPerSize =
        (product.stockPerSize as Record<string, number>) || {};

      for (const size of sizes) {
        totalAvailable += Math.max(0, stockPerSize[size] ?? product.stock ?? 0);
      }
      return totalAvailable <= 0;
    } else {
      return (product.stock || 0) <= 0;
    }
  }, [product]);
  useEffect(() => {
    if (
      initialProduct &&
      (initialProduct.slug === slug || initialProduct.id === slug)
    ) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getProductBySlug(slug).then((p) => {
      setProduct(p || null);
      setLoading(false);
    });
  }, [slug, initialProduct]);

  const handleAddToCart = async () => {
    if (!product) return;
    setIsCheckingStock(true);
    setStockError(null);
    try {
      const result = await checkProductsStock([
        {
          productId: product.id,
          quantity: 1,
          size: selectedSize,
        },
      ]);

      if (!result.allAvailable) {
        const failed = result.results[0];
        if (failed?.reason === "OUT_OF_STOCK") {
          setStockError("Sản phẩm này đã hết hàng.");
        } else if (failed?.reason === "INSUFFICIENT_STOCK") {
          setStockError(
            `Size ${selectedSize} chỉ còn ${failed.availableQty} sản phẩm.`,
          );
        } else {
          setStockError("Sản phẩm không khả dụng.");
        }
        setIsCheckingStock(false);
        return;
      }

      addItem(product, selectedSize);
    } catch {
      // On network error, allow adding anyway (backend will validate at checkout)
      addItem(product, selectedSize);
    } finally {
      setIsCheckingStock(false);
    }
  };

  if (loading && !product) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-zinc-500">Đang tải sản phẩm...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-10 md:py-20 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 uppercase tracking-tighter">
          Sản phẩm không tìm thấy
        </h1>
        <Link href="/shop" className="btn-primary inline-block">
          {" "}
          Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  const formatCondition = (cond?: string) => {
    if (!cond) return "Đã qua sử dụng";
    const c = cond.toUpperCase();
    if (c === "NEW_WITH_TAGS") return "Mới";
    if (c === "LIKE_NEW") return "Như mới";
    if (c === "EXCELLENT") return "Tốt";
    if (c === "GOOD") return "Khá";
    return cond;
  };

  const images =
    product.images?.length > 0 ? product.images : ["/placeholder-product.jpg"];
  const sizingItems = [
    { label: "Chiều rộng", value: product.sizingRong },
    { label: "Chiều dài", value: product.sizingDai },
    { label: "Rộng bụng", value: product.sizingBung },
    { label: "Dài quần", value: product.sizingDayQuan },
    { label: "Ống quần", value: product.sizingOngQuan },
  ].filter((item): item is { label: string; value: string } =>
    Boolean(item.value),
  );

  const cartItem = items.find(
    (item) => item.product.id === product.id && item.size === selectedSize,
  );
  const isInCart = !!cartItem;
  const quantity = cartItem?.quantity || 0;
  const discount = product.oldPrice
    ? calculateDiscount(product.oldPrice, product.price)
    : 0;

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
    setTouchEnd(null);
    setTouchStart(e.touches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }
    setTouchEnd(e.touches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && images.length > 1) {
      setActiveImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
    if (isRightSwipe && images.length > 1) {
      setActiveImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-4 md:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 md:mb-8 overflow-hidden">
        <ol className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <li>
            <Link
              href="/"
              className="hover:text-black transition-colors whitespace-nowrap"
            >
              Home
            </Link>
          </li>
          <li className="text-zinc-300 shrink-0">/</li>
          <li>
            <Link
              href="/shop"
              className="hover:text-black transition-colors whitespace-nowrap"
            >
              Shop
            </Link>
          </li>
          <li className="text-zinc-300 shrink-0">/</li>
          <li className="text-black break-words line-clamp-1">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Product Main */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-16 mb-8 md:mb-24">
        {/* Gallery */}
        <div className="flex flex-col">
          <div 
            className="relative aspect-square bg-zinc-100 overflow-hidden group [touch-action:pan-y_pinch-zoom]"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEndHandler}
          >
            {images.map((img, idx) => (
              <Image
                key={idx}
                src={convertDriveLink(img)}
                alt={`${product.name} - ${idx + 1}`}
                fill
                priority={idx === 0}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={`object-cover transition-all duration-700 ease-in-out select-none absolute inset-0 ${
                  activeImage === idx
                    ? (mainImagesLoaded[idx] ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 z-10 pointer-events-none")
                    : "opacity-0 scale-95 z-0 pointer-events-none"
                }`}
                onLoad={() => setMainImagesLoaded(prev => ({ ...prev, [idx]: true }))}
                draggable={false}
              />
            ))}
            {!mainImagesLoaded[activeImage] && (
              <div className="absolute inset-0 bg-zinc-200 shimmer flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-zinc-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
            
            {/* Desktop Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage(prev => prev === 0 ? images.length - 1 : prev - 1);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"
                  aria-label="Previous image"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage(prev => prev === images.length - 1 ? 0 : prev + 1);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"
                  aria-label="Next image"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </>
            )}

            {product.tags?.length > 0 && (
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
                {product.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-black text-white text-[10px] font-bold px-3 py-1.5 tracking-wider uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {isSoldOut && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[1px] pointer-events-none">
                <div className="bg-white text-black px-8 py-3 font-black text-xl tracking-tighter border-4 border-black rotate-[-12deg] shadow-2xl">
                  SOLD OUT
                </div>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide mt-6">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (activeImage !== idx) {
                      setActiveImage(idx);
                    }
                  }}
                  className={`relative w-20 aspect-[3/4] flex-shrink-0 border transition-all duration-300 ${
                    activeImage === idx
                      ? "border-black scale-95"
                      : "border-transparent opacity-40 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={convertDriveLink(img)}
                    alt={`${product.name} - ${idx + 1}`}
                    fill
                    sizes="80px"
                    className={`object-cover transition-opacity duration-300 ${
                      thumbnailsLoaded[idx] ? "opacity-100" : "opacity-0"
                    }`}
                    onLoad={() =>
                      setThumbnailsLoaded((prev) => ({ ...prev, [idx]: true }))
                    }
                  />
                  {!thumbnailsLoaded[idx] && (
                    <div className="absolute inset-0 bg-zinc-200 shimmer" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col min-w-0 max-w-full">
          {/* Brand */}
          {product.brand?.name && (
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3 break-words">
              {product.brand.name}
            </span>
          )}

          {/* Product Name */}
          <h1 className="text-3xl font-bold text-black mt-2">{product.name}</h1>

          {/* Prices */}
          <div className="flex items-center gap-4 mb-8">
            {product.oldPrice ? (
              <>
                <span className="text-3xl font-bold text-brand-red">
                  {formatPrice(product.price)}
                </span>
                <span className="text-2xl text-zinc-400 line-through font-medium">
                  {formatPrice(product.oldPrice)}
                </span>
                <span className="bg-brand-red text-white text-xs font-bold px-3 py-1.5 uppercase tracking-wider">
                  -{discount}%
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold text-brand-red">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Trust Badges */}
          <div className="space-y-3 mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-brand-red shrink-0"
              >
                <path d="m9 12 2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span className="text-sm font-semibold text-zinc-800">
                Cam kết 100% hàng chính hãng
              </span>
            </div>
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-brand-red shrink-0"
              >
                <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
                <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
                <circle cx="7" cy="18" r="2" />
                <path d="M15 18H9" />
                <circle cx="17" cy="18" r="2" />
              </svg>
              <span className="text-sm font-semibold text-zinc-800">
                Miễn phí giao hàng đơn từ 2 sản phẩm
              </span>
            </div>
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-brand-red shrink-0"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M12 7v5l4 2" />
              </svg>
              <span className="text-sm font-semibold text-zinc-800">
                Đổi trả trong 7 ngày
              </span>
            </div>
          </div>

          {/* Seller */}
          <div className="bg-zinc-50 p-4 md:p-6 mb-6 md:mb-8">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">
              Người bán
            </h3>
            <div className="flex items-center gap-3 pl-1">
              <div className="w-12 h-12 rounded-full overflow-hidden relative border border-zinc-200 bg-zinc-100 shrink-0">
                {product.seller?.avatar ? (
                  <Image
                    src={convertDriveLink(product.seller.avatar)}
                    alt={product.seller.firstName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[13px] tracking-tight text-zinc-900 leading-5 normal-case break-words">
                    {product.seller
                      ? `${product.seller.firstName} ${product.seller.lastName}`
                      : `Cửa hàng ${siteTexts.get("brand.shop_name") || "Thrift.vn"}`}
                  </span>
                  <div className="text-blue-500 shrink-0 leading-none translate-y-[1px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  </div>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-tight text-zinc-400 leading-4 break-normal">
                  Thành viên từ năm{" "}
                  {new Date(
                    product.seller?.createdAt || Date.now(),
                  ).getFullYear()}{" "}
                  ·{" "}
                  {product.seller?.isVerifiedSeller || !product.seller
                    ? "👑 Đã xác thực"
                    : "👑 Đã xác thực"}
                </p>
              </div>
            </div>
          </div>

          {/* Product Details */}
          {(product.condition || sizingItems.length > 0) && (
            <div className="mb-6 md:mb-8">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                  Tình trạng
                </h3>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                  Kích thước
                </h3>

                <div>
                  {product.condition && (
                    <span className="inline-block bg-zinc-100 text-zinc-800 px-4 py-2 text-xs font-bold uppercase tracking-wider">
                      {formatCondition(product.condition)}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-700">
                  {sizingItems.map((item) => (
                    <span key={item.label} className="whitespace-nowrap">
                      <span className="font-semibold">{item.label}</span>{" "}
                      <span className="text-zinc-500">{item.value}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="mb-8">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">
                Mô tả
              </h3>
              <p className="text-zinc-600 text-sm leading-relaxed whitespace-pre-wrap font-medium italic">
                {product.description}
              </p>
            </div>
          )}

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-label text-zinc-700">Chọn size</h3>
                <a
                  href="/size-guide"
                  className="text-xs text-brand-red hover:underline font-label"
                >
                  Hướng dẫn size
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                {productSizes.map((size) => {
                  const stockPerSize = product.stockPerSize as Record<
                    string,
                    number
                  > | null;
                  const stock = stockPerSize?.[size] ?? product.stock ?? 0;
                  const availableStock = stock;
                  const outOfStock = availableStock <= 0;
                  return (
                    <button
                      key={size}
                      onClick={() => !outOfStock && setSelectedSize(size)}
                      disabled={outOfStock}
                      className={`w-14 h-14 border text-sm font-semibold transition-colors ${
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
          )}

          {/* Add to Cart */}
          <div>
            {stockError && (
              <div className="mb-2 text-xs text-brand-red font-medium">
                {stockError}
              </div>
            )}
            {(() => {
              const stockPerSize =
                (product.stockPerSize as Record<string, number> | null) ?? {};

              const availableForSize =
                stockPerSize[selectedSize] ?? product.stock;

              const isOutOfStock =
                availableForSize <= 0 || product.status === "SOLD_OUT";

              return isOutOfStock ? (
                <button
                  disabled
                  className="w-full bg-zinc-200 text-zinc-500 py-4 font-black uppercase tracking-widest cursor-not-allowed text-sm"
                >
                  HẾT HÀNG
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={isCheckingStock || quantity >= availableForSize}
                  className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest text-[12px] hover:bg-brand-red transition-all duration-300 cursor-pointer disabled:bg-zinc-300 disabled:cursor-not-allowed disabled:hover:bg-zinc-300"
                >
                  {isCheckingStock
                    ? "ĐANG KIỂM TRA..."
                    : quantity >= availableForSize
                      ? `TỐI ĐA ${availableForSize} SẢN PHẨM`
                      : `Thêm vào giỏ — ${formatPrice(product.price)}`}
                </button>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mb-6 md:mb-10 pt-8 md:pt-20 border-t border-zinc-200">
        <div className="bg-white rounded-xl p-4 md:p-8 lg:p-12 border border-zinc-200">
          <CommentsSection productId={product.id} productName={product.name} />
        </div>
      </section>
    </div>
  );
}
