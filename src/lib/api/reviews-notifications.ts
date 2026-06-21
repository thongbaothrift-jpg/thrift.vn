import type { AuthUser } from './auth-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('thrifted_auth_token');
}

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, cache: 'no-store' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Lỗi không xác định' }));
    const err: any = new Error(errorData.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// ============================================
// REVIEW API
// ============================================

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number | null;
  title?: string | null;
  comment?: string | null;
  images: string[];
  adminReply?: string | null;
  adminReplyAt?: string | null;
  admin?: { id: string; firstName: string; lastName: string } | null;
  user: Pick<AuthUser, 'id' | 'firstName' | 'lastName' | 'avatar'> & { email?: string };
  product?: { id: string; name: string; slug: string };
  createdAt: string;
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  return fetchApi<Review[]>(`/reviews/product/${productId}`);
}

export async function createReview(data: {
  productId: string;
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
}): Promise<Review> {
  return fetchApi<Review>('/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function replyReview(reviewId: string, reply: string): Promise<Review> {
  return fetchApi<Review>(`/reviews/${reviewId}/reply`, {
    method: 'PUT',
    body: JSON.stringify({ reply }),
  });
}

export async function deleteReview(reviewId: string): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`/reviews/${reviewId}`, {
    method: 'DELETE',
  });
}

export async function getAllReviews(): Promise<Review[]> {
  return fetchApi<Review[]>('/reviews/admin/all');
}

// ============================================
// NOTIFICATION API
// ============================================

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export async function getNotifications(unreadOnly = false): Promise<Notification[]> {
  return fetchApi<Notification[]>(`/notifications${unreadOnly ? '?unreadOnly=true' : ''}`);
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return fetchApi<{ count: number }>('/notifications/unread-count');
}

export async function markAsRead(id: string): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`/notifications/${id}/read`, { method: 'PUT' });
}

export async function markAllAsRead(): Promise<{ message: string }> {
  return fetchApi<{ message: string }>('/notifications/read-all', { method: 'PUT' });
}

export async function deleteNotification(id: string): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`/notifications/${id}`, { method: 'DELETE' });
}

// ============================================
// PAYMENT API
// ============================================

export async function createVNPayUrl(orderId: string, amount: number, orderDescription?: string): Promise<{ paymentUrl: string; txnRef: string }> {
  return fetchApi<{ paymentUrl: string; txnRef: string }>('/payments/create-vnpay', {
    method: 'POST',
    body: JSON.stringify({ orderId, amount, orderInfo: orderDescription }),
  });
}

// ============================================
// TRACK ORDER API
// ============================================

export interface TrackedOrder {
  orderId: string;
  shortId: string;
  orderStatus: string;
  orderStatusLabel: string;
  shippingStatus: string;
  shippingStatusLabel: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  trackingCode: string | null;
  total: number;
  paymentMethod: string;
  paymentContent: string | null;
  couponCode: string | null;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    name: string;
    brand: string | null;
    image: string | null;
    quantity: number;
    price: number;
  }>;
  timeline: Array<{
    key: string;
    label: string;
    completed: boolean;
    current: boolean;
  }>;
  ssFee: number;
  ssJourney: Array<{
    time: string;
    status: string;
    location: string;
    note: string | null;
  }>;
}

export async function trackOrder(orderId: string): Promise<TrackedOrder> {
  const params = new URLSearchParams({ orderId });
  return fetchApi<TrackedOrder>(`/orders/track?${params.toString()}`);
}
