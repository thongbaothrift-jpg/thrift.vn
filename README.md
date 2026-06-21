# LUXE — Hang Hiệu Xá Thật Uy Tín

Website thương mại điện tử bán đồ xa xỉ second-hand (pre-loved) đã qua xác thực. Trang bán hàng **Mộc Street** phục vụ thị trường Việt Nam.

> **Ngôn ngữ:** 100% tiếng Việt (đã dịch hoàn toàn, 2026-04-29).

## Công nghệ

| Thư viện | Phiên bản |
|---|---|
| Next.js | 16.2.4 |
| React | 19.2.4 |
| TypeScript | 5 |
| Tailwind CSS | 4 |

- **Styling**: Tailwind CSS 4 với CSS custom properties
- **Font**: Be Vietnam Pro (Google Fonts)
- **Data**: Mock data tĩnh (không có backend)
- **State**: React Context API (Cart, Wishlist)
- **Animations**: CSS + IntersectionObserver

## Cấu trúc dự án

```
shop-renew-dream/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Trang chủ (/)
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # CSS toàn cục + components
│   │   ├── animations.css         # Animation keyframes
│   │   │
│   │   ├── cart/                # Giỏ hàng
│   │   ├── shop/                 # Danh sách sản phẩm
│   │   ├── product/[id]/         # Chi tiết sản phẩm
│   │   ├── wishlist/             # Yêu thích
│   │   ├── search/                # Tìm kiếm
│   │   ├── blog/                 # Blog list
│   │   ├── blog/[slug]/          # Chi tiết bài blog
│   │   ├── contact/              # Liên hệ
│   │   ├── account/              # Tài khoản (4 tabs)
│   │   ├── size-guide/           # Hướng dẫn size
│   │   ├── auth/login/           # Đăng nhập
│   │   ├── auth/register/        # Đăng ký
│   │   ├── sell/                 # Bán hàng Mộc Street (tiếng Việt)
│   │   ├── sell/form/            # Form bán (3 bước)
│   │   └── sell-flow/           # Flow bán LUXE (5 bước)
│   │
│   ├── components/               # React components
│   │   ├── Header.tsx           # Sticky header + mobile menu
│   │   ├── Footer.tsx           # Footer 4 cột
│   │   ├── ProductCard.tsx       # Card sản phẩm
│   │   ├── CartSlideOver.tsx     # Panel giỏ hàng trượt
│   │   ├── QuickViewModal.tsx    # Modal xem nhanh
│   │   ├── AddToCartButton.tsx   # Nút thêm giỏ + controls
│   │   ├── FilterSidebar.tsx     # Sidebar lọc (chưa dùng)
│   │   ├── FreeShippingBanner.tsx # Banner top + marquee
│   │   ├── PageTransition.tsx    # Animation chuyển trang
│   │   ├── SizeSelector.tsx       # Chọn size
│   │   ├── Skeleton.tsx          # Loading skeletons
│   │   └── index.ts
│   │
│   ├── lib/
│   │   ├── api/                  # Mock API
│   │   │   ├── index.ts          # Product/Brand/Collection API
│   │   │   ├── types.ts          # Shared types
│   │   │   ├── mock-data.ts      # 16 products, 12 brands, 4 collections
│   │   │   └── blog.ts           # Blog API (6 bài, tiếng Việt)
│   │   ├── cart-context.tsx      # Cart state
│   │   ├── wishlist-context.tsx   # Wishlist state (localStorage)
│   │   ├── utils.ts              # Helpers
│   │   └── hooks/
│   │       ├── index.ts
│   │       └── useScrollReveal.ts
│   │
│   └── types/
│       └── index.ts              # Shared types
│
├── public/                       # Static assets (icons)
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── design.md                     # Design system (colors, typography)
└── project-understanding.md      # Tài liệu chi tiết dự án
```

## Các trang

| Route | Mô tả |
|---|---|
| `/` | Trang chủ — Hero, New Arrivals, Hot Deals, Brands |
| `/shop` | Danh sách sản phẩm — filter ngang, URL-driven, sort, pagination |
| `/product/[id]` | Chi tiết sản phẩm — ảnh, giá, size, Add to Cart, sản phẩm liên quan |
| `/cart` | Giỏ hàng — danh sách items, order summary, checkout |
| `/wishlist` | Yêu thích — lưu localStorage, toggle heart |
| `/search` | Tìm kiếm — search bar, popular searches, sort |
| `/blog` | Blog list — featured post, filter category, newsletter |
| `/blog/[slug]` | Chi tiết bài blog — nội dung HTML, tags, share, related |
| `/contact` | Liên hệ — thông tin + form (6 topics) |
| `/sell` | Bán hàng Mộc Street (tiếng Việt) — quy trình 4 bước |
| `/sell/form` | Form bán — 3 bước (loại bán → sản phẩm → liên hệ/gửi) |
| `/sell-flow` | Flow bán LUXE — 5 bước wizard |
| `/account` | Tài khoản — Purchases, Selling, Wishlist, Settings |
| `/auth/login` | Đăng nhập — Google/GitHub OAuth UI |
| `/auth/register` | Đăng ký — validation, terms |
| `/size-guide` | Hướng dẫn size — bảng clothing/shoes, how to measure |

## Scripts

```bash
npm run dev      # Development server → http://localhost:3000
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint check
```

## Design System

- **Màu accent**: `#b61819` (đỏ — CTAs, giá sale)
- **Background**: `#f9f9f9` (off-white)
- **Typography**: Be Vietnam Pro
- **Layout**: max-width 1440px, section gap 8rem
- **Shape**: góc vuông (0px) cho containers/badges; góc tròn cho badges/numbers
