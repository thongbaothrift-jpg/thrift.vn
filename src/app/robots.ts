import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/account/",
          "/cart",
          "/wishlist",
          "/search",
          "/admin/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/account/",
          "/cart",
          "/wishlist",
          "/search",
          "/admin/",
        ],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://thrift.vn'}/sitemap.xml`,
    host: process.env.NEXT_PUBLIC_SITE_URL || 'https://thrift.vn',
  };
}
