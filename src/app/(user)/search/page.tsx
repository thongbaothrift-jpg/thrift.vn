import { Suspense } from "react";
import { SearchContent } from "./SearchContent";
import { searchProducts, getProducts } from "@/lib/api";
import type { Product } from "@/lib/api/types";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = (params.q as string) || "";
  
  let initialProducts: Product[] = [];
  let total = 0;

  try {
    if (query) {
      const allResults = await searchProducts(query);
      total = allResults.length;
      // Initial chunk for SSR
      initialProducts = allResults.slice(0, 12);
    } else {
      const res = await getProducts({ page: 1, limit: 12 });
      initialProducts = res.products || [];
      total = res.total;
    }
  } catch (error) {
    console.error("SSR Search Error:", error);
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-12">
      <Suspense fallback={
        <div className="flex flex-col gap-8">
          <div className="h-10 w-64 shimmer mb-6" />
          <div className="h-16 w-full max-w-2xl shimmer mb-12" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] shimmer" />
            ))}
          </div>
        </div>
      }>
        <SearchContent 
          initialProducts={initialProducts}
          initialTotal={total}
          initialQuery={query}
        />
      </Suspense>
    </div>
  );
}
