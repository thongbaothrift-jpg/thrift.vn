"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirect = searchParams.get("redirect") || "/account";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(email, password);

      if (res.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push(redirect);
      }
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const callbackUrl = `${window.location.origin}/auth/google-callback`;
    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
      `&response_type=code` +
      `&scope=email%20profile` +
      `&access_type=offline` +
      `&prompt=select_account`;

    window.location.href = googleAuthUrl;
  };

  const showGoogle =
    GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID";

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-20">
      <div className="w-full max-w-md px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">
            Chào mừng trở lại
          </h1>
          <p className="text-zinc-500">Đăng nhập vào tài khoản THRIFT.VN</p>
        </div>

        {showGoogle ? (
          <>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 border border-zinc-200 bg-white px-4 py-3 text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Đăng nhập với Google</span>
            </button>

            <div className="mt-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-brand-bg px-4 text-zinc-400">
                    Hoặc đăng nhập với email
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block font-label text-zinc-700 mb-2"
            >
              Địa chỉ Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="font-label text-zinc-700">
                Mật khẩu
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-brand-red hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">
            Chưa có tài khoản?{" "}
            <Link
              href="/auth/register"
              className="text-black font-semibold hover:text-brand-red transition-colors"
            >
              Tạo tài khoản mới
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
