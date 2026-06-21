"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GoogleCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [message, setMessage] = useState("Đang đăng nhập Google...");

  useEffect(() => {
    // Prevent duplicate calls (e.g. React Strict Mode)
    if ((window as any).__googleCallbackHandled) return;
    (window as any).__googleCallbackHandled = true;

    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");
    const state = searchParams.get("state");

    if (errorParam) {
      setStatus("error");
      setMessage("Đăng nhập Google bị hủy hoặc thất bại.");
      setTimeout(() => router.replace("/auth/login"), 3000);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("Không nhận được mã xác thực từ Google.");
      setTimeout(() => router.replace("/auth/login"), 3000);
      return;
    }

    // Call backend directly to exchange code for token
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Đăng nhập Google thất bại." }));
          throw new Error(data.error || "HTTP " + res.status);
        }
        return res.json();
      })
      .then((data) => {
        const { token, user } = data;
        if (token && user) {
          localStorage.setItem("thrifted_auth_token", token);
          localStorage.setItem("thrifted_auth_user", JSON.stringify(user));
          document.cookie = `thrifted_auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
          document.cookie = `thrifted_auth_role=${user.role}; path=/; max-age=${7 * 24 * 60 * 60}`;
          window.dispatchEvent(new Event("auth-state-change"));
          if (user.role === "ADMIN") {
            router.replace("/admin");
          } else {
            if (state) {
              router.replace(decodeURIComponent(state));
            } else {
              router.replace("/");
            }
          }
        } else {
          throw new Error("Phản hồi không hợp lệ.");
        }
      })
      .catch((err: any) => {
        console.error("[google-callback]", err);
        setStatus("error");
        setMessage(err.message || "Đăng nhập Google thất bại. Vui lòng thử lại.");
        setTimeout(() => router.replace("/auth/login"), 3000);
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        {status === "loading" ? (
          <>
            <div className="w-10 h-10 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-zinc-500">{message}</p>
          </>
        ) : (
          <>
            <div className="text-4xl mx-auto">✗</div>
            <p className="text-red-500 text-sm">{message}</p>
            <p className="text-zinc-400 text-xs">Đang chuyển hướng...</p>
          </>
        )}
      </div>
    </div>
  );
}
