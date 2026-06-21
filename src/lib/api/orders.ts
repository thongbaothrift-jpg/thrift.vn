import type { Product } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('thrifted_auth_token');
}

async function fetchOrders<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, cache: 'no-store' });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Lỗi không xác định' }));
    const err = new Error(errorData.error || `HTTP ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }
  return res.json();
}

// ============================================
// ORDER API
// ============================================

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  size?: string | null;
  product: Product;
}

export interface Order {
  id: string;
  userId?: string | null;
  status: string;
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  trackingCode: string | null;
  shippingStatus: string | null;
  shippingStatusLabel: string | null;
  shippingName: string;
  shippingPhone: string;
  shippingEmail?: string | null;
  shippingAddress: string;
  shippingCity: string;
  shippingDistrict: string;
  shippingPostal?: string | null;
  orderNote?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  paymentContent: string | null;
  isDepositRequired: boolean;
  depositAmount: number | null;
  depositPaid: boolean;
  couponId?: string | null;
  couponDiscount?: number | null;
  items: OrderItem[];
  coupon?: any;
  createdAt: string;
  updatedAt: string;
  returnRequests?: Array<{
    id: string;
    status: string;
    reason: string;
    reasonText?: string | null;
    adminNote?: string | null;
    createdAt: string;
    updatedAt: string;
    approvedAt?: string | null;
    completedAt?: string | null;
  }>;
}

export async function checkFirstOrder(): Promise<{ isFirstOrder: boolean }> {
  return fetchOrders<{ isFirstOrder: boolean }>('/orders/check-first-order');
}

export interface CreateOrderRequest {
  items: { productId: string; quantity: number; price: number; size?: string }[];
  shippingName: string;
  shippingPhone: string;
  shippingEmail?: string;
  shippingAddress: string;
  shippingCity: string;
  shippingDistrict: string;
  shippingPostal?: string;
  shippingWard?: string;
  orderNote?: string;
  paymentMethod: string;
  couponCode?: string;
  shippingFee: number; // fixed fee from admin settings
}

export async function createOrder(data: CreateOrderRequest): Promise<Order> {
  return fetchOrders<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getOrders(): Promise<Order[]> {
  return fetchOrders<Order[]>('/orders');
}

export async function getOrder(id: string): Promise<Order> {
  return fetchOrders<Order>(`/orders/${id}`);
}

export async function cancelOrder(id: string): Promise<Order> {
  return fetchOrders<Order>(`/orders/${id}/cancel`, { method: 'POST' });
}

// ============================================
// COUPON API
// ============================================

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountPercent?: number;
  discountAmount?: number;
  minOrderValue?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export async function validateCoupon(code: string): Promise<Coupon> {
  return fetchOrders<Coupon>(`/coupons/validate?code=${encodeURIComponent(code)}`);
}

// ============================================
// RETURN REQUEST API
// ============================================

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  reasonText?: string | null;
  images: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  adminNote?: string | null;
  adminId?: string | null;
  approvedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    total: number;
    status: string;
    shippingName: string;
    createdAt: string;
    items?: {
      product: { id: string; name: string; images: string[] };
    }[];
  };
}

export interface ReturnRequestListResponse {
  requests: ReturnRequest[];
  total: number;
  pendingCount?: number;
  page: number;
  limit: number;
  pages: number;
}

export async function checkReturnRequest(orderId: string): Promise<{
  canRequest: boolean;
  error?: string;
  existingRequest?: { id: string; status: string; createdAt: string } | null;
  config?: { allowReturnDays: number; requireReturnImage: boolean };
}> {
  return fetchOrders(`/return-requests/check/${orderId}`);
}

export async function getReturnRequests(params?: { status?: string; page?: number; limit?: number }): Promise<ReturnRequestListResponse> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  return fetchOrders<ReturnRequestListResponse>(`/return-requests?${qs}`);
}

export async function getReturnRequestDetail(id: string): Promise<ReturnRequest> {
  return fetchOrders<ReturnRequest>(`/return-requests/${id}`);
}

export interface CreateReturnRequestData {
  orderId: string;
  reason: string;
  reasonText?: string;
  images?: string[];
}

export async function createReturnRequest(data: CreateReturnRequestData): Promise<ReturnRequest> {
  return fetchOrders<ReturnRequest>('/return-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
