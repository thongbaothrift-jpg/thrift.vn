"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/api/auth";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu token.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({ token, newPassword });
      setMessage(res.message);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-20">
      <div className="w-full max-w-md px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">
            Đặt lại mật khẩu
          </h1>
          <p className="text-zinc-500">
            Nhập mật khẩu mới cho tài khoản THRIFT.VN của bạn
          </p>
        </div>

        {!token ? (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">
              Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu token.
            </div>
            <Link href="/auth/forgot-password" className="block w-full btn-primary text-center">
              Gửi lại liên kết đặt lại
            </Link>
          </div>
        ) : (
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

            {!message && (
              <>
                <div>
                  <label htmlFor="new-password" className="block font-label text-zinc-700 mb-2">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field"
                    placeholder="Tối thiểu 8 ký tự"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block font-label text-zinc-700 mb-2">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    placeholder="Nhập lại mật khẩu mới"
                    required
                    minLength={8}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
                </button>
              </>
            )}
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">
            Đã nhớ mật khẩu?{" "}
            <Link href="/auth/login" className="text-black font-semibold hover:text-brand-red transition-colors">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
