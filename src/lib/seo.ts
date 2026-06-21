import type { Metadata } from "next";

// ============================================
// Hardcoded fallbacks — dùng khi DB chưa có giá trị
// ============================================
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thrift.vn";

const FALLBACKS: Record<string, string | undefined> = {
  "seo.site_name":        "THRIFT.VN - Hàng Hiệu Ký Gửi & Săn Đồ Cũ",
  "seo.default_title":    "THRIFT.VN - Hàng Hiệu Ký Gửi & Săn Đồ Cũ",
  "seo.default_desc":     "Nơi mua bán đồ xa xỉ pre-loved đã qua xác thực. Túi xách, giày, đồng hồ từ thương hiệu hàng đầu thế giới.",
  "seo.og_image":         `${SITE_URL}/og-image.jpg`,
  "seo.twitter_handle":   "@thriftedvn",
  "page.home.title":      "Trang chủ",
  "page.shop.title":      "Cửa hàng",
  "page.shop.desc":       "Khám phá bộ sưu tập đồ xa xỉ pre-loved đã qua xác thực. Túi xách, giày, đồng hồ từ Chanel, Gucci, LV và nhiều thương hiệu khác.",
  "page.cart.title":      "Giỏ hàng",
  "page.wishlist.title":  "Yêu thích",
  "page.account.title":   "Tài khoản",
  "page.orders.title":    "Theo dõi đơn hàng",
  "page.login.title":     "Đăng nhập",
  "page.register.title":   "Đăng ký",
  "page.sell.title":      "Bán hàng",
  "page.sell.desc":       "Bán đồ xa xỉ của bạn trên Thrifted. Chúng tôi kiểm định và xác thực sản phẩm để đảm bảo chất lượng.",
  "page.blog.title":      "Tin tức",
  "page.blog.desc":       "Cập nhật tin tức, xu hướng thời trang xa xỉ và tips mua sắm tại Thrifted.",
  "page.contact.title":   "Liên hệ",
  "page.contact.desc":    "Liên hệ với Thrifted. Chúng tôi sẵn sàng hỗ trợ về xác thực, mua bán, hoặc bất kỳ câu hỏi nào.",
  "page.search.title":    "Tìm kiếm",
  "page.size_guide.title": "Hướng dẫn kích thước",
  "page.size_guide.desc":  "Hướng dẫn chọn kích thước phù hợp cho túi xách, giày và quần áo xa xỉ.",
  "page.about.title":     "Về chúng tôi",
};

// ============================================
// Cached fetch từ /api/site-texts (DB)
// ============================================
async function fetchSiteTexts(): Promise<Record<string, string>> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL;
    const res = await fetch(`${base}/site-texts`, {
      cache: 'no-store',
    });
    if (!res.ok) return {};
    return res.json() as Promise<Record<string, string>>;
  } catch {
    return {};
  }
}

// ============================================
// Helper: lấy text từ DB, fallback về hardcoded
// ============================================
function get(key: string, texts: Record<string, string>): string {
  return texts[key] ?? FALLBACKS[key] ?? "";
}

// ============================================
// Core metadata builder
// ============================================
function buildMetadata(options: {
  title: string;
  description?: string;
  keywords?: string[];
  path?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  noindex?: boolean;
  texts: Record<string, string>;
}): Metadata {
  const {
    title,
    keywords = [],
    path = "",
    type = "website",
    publishedTime,
    modifiedTime,
    authors,
    noindex = false,
    texts,
  } = options;

  const siteName  = get("seo.site_name", texts) || FALLBACKS["seo.site_name"]!;
  const desc      = options.description ?? get("seo.default_desc", texts) ?? FALLBACKS["seo.default_desc"]!;
  const ogImage   = get("seo.og_image", texts) || FALLBACKS["seo.og_image"]!;
  const twitterHandle = get("seo.twitter_handle", texts) || FALLBACKS["seo.twitter_handle"]!;

  const fullTitle = `${title} | ${siteName}`;
  const canonicalUrl = `${SITE_URL}${path}`;
  const imageUrl = ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`;

  return {
    title: fullTitle,
    description: desc,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: { canonical: canonicalUrl },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: fullTitle,
      description: desc,
      url: canonicalUrl,
      siteName,
      locale: "vi_VN",
      type,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime  && { modifiedTime }),
      ...(authors       && { authors }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images: [imageUrl],
      site: twitterHandle,
    },
  };
}

// ============================================
// PUBLIC API: tạo metadata từ DB (async, server-only)
// ============================================

export async function createPageMetadata(options: {
  title: string;
  description?: string;
  keywords?: string[];
  path?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  noindex?: boolean;
}): Promise<Metadata> {
  const texts = await fetchSiteTexts();
  return buildMetadata({ ...options, texts });
}

// ============================================
// Predefined metadata cho các trang cố định (async, server-only)
// ============================================

export async function getPageMetadata(
  page: keyof typeof PAGE_DEFS,
  overrides?: Partial<{ title: string; description: string; path: string; keywords: string[]; noindex: boolean; image: string }>
): Promise<Metadata> {
  const texts = await fetchSiteTexts();
  const def   = PAGE_DEFS[page];

  const title    = overrides?.title       ?? (get(def.keyTitle, texts) || def.title);
  const desc     = overrides?.description ?? (def.keyDesc ? get(def.keyDesc, texts) : undefined) ?? def.description ?? '';
  const path     = overrides?.path        ?? def.path;
  const keywords = overrides?.keywords ?? def.keywords;
  const noindex  = overrides?.noindex  ?? def.noindex;
  const image    = overrides?.image ?? (get("seo.og_image", texts) || FALLBACKS["seo.og_image"]!);

  return buildMetadata({ title, description: desc, path, keywords, noindex, image, texts });
}

type PageDef = {
  title: string;
  description?: string;
  path: string;
  keywords?: string[];
  noindex?: boolean;
  keyTitle: string;
  keyDesc?: string;
};

const PAGE_DEFS: Record<string, PageDef> = {
  home: {
    title: "Trang chủ",
    path: "/",
    keywords: ["đồ xa xỉ", "second-hand cao cấp", "túi xách hiệu", "luxury fashion"],
    keyTitle: "page.home.title",
    keyDesc: "seo.default_desc",
  },
  shop: {
    title: "Cửa hàng",
    description: "Khám phá bộ sưu tập đồ xa xỉ pre-loved đã qua xác thực. Túi xách, giày, đồng hồ từ Chanel, Gucci, LV và nhiều thương hiệu khác.",
    path: "/shop",
    keywords: ["cửa hàng", "đồ xa xỉ", "túi xách hiệu", "luxury shop"],
    keyTitle: "page.shop.title",
    keyDesc: "page.shop.desc",
  },
  cart: {
    title: "Giỏ hàng",
    path: "/cart",
    keywords: ["giỏ hàng", "shopping cart", "mua sắm"],
    noindex: true,
    keyTitle: "page.cart.title",
  },
  checkout: {
    title: "Thanh toán",
    path: "/checkout",
    keywords: ["thanh toán", "checkout", "đặt hàng"],
    noindex: true,
    keyTitle: "page.checkout.title",
  },
  checkoutSuccess: {
    title: "Thanh toán thành công",
    path: "/checkout/success",
    keywords: ["thanh toán", "thành công"],
    noindex: true,
    keyTitle: "page.checkout_success.title",
  },
  checkoutFailed: {
    title: "Thanh toán thất bại",
    path: "/checkout/failed",
    keywords: ["thanh toán", "thất bại"],
    noindex: true,
    keyTitle: "page.checkout_failed.title",
  },
  wishlist: {
    title: "Yêu thích",
    path: "/wishlist",
    keywords: ["yêu thích", "wishlist", "sản phẩm yêu thích"],
    noindex: true,
    keyTitle: "page.wishlist.title",
  },
  account: {
    title: "Tài khoản",
    path: "/account",
    keywords: ["tài khoản", "account", "profile"],
    noindex: true,
    keyTitle: "page.account.title",
  },
  orders: {
    title: "Theo dõi đơn hàng",
    path: "/account/orders",
    keywords: ["đơn hàng", "order tracking", "theo dõi"],
    noindex: true,
    keyTitle: "page.orders.title",
  },
  login: {
    title: "Đăng nhập",
    path: "/auth/login",
    keywords: ["đăng nhập", "login", "sign in"],
    noindex: true,
    keyTitle: "page.login.title",
  },
  register: {
    title: "Đăng ký",
    path: "/auth/register",
    keywords: ["đăng ký", "register", "sign up"],
    noindex: true,
    keyTitle: "page.register.title",
  },
  sell: {
    title: "Bán hàng",
    description: "Bán đồ xa xỉ của bạn trên Thrifted. Chúng tôi kiểm định và xác thực sản phẩm để đảm bảo chất lượng.",
    path: "/sell",
    keywords: ["bán hàng", "sell", "secondhand", "đăng sản phẩm"],
    keyTitle: "page.sell.title",
    keyDesc: "page.sell.desc",
  },
  blog: {
    title: "Tin tức",
    description: "Cập nhật tin tức, xu hướng thời trang xa xỉ và tips mua sắm tại Thrifted.",
    path: "/blog",
    keywords: ["blog", "tin tức", "thời trang", "luxury news"],
    keyTitle: "page.blog.title",
    keyDesc: "page.blog.desc",
  },
  contact: {
    title: "Liên hệ",
    description: "Liên hệ với Thrifted. Chúng tôi sẵn sàng hỗ trợ về xác thực, mua bán, hoặc bất kỳ câu hỏi nào.",
    path: "/contact",
    keywords: ["liên hệ", "contact", "hỗ trợ", "chăm sóc khách hàng"],
    keyTitle: "page.contact.title",
    keyDesc: "page.contact.desc",
  },
  search: {
    title: "Tìm kiếm",
    path: "/search",
    keywords: ["tìm kiếm", "search"],
    noindex: true,
    keyTitle: "page.search.title",
  },
  sizeGuide: {
    title: "Hướng dẫn kích thước",
    description: "Hướng dẫn chọn kích thước phù hợp cho túi xách, giày và quần áo xa xỉ.",
    path: "/size-guide",
    keywords: ["kích thước", "size guide", "hướng dẫn"],
    keyTitle: "page.size_guide.title",
    keyDesc: "page.size_guide.desc",
  },
  about: {
    title: "Về chúng tôi",
    path: "/about",
    keywords: ["về chúng tôi", "about", "thrifted"],
    keyTitle: "page.about.title",
    keyDesc: "seo.default_desc",
  },
};

// ============================================
// Dynamic metadata generators (product, blog)
// ============================================

export async function createProductMetadata(product: {
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  price?: number;
  images?: string[];
}): Promise<Metadata> {
  const texts = await fetchSiteTexts();
  const siteName = get("seo.site_name", texts) || FALLBACKS["seo.site_name"]!;
  const defaultDesc = get("seo.default_desc", texts) ?? FALLBACKS["seo.default_desc"]!;

  return buildMetadata({
    title: product.name,
    description: product.description || `${product.name} - Đã qua xác thực tại Thrifted.`,
    path: `/product/${product.name.toLowerCase().replace(/\s+/g, "-")}`,
    keywords: [
      product.name,
      product.brand,
      product.category,
      "đồ xa xỉ",
      "second-hand",
      "authenticated",
    ].filter(Boolean) as string[],
    image: product.images?.[0],
    type: "article",
    texts,
  });
}

export async function createBlogMetadata(post: {
  title: string;
  description: string;
  slug: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  image?: string;
}): Promise<Metadata> {
  const texts = await fetchSiteTexts();
  return buildMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    keywords: [post.title, "blog", "thời trang xa xỉ", "Thrifted"],
    image: post.image,
    type: "article",
    publishedTime: post.publishedTime,
    modifiedTime: post.modifiedTime,
    authors: post.author ? [post.author] : undefined,
    texts,
  });
}

// ============================================
// Root layout metadata (dùng trong layout.tsx)
// ============================================
export async function getRootMetadata(): Promise<Metadata> {
  const texts = await fetchSiteTexts();
  const siteName = get("seo.site_name", texts) || FALLBACKS["seo.site_name"]!;
  const desc     = get("seo.default_desc", texts) ?? FALLBACKS["seo.default_desc"]!;
  const ogImage  = get("seo.og_image", texts) || FALLBACKS["seo.og_image"]!;
  const twitterHandle = get("seo.twitter_handle", texts) || FALLBACKS["seo.twitter_handle"]!;
  const imageUrl = ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`;

  return {
    title: siteName,
    description: desc,
    metadataBase: new URL(SITE_URL),
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    alternates: { canonical: "/" },
    openGraph: {
      title: siteName,
      description: desc,
      url: SITE_URL,
      siteName,
      locale: "vi_VN",
      type: "website",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: desc,
      images: [imageUrl],
      site: twitterHandle,
    },
  };
}
