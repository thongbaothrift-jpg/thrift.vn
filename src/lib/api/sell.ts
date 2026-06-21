import type { Product } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  let token: string | null = null;
  
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('thrifted_auth_token');
  } else {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      token = cookieStore.get('thrifted_auth_token')?.value || null;
    } catch (e) {
      token = null;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Lỗi không xác định' }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ============================================
// PRODUCT API
// ============================================

export async function createProduct(data: Partial<Product> & { name: string; price: number; condition: string }): Promise<Product> {
  return fetchApi<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMyProducts(): Promise<Product[]> {
  return fetchApi<Product[]>('/products/my-products');
}

export async function deleteProduct(id: string): Promise<void> {
  await fetchApi(`/products/${id}`, { method: 'DELETE' });
}

// ============================================
// SELL REQUEST TYPES
// ============================================

export interface SellRequestItem {
  id: string;
  sellRequestId: string;
  productName: string;
  brandName: string;
  categoryName: string;
  condition: string;
  expectedPrice?: number;
  offeredPrice?: number;
  description?: string;
  images: string[];
  itemStatus: string;
  rejectionNote?: string;
  dealHistory?: Array<{ actor: 'USER' | 'ADMIN'; price: number; note?: string; timestamp: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface SellRequest {
  id: string;
  userId?: string;
  saleType: 'CONSIGNMENT' | 'BUYOUT';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  deliveryMethod: 'SHOP_PICKUP' | 'SELF_SEND';
  pickupProvince?: string;
  pickupDistrict?: string;
  pickupWard?: string;
  pickupCity?: string;
  pickupAddress?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  supershipPickupCode?: string;
  pickupStatus?: string;
  items?: SellRequestItem[];
  _count?: { items: number };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export interface SellRequestSubmitPayload {
  products: Array<{
    name: string;
    category?: string;
    brand: string;
    condition: string;
    price: string;
    description?: string;
    images: string[];
  }>;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  deliveryMethod: 'shop-lay' | 'tu-gui';
  pickupProvince?: string;
  pickupCity?: string;
  pickupDistrict?: string;
  pickupWard?: string;
  pickupAddress?: string;
  saleType: 'thu-mua' | 'ky-gui';
}

export interface AdminSellRequestListResponse {
  requests: SellRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface SellRequestStats {
  totalRequests: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  completedCount: number;
  bySaleType: Array<{ saleType: string; count: number }>;
  recentRequests?: SellRequest[];
}

export interface AdminSellRequestsAllResponse {
  requests: SellRequest[];
  total: number;
  stats: SellRequestStats;
  page: number;
  limit: number;
}

// ============================================
// USER SELL REQUEST API
// ============================================

export async function submitSellRequest(data: SellRequestSubmitPayload): Promise<SellRequest> {
  return fetchApi<SellRequest>('/sell-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMySellRequests(): Promise<SellRequest[]> {
  return fetchApi<SellRequest[]>('/sell-requests/my-requests');
}

export async function getSellRequest(id: string): Promise<SellRequest> {
  return fetchApi<SellRequest>(`/sell-requests/${id}`);
}

export async function respondToSellOffer(itemId: string, action: 'ACCEPT' | 'REJECT' | 'COUNTER_OFFER', expectedPrice?: number, note?: string): Promise<SellRequestItem> {
  return fetchApi<SellRequestItem>(`/sell-requests/items/${itemId}/response`, {
    method: 'PATCH',
    body: JSON.stringify({ action, expectedPrice, note }),
  });
}

export async function createShipment(requestId: string): Promise<SellRequest> {
  return fetchApi<SellRequest>(`/sell-requests/${requestId}/create-shipment`, {
    method: 'POST',
  });
}

export async function cancelShipment(requestId: string): Promise<SellRequest> {
  return fetchApi<SellRequest>(`/sell-requests/${requestId}/cancel-shipment`, {
    method: 'POST',
  });
}

// ============================================
// ADMIN SELL REQUEST API
// ============================================

export async function getAdminSellRequests(params?: {
  status?: string;
  saleType?: string;
  page?: number;
  limit?: number;
}): Promise<AdminSellRequestListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.saleType) searchParams.set('saleType', params.saleType);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const query = searchParams.toString();
  return fetchApi<AdminSellRequestListResponse>(
    `/admin/sell-requests${query ? `?${query}` : ''}`
  );
}

export async function getAdminSellRequestsAll(params?: {
  status?: string;
  saleType?: string;
  page?: number;
  limit?: number;
}): Promise<AdminSellRequestsAllResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.saleType) searchParams.set('saleType', params.saleType);
  if (params?.page) searchParams.set('page', String(params.page ?? 1));
  if (params?.limit) searchParams.set('limit', String(params.limit ?? 20));

  return fetchApi<AdminSellRequestsAllResponse>(
    `/admin/sell-requests/all?${searchParams.toString()}`
  );
}

export async function getAdminSellRequest(id: string): Promise<SellRequest> {
  return fetchApi<SellRequest>(`/admin/sell-requests/${id}`);
}

export async function updateSellRequestStatus(
  id: string,
  data: { status: string; notes?: string }
): Promise<SellRequest> {
  return fetchApi<SellRequest>(`/admin/sell-requests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateSellRequestItem(
  itemId: string,
  data: {
    itemStatus?: string;
    offeredPrice?: number;
    rejectionNote?: string;
    note?: string;
  }
): Promise<SellRequestItem> {
  return fetchApi<SellRequestItem>(`/admin/sell-requests/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function bulkUpdateSellRequestItems(
  items: Array<{
    id: string;
    itemStatus?: string;
    offeredPrice?: number;
    rejectionNote?: string;
  }>
): Promise<SellRequestItem[]> {
  return fetchApi<SellRequestItem[]>('/admin/sell-requests/items/bulk-update', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function getSellRequestStats(): Promise<SellRequestStats> {
  return fetchApi<SellRequestStats>('/admin/sell-requests/stats/summary');
}
