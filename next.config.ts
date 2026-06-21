import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "**.facebook.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 200, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },

  // ============================================
  // REDIRECT 301 — Old URL → New URL
  // ============================================
  async redirects() {
    return [
      // Redirect /products/* → /product/* (nếu ai đó gõ nhầm số nhiều)
      {
        source: "/products/:slug",
        destination: "/product/:slug",
        permanent: true, // 301
      },
      // Redirect /blogs/* → /blog/* 
      {
        source: "/blogs/:slug",
        destination: "/blog/:slug",
        permanent: true,
      },
      // Redirect /shop/product → /product (deep link fix)
      {
        source: "/shop/product/:slug",
        destination: "/product/:slug",
        permanent: true,
      },
      // Redirect /sell-flow → /sell (clean URL)
      {
        source: "/sell-flow",
        destination: "/sell",
        permanent: true,
      },
    ];
  },

  // ============================================
  // SECURITY & SEO HEADERS
  // ============================================
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
