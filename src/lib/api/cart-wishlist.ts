import type { Product } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('thrifted_auth_token');
}

async function fetchCart<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  if (!token) throw new Error('Chưa đăng nhập');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  headers['Authorization'] = `Bearer ${token}`;

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
// CART API
// ============================================

export interface CartApiItem {
  id: string;
  productId: string;
  quantity: number;
  size?: string | null;
  product: Product;
}

export async function getCart(): Promise<CartApiItem[]> {
  return fetchCart<CartApiItem[]>('/cart');
}

export async function addToCart(productId: string, quantity = 1, size?: string): Promise<CartApiItem> {
  return fetchCart<CartApiItem>('/cart', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity, size }),
  });
}

export async function updateCartItem(id: string, quantity: number): Promise<CartApiItem | { message: string }> {
  return fetchCart<CartApiItem | { message: string }>(`/cart/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(id: string): Promise<{ message: string }> {
  return fetchCart<{ message: string }>(`/cart/${id}`, {
    method: 'DELETE',
  });
}

export async function clearCart(): Promise<{ message: string }> {
  return fetchCart<{ message: string }>('/cart', {
    method: 'DELETE',
  });
}

// ============================================
// WISHLIST API
// ============================================

export interface WishlistApiItem {
  id: string;
  productId: string;
  addedAt: string;
  product: Product;
}

export async function getWishlist(): Promise<WishlistApiItem[]> {
  return fetchCart<WishlistApiItem[]>('/wishlist');
}

export async function addToWishlist(productId: string): Promise<WishlistApiItem> {
  return fetchCart<WishlistApiItem>('/wishlist', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
}

export async function removeFromWishlist(productId: string): Promise<{ message: string }> {
  return fetchCart<{ message: string }>(`/wishlist/${productId}`, {
    method: 'DELETE',
  });
}
