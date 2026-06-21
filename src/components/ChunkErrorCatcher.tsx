"use client";

import { useEffect } from "react";

export function ChunkErrorCatcher() {
  useEffect(() => {
    const handleChunkError = (e: ErrorEvent | PromiseRejectionEvent) => {
      const isErrorEvent = "message" in e;
      const message = isErrorEvent ? e.message : (e as PromiseRejectionEvent).reason?.message;
      const name = isErrorEvent ? e.error?.name : (e as PromiseRejectionEvent).reason?.name;

      if (
        message?.includes("ChunkLoadError") ||
        message?.includes("Failed to fetch dynamically imported module") ||
        name === "ChunkLoadError"
      ) {
        // Tránh bị loop vĩnh viễn (nếu reload rồi mà vẫn lỗi)
        const isReloading = sessionStorage.getItem("is_chunk_reloading");
        if (!isReloading) {
          sessionStorage.setItem("is_chunk_reloading", "true");
          window.location.reload();
        }
      }
    };

    window.addEventListener("error", handleChunkError);
    window.addEventListener("unhandledrejection", handleChunkError);

    // Xóa cờ reload sau khi tải trang thành công vài giây
    const timeout = setTimeout(() => {
      sessionStorage.removeItem("is_chunk_reloading");
    }, 5000);

    return () => {
      window.removeEventListener("error", handleChunkError);
      window.removeEventListener("unhandledrejection", handleChunkError);
      clearTimeout(timeout);
    };
  }, []);

  return null;
}
