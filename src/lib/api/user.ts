import type { AuthUser, UpdateProfileRequest, ChangePasswordRequest } from './auth-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchUser<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
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

export async function getUserProfile(token: string): Promise<AuthUser> {
  return fetchUser<AuthUser>('/users/profile', {}, token);
}

export async function updateUserProfile(
  data: UpdateProfileRequest,
  token: string
): Promise<AuthUser> {
  return fetchUser<AuthUser>('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
}

export async function changeUserPassword(
  data: ChangePasswordRequest,
  token: string
): Promise<{ message: string }> {
  return fetchUser<{ message: string }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
}

// ============================================
// ADDRESS API
// ============================================

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward?: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward?: string;
  postalCode?: string;
  isDefault?: boolean;
}

export async function getAddresses(token: string): Promise<Address[]> {
  return fetchUser<Address[]>('/users/addresses', {}, token);
}

export async function createAddress(
  data: CreateAddressRequest,
  token: string
): Promise<Address> {
  return fetchUser<Address>('/users/addresses', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
}

export async function updateAddress(
  id: string,
  data: Partial<CreateAddressRequest & { isDefault: boolean }>,
  token: string
): Promise<Address> {
  return fetchUser<Address>(`/users/addresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
}

export async function deleteAddress(
  id: string,
  token: string
): Promise<{ message: string }> {
  return fetchUser<{ message: string }>(`/users/addresses/${id}`, {
    method: 'DELETE',
  }, token);
}
