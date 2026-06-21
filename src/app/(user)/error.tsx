"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Nếu lỗi là do ChunkLoadError (do deploy bản mới), tự động tải lại trang
    if (
      error.message.includes("ChunkLoadError") ||
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.name === "ChunkLoadError"
    ) {
      window.location.reload();
      return;
    }

    // Log error cho monitoring
    console.error("[THRIFT.VN Error]:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-8">
      <div className="text-center max-w-lg">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-brand-red"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-black mb-3">
            Đã xảy ra lỗi
          </h1>
          <p className="text-zinc-500 text-base leading-relaxed">
            Rất tiếc, đã có lỗi không mong muốn xảy ra. Vui lòng thử lại hoặc
            quay về trang chủ.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button onClick={reset} className="btn-primary">
            Thử lại
          </button>
          <Link href="/" className="btn-ghost">
            Quay về trang chủ
          </Link>
        </div>

        {/* Error reference */}
        {error.digest && (
          <p className="text-xs text-zinc-400 font-mono">
            Mã lỗi: {error.digest}
          </p>
        )}

        {/* Help links */}
        <div className="mt-12 pt-8 border-t border-zinc-200">
          <p className="text-sm text-zinc-400 mb-4">
            Bạn cần hỗ trợ? Liên hệ với chúng tôi:
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/contact"
              className="text-sm text-brand-red hover:underline"
            >
              Liên hệ hỗ trợ
            </Link>
            <span className="text-zinc-300">|</span>
            <a
              href="tel:02812345678"
              className="text-sm text-brand-red hover:underline"
            >
              028 1234 5678
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
