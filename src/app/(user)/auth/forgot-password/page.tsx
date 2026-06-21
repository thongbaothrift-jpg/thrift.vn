"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await forgotPassword({ email });
      setMessage(res.message);
      if (res.devResetLink) {
        // DEV ONLY - show link for testing
        console.log("Reset link:", res.devResetLink);
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-20">
      <div className="w-full max-w-md px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Quên mật khẩu</h1>
          <p className="text-zinc-500">Nhập email để nhận liên kết đặt lại mật khẩu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm">
              {message}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block font-label text-zinc-700 mb-2">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">
            Nhớ mật khẩu?{" "}
            <Link href="/auth/login" className="text-black font-semibold hover:text-brand-red transition-colors">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
