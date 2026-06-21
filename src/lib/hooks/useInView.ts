"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns true once the element enters the viewport, then stays true.
 * Much cheaper than a per-element IntersectionObserver for a grid of many items.
 */
export function useInViewOnce(threshold = 0.05) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, threshold]);

  return { ref, inView };
}

/**
 * Drives staggered-in animation for grid children.
 * The returned `style` applies a delay based on index.
 * Does NOT animate each child individually with IntersectionObserver —
 * that would be too expensive with many items.
 *
 * Usage: parent div gets `useStagger(inView)`, children inherit via CSS.
 */
export function useStagger(inView: boolean, baseDelay = 40, maxItems = 16) {
  return {
    style: {
      animation: inView ? "staggerFadeIn 0.55s cubic-bezier(0.22,1,0.36,1) forwards" : "none",
      animationDelay: "0ms",
    },
  };
}

/**
 * Smoothly resets content while out-of-view, then re-enters when in-view.
 * Use when a parent container mounts but its children may not be in-view yet.
 */
export function useInViewReset(threshold = 0.01) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}
