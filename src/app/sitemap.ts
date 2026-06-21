import { MetadataRoute } from "next";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thrift.vn";

  // ============================================
  // STATIC PAGES
  // ============================================
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sell`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/size-guide`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // ============================================
  // DYNAMIC: PRODUCT PAGES
  // ============================================
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_BASE_URL}/products?limit=500`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const products = data.products || [];
      productPages = products.map((product: any) => ({
        url: `${baseUrl}/product/${product.slug}`,
        lastModified: new Date(product.updatedAt || product.createdAt),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // Graceful — static pages only if API unavailable
  }

  // ============================================
  // DYNAMIC: BLOG PAGES
  // ============================================
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_BASE_URL}/blog`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const posts = await res.json();
      blogPages = (posts || []).map((post: any) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.publishedAt || post.createdAt),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
    }
  } catch {
    // Graceful
  }

  return [...staticPages, ...productPages, ...blogPages];
}
