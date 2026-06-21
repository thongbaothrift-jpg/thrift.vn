"use client";

import { memo } from "react";
import { usePathname } from "next/navigation";

export const PageTransition = memo(function PageTransition({ children }: { children: React.ReactNode }) {
  // Removed useEffect + class toggle — CSS animation via .page-enter handles transitions.
  // This avoids unnecessary reflow + layout recalculation on every navigation.
  return (
    <div className="page-transition-content page-enter">
      {children}
    </div>
  );
});
