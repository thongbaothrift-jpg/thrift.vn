"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function VerifyPendingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [checkCount, setCheckCount] = useState(0);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    // Check if already verified by calling login endpoint
    const checkVerification = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          credentials: "include",
        });

        if (res.ok) {
          router.push("/");
        }
      } catch {
        // Not logged in yet, stay on page
      }
    };

    // Check immediately
    checkVerification();

    // Check every 3 seconds for up to 5 minutes
    const interval = setInterval(() => {
      setCheckCount((c) => {
        if (c > 100) {
          clearInterval(interval);
        }
        return c + 1;
      });
      checkVerification();
    }, 3000);

    return () => clearInterval(interval);
  }, [router]);

  // Auto-resend email if email is in URL and not yet resent
  useEffect(() => {
    if (!email) return;
    if (sessionStorage.getItem("resent_" + email)) {
      setResent(true);
      return;
    }

    const resend = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          }
        );
        if (res.ok) {
          sessionStorage.setItem("resent_" + email, "1");
          setResent(true);
        }
      } catch {
        // Silently fail, user can refresh to retry
      }
    };

    // Delay 1 second to show the UI first
    const timer = setTimeout(resend, 1000);
    return () => clearTimeout(timer);
  }, [email]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-20">
      <div className="w-full max-w-md px-8 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-brand-red/10 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-brand-red"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>

          <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">
            Xác nhận email
          </h1>

          <p className="text-zinc-600 mb-2">
            Chúng tôi đã gửi một email xác nhận đến
          </p>
          <p className="font-bold text-lg text-black mb-6">{email}</p>

          <p className="text-zinc-500 text-sm mb-8">
            Vui lòng kiểm tra hộp thư và click vào link xác nhận để kích hoạt tài khoản.
          </p>

          <div className="bg-zinc-50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400 mb-3">
              Không nhận được email?
            </h3>
            <ul className="text-sm text-zinc-600 space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-brand-red">1.</span>
                Kiểm tra thư mục spam / quảng cáo
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-red">2.</span>
                Email có thể mất 1-2 phút để gửi
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-red">3.</span>
                Link xác nhận có hiệu lực trong 24 giờ
              </li>
            </ul>

            {email && (
              <p className="text-sm text-green-600 font-medium mt-2">
                ✓ Email xác nhận đã được gửi lại. Vui lòng kiểm tra hộp thư.
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/login"
              className="px-6 py-3 border border-zinc-300 text-zinc-700 font-medium hover:border-black hover:text-black transition-colors"
            >
              Quay lại đăng nhập
            </Link>
            <Link
              href="/auth/register"
              className="px-6 py-3 bg-black text-white font-medium hover:bg-zinc-800 transition-colors"
            >
              Đăng ký tài khoản khác
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
