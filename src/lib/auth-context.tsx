"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { AuthUser } from "@/lib/api/auth-types";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getProfile,
  getStoredToken,
  getStoredUser,
  setStoredAuth,
  clearStoredAuth,
} from "@/lib/api/auth";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage on mount — no API call needed here.
  // Auth is verified server-side via cookies on each request.
  useEffect(() => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin({ email, password });
    setStoredAuth(res.token, res.user);
    setToken(res.token);
    setUser(res.user);
    window.dispatchEvent(new Event("auth-state-change"));
    return res;
  }, []);

  const register = useCallback(
    async (email: string, password: string, firstName: string, lastName: string) => {
      const res = await apiRegister({ email, password, firstName, lastName });
      if (res.token) {
        setStoredAuth(res.token, res.user);
        setToken(res.token);
      }
      setUser(res.user);
      window.dispatchEvent(new Event("auth-state-change"));
      return res;
    },
    []
  );

  const logout = useCallback(() => {
    apiLogout();
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event("auth-state-change"));
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const profile = await getProfile(token);
      setUser(profile);
      setStoredAuth(token, profile);
    } catch {
      // ignore
    }
  }, [token]);

  // Listen for auth-state-change from google-callback / other sources
  useEffect(() => {
    const handleAuthChange = () => {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      } else {
        setToken(null);
        setUser(null);
      }
    };
    window.addEventListener("auth-state-change", handleAuthChange);
    return () => window.removeEventListener("auth-state-change", handleAuthChange);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
