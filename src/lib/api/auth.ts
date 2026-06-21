import type {
  AuthUser,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  SetPasswordRequest,
  UpdateProfileRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from './auth-types';
import { setCookie, getCookie, eraseCookie } from '@/lib/cookies';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchAuth<T>(
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

const TOKEN_KEY = 'thrifted_auth_token';
const USER_KEY = 'thrifted_auth_user';
const ROLE_KEY = 'thrifted_auth_role';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY) || getCookie(TOKEN_KEY);
  } catch {
    return getCookie(TOKEN_KEY);
  }
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: AuthUser): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Ignore localStorage errors
  }
  setCookie(TOKEN_KEY, token, 7);
  setCookie(ROLE_KEY, user.role, 7);
}

export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Ignore localStorage errors
  }
  eraseCookie(TOKEN_KEY);
  eraseCookie(ROLE_KEY);
}

// ============================================
// AUTH API
// ============================================

export async function login(data: LoginRequest): Promise<AuthResponse> {
  return fetchAuth<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return fetchAuth<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function logout(): Promise<void> {
  clearStoredAuth();
}

export async function getProfile(token?: string | null): Promise<AuthUser> {
  return fetchAuth<AuthUser>('/auth/profile', {}, token);
}

export async function updateProfile(
  data: UpdateProfileRequest,
  token?: string | null
): Promise<AuthUser> {
  return fetchAuth<AuthUser>('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
}

export async function changePassword(
  data: ChangePasswordRequest,
  token?: string | null
): Promise<{ message: string }> {
  return fetchAuth<{ message: string }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
}

export async function setPassword(
  data: SetPasswordRequest,
  token?: string | null
): Promise<{ message: string }> {
  return fetchAuth<{ message: string }>('/auth/set-password', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
}

export async function forgotPassword(
  data: ForgotPasswordRequest
): Promise<{ message: string; devResetLink?: string }> {
  return fetchAuth<{ message: string; devResetLink?: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function resetPassword(
  data: ResetPasswordRequest
): Promise<{ message: string }> {
  return fetchAuth<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function googleLogin(code: string): Promise<AuthResponse> {
  return fetchAuth<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}
