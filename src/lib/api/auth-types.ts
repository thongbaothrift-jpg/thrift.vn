export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  phone?: string | null;
  role: string;
  isEmailVerified: boolean;
  provider?: "google" | "email";
  hasPassword?: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
  token: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SetPasswordRequest {
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
