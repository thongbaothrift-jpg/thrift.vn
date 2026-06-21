import type {
  Product,
  ProductFilter,
  Brand,
  BlogPost,
  Collection,
  Announcement,
  Category,
  SellRequest,
  Banner,
  Attribute,
  AttributeValue,
} from "./types";

// Re-export auth functions
export * from "./auth";
export * from "./user";
export * from "./sell";
export * from "./cart-wishlist";
export * from "./orders";
export * from "./reviews-notifications";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper for fetch
const MAX_RETRIES = 2;

async function fetchApi<T>(path: string, options?: RequestInit & { noCache?: boolean }): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        cache: 'no-store',
      });
      if (res.ok) return res.json();
      if (attempt === MAX_RETRIES || res.status < 500) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }
      await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
    } catch (e) {
      lastError = e as Error;
    }
  }
  throw lastError;
}

// ============================================
// PRODUCT API
// ============================================

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export async function getProducts(filter?: ProductFilter & { page?: number; limit?: number }): Promise<ProductsResponse> {
  const params = new URLSearchParams();
  if (filter?.categories?.length) params.set('category', filter.categories[0]);
  if (filter?.brands?.length) params.set('brand', filter.brands[0]);
  if (filter?.hotDealsOnly) params.set('hot', 'true');
  if (filter?.sortBy) params.set('sort', filter.sortBy);
  else params.set('sort', 'newest');
  if (filter?.page) params.set('page', String(filter.page));
  if (filter?.limit) params.set('limit', String(filter.limit));
  if (filter?.priceRange) {
    params.set('minPrice', String(filter.priceRange[0]));
    params.set('maxPrice', String(filter.priceRange[1]));
  }
  if (filter?.sizes?.length) params.set('sizes', filter.sizes.join(','));
  if (filter?.hideOutOfStock) params.set('hideOutOfStock', 'true');

  const query = params.toString() ? `?${params.toString()}` : '';
  return fetchApi<ProductsResponse>(`/products${query}`);
}

export async function getProduct(id: string): Promise<Product | undefined> {
  // In our new schema, we use slug for unique lookup in frontend usually
  // but if we need ID lookup, we'd need a backend route for it.
  // For now, let's assume we use slug for everything in the new UI.
  return getProductBySlug(id);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    return await fetchApi<Product>(`/products/${slug}`);
  } catch (error) {
    return undefined;
  }
}

export async function getNewArrivals(limit?: number): Promise<Product[]> {
  const query = limit ? `?new=true&sort=newest&limit=${limit}` : '?new=true&sort=newest';
  const res = await fetchApi<ProductsResponse>(`/products${query}`);
  return res.products ?? [];
}

export async function getHotDeals(limit?: number): Promise<Product[]> {
  const query = limit ? `?hot=true&sort=newest&limit=${limit}` : '?hot=true&sort=newest';
  const res = await fetchApi<ProductsResponse>(`/products${query}`);
  return res.products ?? [];
}

// ============================================
// SIZES API (dynamic sizes from products)
// ============================================

export async function getSizes(): Promise<string[]> {
  try {
    const res = await fetchApi<{ sizes: string[] }>('/sizes');
    return res.sizes ?? [];
  } catch {
    // Fallback to default sizes if API fails
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  }
}

export async function getRelatedProducts(productId: string, limit = 4): Promise<Product[]> {
  try {
    const data = await fetchApi<{ products: Product[] } | Product[]>(
      `/products/${productId}/related?limit=${limit}`
    );
    // Handle both array response and { products: Product[] } response
    if (Array.isArray(data)) return data;
    return data?.products ?? [];
  } catch {
    // Fallback: try fetching by ID if slug-based route fails
    try {
      const product = await fetchApi<Product>(`/products/id/${productId}`);
      if (product) {
        const related = await fetchApi<Product[]>(
          `/products/${product.id}/related?limit=${limit}`
        );
        return related;
      }
    } catch {
      // ignore
    }
    return [];
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  return fetchApi<Product[]>(`/search?q=${encodeURIComponent(query)}`);
}

// ============================================
// STOCK CHECK API
// ============================================

export interface StockCheckItem {
  productId: string;
  quantity: number;
  size?: string;
}

export interface StockCheckResult {
  productId: string;
  productName: string;
  requestedQty: number;
  requestedSize?: string;
  available: boolean;
  availableQty: number;
  reason?: "OUT_OF_STOCK" | "INSUFFICIENT_STOCK" | "NOT_FOUND";
}

export interface StockCheckResponse {
  success: boolean;
  allAvailable: boolean;
  results: StockCheckResult[];
  unavailableCount: number;
}

export async function checkProductsStock(items: StockCheckItem[]): Promise<StockCheckResponse> {
  return fetchApi<StockCheckResponse>('/products/stock-check', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

// ============================================
// BRAND API
// ============================================

export async function getBrands(): Promise<Brand[]> {
  return fetchApi<Brand[]>('/brands');
}

export async function getBrandBySlug(slug: string): Promise<Brand | undefined> {
  const brands = await getBrands();
  return brands.find(b => b.slug === slug);
}

export async function getAdminBrands(): Promise<Brand[]> {
  return fetchApi<Brand[]>('/admin/brands');
}

export async function createBrand(data: Partial<Brand>): Promise<Brand> {
  return fetchApi<Brand>('/admin/brands', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBrand(id: string, data: Partial<Brand>): Promise<Brand> {
  return fetchApi<Brand>(`/admin/brands/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteBrand(id: string): Promise<void> {
  return fetchApi<void>(`/admin/brands/${id}`, {
    method: 'DELETE',
  });
}

export async function getProductsByBrand(brandSlug: string): Promise<Product[]> {
  return fetchApi<Product[]>(`/products?brand=${brandSlug}`);
}

// ============================================
// CATEGORY API
// ============================================

export async function getCategories(): Promise<Category[]> {
  return fetchApi<Category[]>('/categories');
}

export async function getAdminCategories(): Promise<Category[]> {
  return fetchApi<Category[]>('/admin/categories');
}

export async function createCategory(data: Partial<Category>): Promise<Category> {
  return fetchApi<Category>('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<Category> {
  return fetchApi<Category>(`/admin/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  return fetchApi<void>(`/admin/categories/${id}`, {
    method: 'DELETE',
  });
}

export async function getNewArrivalsCount(): Promise<number> {
  try {
    const res = await fetchApi<{ count: number }>('/stats/new-arrivals-count');
    return res.count;
  } catch {
    return 0;
  }
}

// ============================================
// COLLECTION API
// ============================================

export async function getCollections(): Promise<Collection[]> {
  const newCount = await getNewArrivalsCount();
  return [
    {
      id: "col-1",
      name: "Hàng mới về",
      slug: "new-arrivals",
      description: "Những món đồ xa xỉ mới nhất vừa được thêm vào bộ sưu tập của chúng tôi.",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      productCount: newCount,
    },
    {
      id: "col-2",
      name: "Khuyến mãi nóng",
      slug: "hot-deals",
      description: "Ưu đãi có thời hạn cho các sản phẩm đã xác thực cao cấp.",
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800",
      productCount: 16,
    }
  ];
}

export async function getCollectionBySlug(slug: string): Promise<Collection | undefined> {
  const cols = await getCollections();
  return cols.find(c => c.slug === slug);
}

export async function getProductsByCollection(collectionSlug: string): Promise<Product[]> {
  if (collectionSlug === 'new-arrivals') return getNewArrivals();
  if (collectionSlug === 'hot-deals') return getHotDeals();
  const res = await getProducts();
  return res.products;
}

// ============================================
// ANNOUNCEMENT API
// ============================================

export async function getAnnouncements(): Promise<Announcement[]> {
  const newCount = await getNewArrivalsCount();
  return [
    { id: "ann-1", text: `MỚI VỀ ${newCount} SẢN PHẨM TUẦN NÀY`, icon: "★", isActive: true },
    { id: "ann-2", text: "ĐỔI TRẢ TRONG 7 NGÀY", icon: "★", isActive: true },
    { id: "ann-3", text: "AUTHENTIC GUARANTEED", icon: "★", isActive: true },
    { id: "ann-4", text: "MIỄN PHÍ GIAO HÀNG ĐƠN TỪ 500K", icon: "★", isActive: true },
  ];
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

// ============================================
// VOUCHER / COUPON API (PUBLIC)
// ============================================

export interface Voucher {
  id: string;
  code: string;
  description: string | null;
  discountPercent: number | null;
  discountAmount: number | null;
  minOrderValue: number | null;
  maxDiscount: number | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export async function getVouchers(): Promise<Voucher[]> {
  return fetchApi<Voucher[]>('/coupons');
}

export function calculateDiscount(original: number, sale: number): number {
  return Math.round(((original - sale) / original) * 100);
}

// ============================================
// PUBLIC BANNER API
// ============================================

export async function getBanners(): Promise<Banner[]> {
  return fetchApi<Banner[]>('/banners');
}

// ============================================
// ADMIN: BANNER API
// ============================================

export async function getAdminBanners(): Promise<Banner[]> {
  return fetchApi<Banner[]>('/admin/banners');
}

export async function createBanner(data: Partial<Banner>): Promise<Banner> {
  return fetchApi<Banner>('/admin/banners', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBanner(id: string, data: Partial<Banner>): Promise<Banner> {
  return fetchApi<Banner>(`/admin/banners/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteBanner(id: string): Promise<void> {
  return fetchApi<void>(`/admin/banners/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// ADMIN: ATTRIBUTE API
// ============================================

export async function getAdminAttributes(): Promise<Attribute[]> {
  return fetchApi<Attribute[]>('/admin/attributes');
}

export async function createAttribute(name: string): Promise<Attribute> {
  return fetchApi<Attribute>('/admin/attributes', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function deleteAttribute(id: string): Promise<void> {
  return fetchApi<void>(`/admin/attributes/${id}`, {
    method: 'DELETE',
  });
}

export async function addAttributeValue(attributeId: string, value: string): Promise<AttributeValue> {
  return fetchApi<AttributeValue>(`/admin/attributes/${attributeId}/values`, {
    method: 'POST',
    body: JSON.stringify({ value }),
  });
}

export async function deleteAttributeValue(id: string): Promise<void> {
  return fetchApi<void>(`/admin/attributes/values/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// SITE TEXT API (PUBLIC)
// ============================================

export async function getPublicSiteTexts(): Promise<Record<string, string>> {
  try {
    return await fetchApi<Record<string, string>>('/site-texts');
  } catch {
    return {};
  }
}
