"use client";

import { useEffect } from "react";

// Silently ignore Next.js internal performance measurement errors that occur
// when navigating to 404 pages (e.g. "NotFound" mark with zero-width space chars).
// These are benign browser console errors that don't affect functionality.
function patchPerformance() {
  if (typeof window === "undefined") return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const original = (Performance.prototype as any).measure;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Performance.prototype as any).measure = function (...args: unknown[]) {
    try {
      return original.apply(this, args);
    } catch {
      // Silently ignore measurement errors on 404 pages
    }
  };
}

export function PerformancePatch() {
  useEffect(() => {
    patchPerformance();
  }, []);

  return null;
}
