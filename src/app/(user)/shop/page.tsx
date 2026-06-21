import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopContent } from "./ShopContent";
import { getProducts, getBrands, getCategories } from "@/lib/api";
import type { ProductFilter } from "@/lib/api/types";

type SortOption = "newest" | "price-low" | "price-high" | "popular";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop - THRIFT.VN | Thời trang luxury pre-loved chính hãng",
  description:
    "Khám phá bộ sưu tập thời trang luxury pre-loved từ các thương hiệu hàng đầu thế giới. Đảm bảo 100% chính hãng với giá tốt nhất.",
  keywords: [
    "thời trang pre-loved",
    "luxury",
    "authenticate",
    "thrift shop",
    "secondhand luxury",
  ],
  openGraph: {
    title: "Shop - THRIFT.VN | Thời trang luxury pre-loved chính hãng",
    description:
      "Khám phá bộ sưu tập thời trang luxury pre-loved. Đảm bảo 100% chính hãng.",
    type: "website",
  },
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function ProductGrid({
  filter,
  initialFilters,
  brands,
  categories,
}: {
  filter: ProductFilter & { page?: number; limit?: number };
  initialFilters: {
    category: string;
    brand: string;
    sort: SortOption;
    minPrice: number;
    maxPrice: number;
    hotDeals: boolean;
    sizes: string[];
    hideOutOfStock: boolean;
  };
  brands: any[];
  categories: any[];
}) {
  try {
    const data = await getProducts(filter).catch(() => null);
    return (
      <ShopContent
        initialData={data}
        initialBrands={brands}
        initialCategories={categories}
        initialFilters={initialFilters}
      />
    );
  } catch (error) {
    console.error("Streaming error in Shop:", error);
    return null;
  }
}

export default async function ShopPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const category = (params.category as string) || "";
  const brand = (params.brand as string) || "";
  const sort = (params.sort as string) || "newest";
  const minPrice = parseInt(params.minPrice as string) || 0;
  const maxPrice = parseInt(params.maxPrice as string) || 0;
  const hotDeals = params.filter === "hot-deals";
  const sizesParam = params.sizes as string;
  const sizes = sizesParam
    ? sizesParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const hideOutOfStock = params.hideOutOfStock === "1";

  const filter: ProductFilter & { page?: number; limit?: number } = {
    hotDealsOnly: hotDeals,
    sortBy: sort as SortOption,
    categories: category ? [category] : undefined,
    brands: brand ? [brand] : undefined,
    priceRange: minPrice > 0 || maxPrice > 0 ? [minPrice, maxPrice] : undefined,
    sizes: sizes.length > 0 ? sizes : undefined,
    hideOutOfStock: hideOutOfStock || undefined,
    page: 1,
    limit: 20,
  };

  const [brands, categories] = await Promise.all([
    getBrands().catch(() => []),
    getCategories().catch(() => []),
  ]);

  const initialFilters = {
    category,
    brand,
    sort: sort as SortOption,
    minPrice,
    maxPrice,
    hotDeals,
    sizes,
    hideOutOfStock,
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-4 md:py-12">
      <Suspense
        fallback={
          <div className="flex flex-col gap-8">
            <div className="h-10 w-48 shimmer" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] shimmer" />
              ))}
            </div>
          </div>
        }
      >
        <ProductGrid
          filter={filter}
          initialFilters={initialFilters}
          brands={brands}
          categories={categories}
        />
      </Suspense>
    </div>
  );
}
