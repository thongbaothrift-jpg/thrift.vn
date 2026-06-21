import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductClientPage } from "@/components/ProductClientPage";
import { convertDriveLink } from "@/lib/utils";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { createProductMetadata } from "@/lib/seo";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

// Fetch main product data
async function getProduct(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Separate component for Related Products to support Streaming
async function RelatedProducts({ productId }: { productId: string }) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/products/${productId}/related?limit=4`,
      { cache: 'no-store' },
    );
    const related = res.ok ? await res.json() : [];

    if (related.length === 0) return null;

    return (
      <section className="max-w-[1440px] mx-auto px-4 md:px-8 mb-12 md:mb-24 mt-12">
        <div className="flex justify-between items-end mb-12">
          <h2 className="text-3xl font-bold uppercase tracking-tight">
            Có thể bạn cũng thích
          </h2>
          <Link
            href="/shop"
            className="font-label border-b border-black pb-1 hover:text-brand-red hover:border-brand-red transition-all uppercase"
          >
            Xem tất cả
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {related.map((p: any, idx: number) => (
            <ProductCard key={p.id} product={p} index={idx} />
          ))}
        </div>
      </section>
    );
  } catch {
    return null;
  }
}

// ============================================
// DYNAMIC METADATA — SEO Title, Description, OG, Canonical
// ============================================
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Sản phẩm không tìm thấy | Thrifted",
      description: "Sản phẩm bạn tìm kiếm không tồn tại hoặc đã được bán.",
    };
  }

  return createProductMetadata({
    name: product.name,
    description: product.description ?? undefined,
    brand: product.brand?.name,
    category: product.category?.name,
    images: product.images?.map(convertDriveLink),
  });
}

// ============================================
// PRODUCT JSON-LD — Schema.org Product
// ============================================
function ProductJsonLd({ product }: { product: any }) {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thrift.vn";
  const image = product.images?.[0]
    ? convertDriveLink(product.images[0])
    : `${SITE_URL}/og-image.jpg`;

  const formatCondition = (cond?: string) => {
    const c = (cond || "").toUpperCase();
    if (c === "NEW_WITH_TAGS") return "https://schema.org/NewCondition";
    return "https://schema.org/UsedCondition";
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description || `${product.name} - Đã qua xác thực tại Thrifted.`,
    image: product.images?.map((img: string) => convertDriveLink(img)) || [
      image,
    ],
    brand: product.brand?.name
      ? { "@type": "Brand", name: product.brand.name }
      : undefined,
    category: product.category?.name || undefined,
    sku: product.id,
    itemCondition: formatCondition(product.condition),
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: "VND",
      price: product.price,
      availability:
        product.status === "AVAILABLE"
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
      seller: {
        "@type": "Organization",
        name: "Thrifted",
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// ============================================
// BREADCRUMB JSON-LD
// ============================================
function BreadcrumbJsonLd({ product }: { product: any }) {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thrift.vn";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Trang chủ",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Cửa hàng",
        item: `${SITE_URL}/shop`,
      },
      ...(product.category?.name
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: product.category.name,
              item: `${SITE_URL}/shop?category=${product.category.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: product.category?.name ? 4 : 3,
        name: product.name,
        item: `${SITE_URL}/product/${product.slug}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// ============================================
// PAGE COMPONENT
// ============================================
export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  return (
    <>
      {product && (
        <>
          <ProductJsonLd product={product} />
          <BreadcrumbJsonLd product={product} />
        </>
      )}
      <ProductClientPage slug={id} initialProduct={product} />

      <Suspense
        fallback={
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 mb-12 md:mb-24 mt-16">
            <div className="h-10 w-64 shimmer mb-12" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] shimmer" />
              ))}
            </div>
          </div>
        }
      >
        <RelatedProducts productId={id} />
      </Suspense>
    </>
  );
}
