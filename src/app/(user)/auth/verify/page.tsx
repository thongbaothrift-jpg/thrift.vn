"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") || "").trim().replace(/[^a-zA-Z0-9-]/g, "");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  const handleVerify = async () => {
    if (!token) {
      setStatus("error");
      setMessage("Token xác nhận không hợp lệ.");
      return;
    }
    
    if (status === "loading") return; // Ngăn double-click

    setStatus("loading");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email?token=${token}`
      );
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("thrifted_auth_token", data.token);
        if (data.email) {
          localStorage.setItem("userEmail", data.email);
        }
        window.dispatchEvent(new Event("auth-state-change"));
        setStatus("success");
        setMessage(data.message || "Xác nhận email thành công!");

        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        setStatus("error");
        setMessage(data.error || "Xác nhận thất bại. Token có thể đã hết hạn.");
        if (data.email) {
          setPendingEmail(data.email);
        }
      }
    } catch {
      setStatus("error");
      setMessage("Đã xảy ra lỗi. Vui lòng thử lại.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-20">
      <div className="w-full max-w-md px-8 text-center">
        {status === "idle" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-50 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-500"
              >
                <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" />
                <polyline points="15,9 18,9 22,15" />
                <path d="M5.2 5.2 2 9.5" />
                <path d="M10.5 5 13 9.5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4">Xác nhận Email</h1>
            <p className="text-zinc-500 mb-8">
              Cảm ơn bạn đã đăng ký. Vui lòng bấm vào nút bên dưới để hoàn tất việc xác nhận.
            </p>
            <button
              onClick={handleVerify}
              className="w-full py-3.5 bg-black text-white font-semibold hover:bg-zinc-800 transition-colors shadow-lg"
            >
              Xác nhận ngay
            </button>
          </>
        )}

        {status === "loading" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 border-4 border-zinc-200 border-t-brand-red rounded-full animate-spin" />
            <h1 className="text-2xl font-bold mb-2">Đang xác nhận...</h1>
            <p className="text-zinc-500">Vui lòng chờ trong giây lát</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-green-600"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Xác nhận thành công!</h1>
            <p className="text-zinc-600 mb-2">{message}</p>
            <p className="text-zinc-500 text-sm mb-8">
              Đang chuyển hướng về trang chủ...
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-black text-white font-medium hover:bg-zinc-800 transition-colors"
            >
              Về trang chủ
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-red-600"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Xác nhận thất bại</h1>
            <p className="text-zinc-600 mb-4">{message}</p>
            {pendingEmail && (
              <p className="text-zinc-500 text-sm mb-6">
                Bạn có thể{" "}
                <Link
                  href={`/auth/verify-pending?email=${encodeURIComponent(pendingEmail)}`}
                  className="text-black font-semibold hover:text-brand-red transition-colors underline"
                >
                  gửi lại email xác nhận
                </Link>
                .
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="px-6 py-3 bg-black text-white font-medium hover:bg-zinc-800 transition-colors"
              >
                Đăng ký lại
              </Link>
              <Link
                href="/auth/login"
                className="px-6 py-3 border border-zinc-300 text-zinc-700 font-medium hover:border-black hover:text-black transition-colors"
              >
                Đăng nhập
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
