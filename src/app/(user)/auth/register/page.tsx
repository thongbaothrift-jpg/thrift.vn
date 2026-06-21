"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }

    if (formData.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    setLoading(true);

    try {
      const res = await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
      );

      // Redirect to verify pending page
      router.push(
        `/auth/verify-pending?email=${encodeURIComponent(formData.email)}`,
      );
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-20">
      <div className="w-full max-w-md px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">
            Tạo tài khoản
          </h1>
          <p className="text-zinc-500">
            Đăng ký THRIFT.VN để nhận quyền truy cập đặc biệt
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block font-label text-zinc-700 mb-2"
              >
                Họ
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="input-field"
                placeholder="Nguyễn"
                required
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block font-label text-zinc-700 mb-2"
              >
                Tên
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="input-field"
                placeholder="Văn A"
                required
              />
            </div>
          </div>

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
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-label text-zinc-700 mb-2"
            >
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              placeholder="Ít nhất 8 ký tự"
              required
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block font-label text-zinc-700 mb-2"
            >
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input-field"
              placeholder="Nhập lại mật khẩu"
              required
            />
          </div>

          <div className="flex items-start gap-3">
            <input type="checkbox" id="terms" className="mt-1" required />
            <label htmlFor="terms" className="text-sm text-zinc-600">
              Tôi đồng ý với{" "}
              <a
                href="#"
                className="text-black font-semibold hover:text-brand-red transition-colors"
              >
                Điều khoản dịch vụ
              </a>{" "}
              và{" "}
              <a
                href="#"
                className="text-black font-semibold hover:text-brand-red transition-colors"
              >
                Chính sách bảo mật
              </a>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">
            Đã có tài khoản?{" "}
            <Link
              href="/auth/login"
              className="text-black font-semibold hover:text-brand-red transition-colors"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
