import { Suspense } from "react";
import { HomeContent } from "./HomeContent";
import { getNewArrivals, getHotDeals, getBrands, getBanners } from "@/lib/api";
import { getPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("home");
}

// Separate component for Featured Sections to enable Streaming
async function FeaturedSections({ initialBrands, initialBanners }: any) {
  try {
    // Fetch product lists in parallel but don't block the initial page shell
    const [newArrivals, hotDeals, statsRes] = await Promise.all([
      getNewArrivals(4).catch(() => []),
      getHotDeals(4).catch(() => []),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/stats/new-arrivals-count`, { cache: 'no-store' })
        .then(res => res.json())
        .catch(() => ({ count: 0 }))
    ]);

    return (
      <HomeContent 
        initialNewArrivals={newArrivals}
        initialHotDeals={hotDeals}
        initialBrands={initialBrands}
        initialBanners={initialBanners}
        initialNewArrivalsCount={statsRes.count}
      />
    );
  } catch (error) {
    console.error("Streaming error on Home Page:", error);
    return null;
  }
}

export default async function HomePage() {
  // Fetch only critical "Above the Fold" data first
  const [brands, banners] = await Promise.all([
    getBrands().catch(() => []),
    getBanners().catch(() => []),
  ]);

  return (
    <Suspense fallback={
      <div className="w-full">
        {/* Skeleton for Hero Section */}
        <div className="h-[90vh] bg-zinc-900 animate-pulse flex flex-col justify-center px-8">
           <div className="h-20 w-3/4 bg-zinc-800 mb-6" />
           <div className="h-6 w-1/2 bg-zinc-800 mb-10" />
           <div className="flex gap-4">
              <div className="h-12 w-32 bg-zinc-800" />
              <div className="h-12 w-32 bg-zinc-800" />
           </div>
        </div>
        
        {/* Skeleton for Sections */}
        <div className="py-24 max-w-[1440px] mx-auto px-8">
          <div className="h-8 w-48 shimmer mb-12" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] shimmer" />
            ))}
          </div>
        </div>
      </div>
    }>
      <FeaturedSections 
        initialBrands={brands} 
        initialBanners={banners} 
      />
    </Suspense>
  );
}
