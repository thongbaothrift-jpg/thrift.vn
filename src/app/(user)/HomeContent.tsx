"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/ProductCard";
import { QuickViewModal } from "@/components/QuickViewModal";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { useSiteTexts } from "@/lib/site-texts-context";
import type { Product, Brand, Banner } from "@/lib/api/types";
import { convertDriveLink } from "@/lib/utils";

interface HomeContentProps {
  initialNewArrivals: Product[];
  initialHotDeals: Product[];
  initialBrands: Brand[];
  initialBanners: Banner[];
  initialNewArrivalsCount: number;
}

export function HomeContent({
  initialNewArrivals,
  initialHotDeals,
  initialBrands,
  initialBanners,
  initialNewArrivalsCount
}: HomeContentProps) {
  const siteTexts = useSiteTexts();
  const shopName = siteTexts.get("brand.shop_name") || "THRIFT.VN";
  const [newArrivals] = useState<Product[]>(initialNewArrivals);
  const [hotDeals] = useState<Product[]>(initialHotDeals);
  const [brands] = useState<Brand[]>(initialBrands);
  const [banners] = useState<Banner[]>(initialBanners);
  const [newArrivalsCount] = useState(initialNewArrivalsCount);
  
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [banner1Loaded, setBanner1Loaded] = useState(false);
  const [banner2Loaded, setBanner2Loaded] = useState(false);

  // Scroll reveal
  useEffect(() => {
    const reveals = document.querySelectorAll(".reveal");
    const staggerReveals = document.querySelectorAll(".stagger-reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    reveals.forEach((el) => observer.observe(el));
    staggerReveals.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] w-full overflow-hidden bg-zinc-900">
        <div className="absolute inset-0">
          <Image
            src={(banners[0]?.image && (banners[0].image.startsWith('http') || banners[0].image.startsWith('/'))) 
              ? convertDriveLink(banners[0].image) 
              : "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1600&q=80"
            }
            alt={banners[0]?.title || `Hero ${shopName}`}
            fill
            priority
            quality={75}
            sizes="100vw"
            className={`object-cover transition-opacity duration-1000 ${
              heroLoaded ? "opacity-90" : "opacity-0"
            }`}
            onLoad={() => setHeroLoaded(true)}
          />
          {!heroLoaded && (
            <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
          )}
        </div>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 h-full max-w-[1440px] mx-auto px-8 flex flex-col justify-center items-start">
          <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter leading-none mb-10 animate-fade-in-up whitespace-pre-line">
            {banners[0]?.title || "Đồ cũ,\nGiá trị mới."}
          </h1>
          {banners[0]?.description && (
             <p className="text-white/80 text-xl mb-10 max-w-2xl animate-fade-in-up delay-100">{banners[0].description}</p>
          )}
          <div className="flex gap-4 animate-fade-in-up delay-200">
            <Link href={banners[0]?.button1Link || "/shop"} className="btn-primary">
              {banners[0]?.button1Text || "Mua sắm"}
            </Link>
            <Link href={banners[0]?.button2Link || "/shop?filter=hot-deals"} className="btn-outline backdrop-blur-sm bg-white/5">
              {banners[0]?.button2Text || "Xem Sale"}
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-10 md:py-20 max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-16 gap-6 reveal">
          <div>
            <span className="font-label text-brand-red mb-3 block">Mới nhất</span>
            <h2 className="text-4xl font-bold uppercase tracking-tight">Hàng mới về</h2>
            <p className="text-zinc-500 mt-2 font-label text-xs uppercase tracking-widest">
              {newArrivalsCount} sản phẩm mới tuần này
            </p>
          </div>
          <Link href="/shop" className="font-label border-b border-black pb-1 hover:text-brand-red hover:border-brand-red transition-all uppercase link-underline">
            Xem tất cả
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 stagger-reveal visible">
          {newArrivals.map((p, idx) => (
            <ProductCard 
              key={p.id} 
              product={p} 
              onQuickView={handleQuickView} 
              index={idx} 
              priority={idx < 4}
            />
          ))}
        </div>
      </section>

      {/* Banners */}
      <section className="max-w-[1440px] mx-auto px-4 md:px-8 py-10 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {/* Left Banner */}
        <div className="relative h-[600px] overflow-hidden group cursor-pointer bg-zinc-900 img-zoom reveal">
          <Image
            src={(banners[1]?.image && (banners[1].image.startsWith('http') || banners[1].image.startsWith('/'))) 
              ? convertDriveLink(banners[1].image) 
              : "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
            }
            alt={banners[1]?.title || "Luxury Drop"}
            fill
            quality={60}
            sizes="(max-width: 768px) 100vw, 50vw"
            className={`object-cover transition-all duration-700 group-hover:scale-105 ${
              banner1Loaded ? "opacity-60" : "opacity-0"
            }`}
            onLoad={() => setBanner1Loaded(true)}
          />
          {!banner1Loaded && (
            <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
          )}
          <div className="relative z-10 h-full p-16 flex flex-col justify-center items-start text-white">
            <span className="font-label text-white/70 mb-4 block">
              {banners[1]?.description || "Bộ sưu tập giới hạn"}
            </span>
            <h3 className="text-5xl font-black uppercase mb-8">
              {banners[1]?.title || "Luxury Drop"}
            </h3>
            <Link 
              href={banners[1]?.button1Link || "/shop"} 
              className="bg-white text-black px-10 py-4 font-label hover:bg-brand-red hover:text-white btn-transition"
            >
              {banners[1]?.button1Text || "Khám phá ngay"}
            </Link>
          </div>
        </div>

        {/* Right Banner */}
        <div className={`relative h-[600px] overflow-hidden ${banners[2]?.image ? 'bg-zinc-900' : 'bg-brand-red'} p-16 flex flex-col justify-center items-start text-white group cursor-pointer hover:brightness-95 btn-transition reveal`}>
          {banners[2]?.image && (banners[2].image.startsWith('http') || banners[2].image.startsWith('/')) ? (
            <>
              <Image
                src={convertDriveLink(banners[2].image)}
                alt={banners[2].title || "Promotion"}
                fill
                quality={60}
                sizes="(max-width: 768px) 100vw, 50vw"
                className={`object-cover transition-all duration-700 group-hover:scale-105 ${
                  banner2Loaded ? "opacity-60" : "opacity-0"
                }`}
                onLoad={() => setBanner2Loaded(true)}
              />
              {!banner2Loaded && (
                <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
              )}
            </>
          ) : (
            <div className="absolute -bottom-20 -right-20 opacity-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
          )}
          
          <div className="relative z-10">
            <span className="font-label mb-4 block">
              {banners[2]?.title || "Biến tủ đồ thành tiền"}
            </span>
            <h3 className="text-5xl font-black uppercase mb-8">
              {banners[2]?.description?.slice(0, 30) || `Bán hàng cùng ${shopName}`}
            </h3>
            <p className="text-white/80 mb-10 max-w-sm">
              {banners[2]?.description || "Mua thẳng hoặc ký gửi. Nhận giá tốt nhất cho đồ xa xỉ đã qua xác thực của bạn."}
            </p>
            <Link 
              href={banners[2]?.button1Link || "/sell"} 
              className="bg-black text-white px-10 py-4 font-label hover:bg-white hover:text-black btn-transition"
            >
              {banners[2]?.button1Text || "Bắt đầu bán"}
            </Link>
          </div>
        </div>
      </section>

      {/* Hot Deals */}
      <section className="py-10 md:py-20 max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-16 gap-6 reveal">
          <div>
            <span className="font-label text-brand-red mb-3 block">Sắp hết hạn</span>
            <h2 className="text-4xl font-bold uppercase tracking-tight">Khuyến mãi nóng</h2>
          </div>
          <Link href="/shop?filter=hot-deals" className="font-label border-b border-black pb-1 hover:text-brand-red hover:border-brand-red transition-all uppercase link-underline">
            Xem tất cả
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 stagger-reveal visible">
          {hotDeals.map((p, idx) => (
            <ProductCard key={p.id} product={p} onQuickView={handleQuickView} index={idx} />
          ))}
        </div>
      </section>

      {/* Brand Section */}
      <section className="py-10 md:py-20 border-y border-zinc-200">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 text-center reveal">
          <span className="font-label text-zinc-400 mb-16 block tracking-[0.3em]">Mua sắm theo thương hiệu</span>
          <div className="flex flex-wrap justify-center items-center gap-x-20 gap-y-12">
            {brands.slice(0, 8).map((brand) => (
              <Link 
                key={brand.id}
                href={`/shop?brand=${brand.slug}`}
                className="text-2xl font-black text-zinc-300 hover:text-black btn-transition tracking-tight uppercase"
              >
                {brand.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSection />

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
