"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getSiteTexts,
  bulkUpsertSiteTexts,
  upsertSiteText,
  type SiteText,
} from "@/lib/api/admin";
import {
  Save,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Search,
  AlertTriangle,
  Eye,
  Monitor,
  Phone,
  MonitorCheck,
} from "lucide-react";

// ─── Field type helpers ───────────────────────────────────────────────────────

function isUrlField(key: string): boolean {
  if (key === "messenger_link") return false;
  return (
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(key) ||
    key.includes("facebook") ||
    key.includes("instagram") ||
    key.includes("tiktok") ||
    key.includes("og_image") ||
    key.includes("link") ||
    key.includes("url") ||
    key.includes("http")
  );
}

function isEmailField(key: string): boolean {
  return key.includes("email") && !key.includes("email_text");
}

function isPhoneField(key: string): boolean {
  return key.includes("phone") || key.includes("hotline");
}

function getFieldMeta(key: string, label: string) {
  let maxLength: number | undefined;
  let validator: ((v: string) => string | null) | undefined;

  if (key.includes(".title")) {
    maxLength = 60;
    validator = (v) =>
      v.length > 60 ? `Vượt quá 60 ký tự (hiện ${v.length})` : null;
  } else if (key.includes(".desc") || key === "seo.default_desc") {
    maxLength = 160;
    validator = (v) =>
      v.length > 160 ? `Vượt quá 160 ký tự (hiện ${v.length})` : null;
  } else if (isUrlField(key)) {
    validator = (v) => {
      if (!v) return null;
      try {
        const url = new URL(v);
        if (!["http:", "https:"].includes(url.protocol))
          return "Phải bắt đầu bằng http:// hoặc https://";
        return null;
      } catch {
        return "URL không hợp lệ";
      }
    };
  } else if (isEmailField(key)) {
    validator = (v) => {
      if (!v) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(v)) return "Email không hợp lệ";
      return null;
    };
  } else if (isPhoneField(key)) {
    validator = (v) => {
      if (!v) return null;
      const digits = v.replace(/\D/g, "");
      if (digits.length < 9 || digits.length > 12)
        return "Số điện thoại không hợp lệ";
      return null;
    };
  }

  return { maxLength, validator };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Group = {
  id: string;
  label: string;
  icon: string;
  description: string;
  fields: Field[];
};

type Field = {
  key: string;
  label: string;
  description?: string;
  placeholder?: string;
  multiline?: boolean;
  isUrl?: boolean;
};

type EditingMap = Record<string, string>;
type DirtyMap = Record<string, boolean>;
type ValidationMap = Record<string, string | null>;

// ─── Field definitions ────────────────────────────────────────────────────────

const FIELD_GROUPS: Group[] = [
  {
    id: "seo",
    label: "SEO Toàn cục",
    icon: "🔍",
    description:
      "Cấu hình SEO cho toàn bộ website: tên shop, description mặc định, ảnh OG và Twitter Card.",
    fields: [
      {
        key: "seo.site_name",
        label: "Tên website",
        placeholder: "Thrift.vn - Hàng Hiệu Ký Gửi & Săn Đồ Cũ",
      },
      {
        key: "seo.default_desc",
        label: "Mô tả mặc định",
        description: "Dùng làm fallback khi trang không có description riêng",
        placeholder: "Nơi mua bán đồ xa xỉ pre-loved đã qua xác thực...",
        multiline: true,
      },
      {
        key: "seo.og_image",
        label: "Ảnh OG (Open Graph)",
        description:
          "Link ảnh dùng làm thumbnail khi share lên Facebook/Zalo. Kích thước khuyến nghị: 1200x630px",
        placeholder: "https://example.com/og-image.jpg",
        isUrl: true,
      },
      {
        key: "seo.twitter_handle",
        label: "Twitter Handle",
        placeholder: "@thrift.vn",
      },
      {
        key: "page.home.title",
        label: "Title trang chủ",
        placeholder: "Trang chủ",
      },
      {
        key: "page.shop.title",
        label: "Title trang cửa hàng",
        placeholder: "Cửa hàng",
      },
      {
        key: "page.shop.desc",
        label: "Description trang cửa hàng",
        placeholder: "Khám phá bộ sưu tập đồ xa xỉ...",
        multiline: true,
      },
      {
        key: "page.sell.title",
        label: "Title trang bán hàng",
        placeholder: "Bán hàng",
      },
      {
        key: "page.sell.desc",
        label: "Description trang bán hàng",
        placeholder: "Bán đồ xa xỉ của bạn trên Thrift.vn...",
        multiline: true,
      },
      {
        key: "page.blog.title",
        label: "Title trang tin tức",
        placeholder: "Tin tức",
      },
      {
        key: "page.blog.desc",
        label: "Description trang tin tức",
        placeholder: "Cập nhật tin tức, xu hướng thời trang...",
        multiline: true,
      },
      {
        key: "page.contact.title",
        label: "Title trang liên hệ",
        placeholder: "Liên hệ",
      },
      {
        key: "page.contact.desc",
        label: "Description trang liên hệ",
        placeholder: "Liên hệ với Thrift.vn...",
        multiline: true,
      },
      {
        key: "page.about.title",
        label: "Title trang về chúng tôi",
        placeholder: "Về chúng tôi",
      },
      {
        key: "page.size_guide.title",
        label: "Title hướng dẫn size",
        placeholder: "Hướng dẫn kích thước",
      },
      {
        key: "page.size_guide.desc",
        label: "Description hướng dẫn size",
        placeholder: "Hướng dẫn chọn kích thước...",
        multiline: true,
      },
    ],
  },
  {
    id: "brand",
    label: "Thương hiệu",
    icon: "🏪",
    description: "Tên shop, tagline và mô tả hiển thị trên website.",
    fields: [
      { key: "brand.shop_name", label: "Tên shop", placeholder: "THRIFT.VN" },
      {
        key: "brand.tagline",
        label: "Tagline",
        placeholder: "Hàng Hiệu Ký Gửi & Săn Đồ Cũ",
      },
      {
        key: "brand.description",
        label: "Mô tả ngắn",
        placeholder: "Nơi mua bán đồ xa xỉ...",
        multiline: true,
      },
    ],
  },
  {
    id: "contact",
    label: "Liên hệ",
    icon: "📞",
    description:
      "Thông tin liên hệ hiển thị ở footer, checkout và trang liên hệ.",
    fields: [
      { key: "contact.hotline", label: "Hotline", placeholder: "1900 1234" },
      {
        key: "contact.phone",
        label: "Số điện thoại",
        placeholder: "028 1234 5678",
      },
      {
        key: "contact.email",
        label: "Email liên hệ",
        placeholder: "contact@thrift.vn",
      },
      {
        key: "contact.address",
        label: "Địa chỉ",
        placeholder: "88 Lê Lai, Quận 1, TP. HCM",
        multiline: true,
      },
      {
        key: "contact.working_hours",
        label: "Giờ làm việc",
        placeholder: "8h–21h, T2–T7",
      },
    ],
  },
  {
    id: "payment",
    label: "Thanh toán",
    icon: "💳",
    description: "Thông báo hiển thị trong quá trình thanh toán.",
    fields: [
      {
        key: "payment.vnpay_label",
        label: "Nhãn phương thức VNPay",
        placeholder: "VNPay (QR Code / Thẻ ATM)",
      },
      {
        key: "payment.vnpay_desc",
        label: "Mô tả VNPay",
        placeholder: "Thanh toán qua cổng VNPay an toàn và nhanh chóng",
      },
      {
        key: "payment.vnpay_notice",
        label: "Thông báo VNPay",
        description: "Hiển thị khi khách chọn VNPay",
        placeholder:
          "Sau khi xác nhận, bạn sẽ được chuyển đến cổng thanh toán VNPay để hoàn tất.",
        multiline: true,
      },
      {
        key: "payment.bank_transfer_label",
        label: "Nhãn chuyển khoản",
        placeholder: "Chuyển khoản ngân hàng trực tiếp",
      },
      {
        key: "payment.bank_transfer_desc",
        label: "Mô tả chuyển khoản",
        placeholder:
          "Chuyển tiền trực tiếp vào tài khoản THRIFT.VN để được ưu đãi quà tặng",
      },
      {
        key: "payment.bank_transfer_notice",
        label: "Thông báo chuyển khoản",
        placeholder:
          "Vui lòng chuyển khoản theo thông tin bên dưới. Đơn hàng sẽ được xử lý sau khi nhận được thanh toán.",
        multiline: true,
      },
      {
        key: "payment.qr_instruction",
        label: "Hướng dẫn quét QR",
        description: "Hiển thị trên trang VietQR",
        placeholder:
          "Sau khi xác nhận đơn hàng, hệ thống sẽ tạo một mã QR chứa chính xác số tiền và mã đơn hàng của bạn. Bạn chỉ cần mở App ngân hàng quét để thanh toán nhanh chóng.",
        multiline: true,
      },
      {
        key: "payment.deposit_notice",
        label: "Thông báo đặt cọc COD",
        description: "Hiển thị khi đơn hàng COD đầu tiên yêu cầu đặt cọc 10%",
        placeholder:
          "Vì đây là đơn hàng đầu tiên của bạn, vui lòng chuyển khoản đặt cọc 10% để chúng tôi xác nhận đơn hàng COD. Số tiền này sẽ được trừ trực tiếp khi bạn nhận hàng.",
        multiline: true,
      },
    ],
  },
  {
    id: "order",
    label: "Đơn hàng",
    icon: "📦",
    description: "Thông báo gửi khách sau khi đặt hàng thành công.",
    fields: [
      {
        key: "order.confirmation_email_text",
        label: "Text xác nhận email",
        description: "Hiển thị sau khi đặt hàng thành công",
        placeholder:
          "Một email xác nhận đã được gửi đến địa chỉ email của bạn.",
      },
      {
        key: "order.confirmation_message",
        label: "Thông báo xác nhận đơn",
        description: "Hiển thị sau khi đặt hàng",
        placeholder:
          "Nhân viên Thrift.VN sẽ gọi điện xác nhận trong 24h tới.",
      },
      {
        key: "order.tracking_notice",
        label: "Thông báo theo dõi",
        placeholder:
          "Bạn có thể theo dõi tình trạng đơn hàng trong phần Tài khoản.",
      },
      {
        key: "order.success_notice",
        label: "Thông báo thành công",
        description: "Hiển thị trên trang thành công",
        placeholder:
          "Cảm ơn bạn đã mua sắm tại THRIFT.VN. Sản phẩm được bảo hành 6 tháng.",
      },
    ],
  },
  {
    id: "ui",
    label: "Giao diện",
    icon: "🖼️",
    description: "Các nhãn và text hiển thị trên giao diện người dùng.",
    fields: [
      {
        key: "ui.add_to_cart",
        label: "Nút thêm vào giỏ",
        placeholder: "Thêm vào giỏ",
      },
      { key: "ui.sold_out", label: "Text hết hàng", placeholder: "Hết hàng" },
      {
        key: "ui.new_arrival",
        label: "Text hàng mới",
        placeholder: "Hàng mới về",
      },
      {
        key: "ui.tra_cuu_don_hang",
        label: "Menu tra cứu đơn hàng",
        placeholder: "Tra cứu đơn hàng",
      },
      { key: "ui.lien_he", label: "Menu liên hệ", placeholder: "Liên hệ" },
      { key: "ui.gio_hang", label: "Menu giỏ hàng", placeholder: "Giỏ hàng" },
      {
        key: "ui.yeu_thich",
        label: "Menu yêu thích",
        placeholder: "Yêu thích",
      },
      {
        key: "ui.freeship_banner",
        label: "Text Banner Freeship",
        placeholder: "Freeship đơn từ 2 sản phẩm",
      },
    ],
  },
  {
    id: "social",
    label: "Mạng xã hội",
    icon: "🔗",
    description:
      "Link các trang mạng xã hội hiển thị ở footer và trang liên hệ.",
    fields: [
      {
        key: "social.facebook",
        label: "Link Facebook",
        placeholder: "https://facebook.com/...",
        isUrl: true,
      },
      {
        key: "social.instagram",
        label: "Link Instagram",
        placeholder: "https://instagram.com/...",
        isUrl: true,
      },
      {
        key: "social.tiktok",
        label: "Link TikTok",
        placeholder: "https://tiktok.com/@...",
        isUrl: true,
      },
      {
        key: "messenger_link",
        label: "Link nhắn tin Messenger",
        description:
          "Dán link Facebook page hoặc username để hiện nút chat Messenger. VD: https://m.me/username hoặc m.me/113668428313736",
        placeholder: "VD: https://m.me/dreamshopvn hoặc 113668428313736",
        isUrl: false,
      },
    ],
  },
  {
    id: "size_guide",
    label: "Trang Hướng dẫn chọn size",
    icon: "📏",
    description: "Cấu hình text cho trang Hướng dẫn chọn size.",
    fields: [
      {
        key: "page.size_guide.h1",
        label: "Tiêu đề trang",
        placeholder: "Hướng dẫn chọn size",
      },
      {
        key: "page.size_guide.subtitle",
        label: "Mô tả dưới tiêu đề",
        placeholder: "Tìm size phù hợp...",
        multiline: true,
      },

      {
        key: "size_guide.clothing.title",
        label: "Tiêu đề Size quần áo",
        placeholder: "Size quần áo",
      },
      { key: "size_guide.clothing.col1", label: "Cột 1", placeholder: "Size" },
      {
        key: "size_guide.clothing.col2",
        label: "Cột 2",
        placeholder: "Vòng ngực (cm)",
      },
      {
        key: "size_guide.clothing.col3",
        label: "Cột 3",
        placeholder: "Vòng eo (cm)",
      },
      {
        key: "size_guide.clothing.col4",
        label: "Cột 4",
        placeholder: "Vòng mông (cm)",
      },

      {
        key: "size_guide.clothing.xs",
        label: "Thông số hàng 1 (Size, Ngực, Eo, Mông)",
        placeholder: "XS, 82-86, 62-66, 88-92",
      },
      {
        key: "size_guide.clothing.s",
        label: "Thông số hàng 2 (Size, Ngực, Eo, Mông)",
        placeholder: "S, 86-90, 66-70, 92-96",
      },
      {
        key: "size_guide.clothing.m",
        label: "Thông số hàng 3 (Size, Ngực, Eo, Mông)",
        placeholder: "M, 90-94, 70-74, 96-100",
      },
      {
        key: "size_guide.clothing.l",
        label: "Thông số hàng 4 (Size, Ngực, Eo, Mông)",
        placeholder: "L, 94-98, 74-78, 100-104",
      },
      {
        key: "size_guide.clothing.xl",
        label: "Thông số hàng 5 (Size, Ngực, Eo, Mông)",
        placeholder: "XL, 98-102, 78-82, 104-108",
      },
      {
        key: "size_guide.clothing.xxl",
        label: "Thông số hàng 6 (Size, Ngực, Eo, Mông)",
        placeholder: "XXL, 102-106, 82-86, 108-112",
      },

      {
        key: "size_guide.shoes.title",
        label: "Tiêu đề Size giày",
        placeholder: "Size giày",
      },
      { key: "size_guide.shoes.col1", label: "Cột 1", placeholder: "US" },
      { key: "size_guide.shoes.col2", label: "Cột 2", placeholder: "EU" },
      { key: "size_guide.shoes.col3", label: "Cột 3", placeholder: "UK" },
      { key: "size_guide.shoes.col4", label: "Cột 4", placeholder: "CM" },

      {
        key: "size_guide.shoes.6",
        label: "Thông số hàng 1 (US, EU, UK, CM)",
        placeholder: "6, 39, 5.5, 24",
      },
      {
        key: "size_guide.shoes.7",
        label: "Thông số hàng 2 (US, EU, UK, CM)",
        placeholder: "7, 40, 6.5, 25",
      },
      {
        key: "size_guide.shoes.8",
        label: "Thông số hàng 3 (US, EU, UK, CM)",
        placeholder: "8, 41, 7.5, 26",
      },
      {
        key: "size_guide.shoes.9",
        label: "Thông số hàng 4 (US, EU, UK, CM)",
        placeholder: "9, 42, 8.5, 27",
      },
      {
        key: "size_guide.shoes.10",
        label: "Thông số hàng 5 (US, EU, UK, CM)",
        placeholder: "10, 43, 9.5, 28",
      },
      {
        key: "size_guide.shoes.11",
        label: "Thông số hàng 6 (US, EU, UK, CM)",
        placeholder: "11, 44, 10.5, 29",
      },

      {
        key: "size_guide.measure.title",
        label: "Tiêu đề Cách đo",
        placeholder: "Cách đo",
      },
      {
        key: "size_guide.measure.1.title",
        label: "Mục 1 - Tiêu đề",
        placeholder: "Vòng ngực",
      },
      {
        key: "size_guide.measure.1.desc",
        label: "Mục 1 - Mô tả",
        placeholder: "Đo quanh phần rộng nhất...",
        multiline: true,
      },
      {
        key: "size_guide.measure.2.title",
        label: "Mục 2 - Tiêu đề",
        placeholder: "Vòng eo",
      },
      {
        key: "size_guide.measure.2.desc",
        label: "Mục 2 - Mô tả",
        placeholder: "Đo quanh phần eo hẹp nhất...",
        multiline: true,
      },
      {
        key: "size_guide.measure.3.title",
        label: "Mục 3 - Tiêu đề",
        placeholder: "Vòng mông",
      },
      {
        key: "size_guide.measure.3.desc",
        label: "Mục 3 - Mô tả",
        placeholder: "Đo quanh phần mông rộng nhất...",
        multiline: true,
      },
      {
        key: "size_guide.measure.4.title",
        label: "Mục 4 - Tiêu đề",
        placeholder: "Chiều dài chân trong",
      },
      {
        key: "size_guide.measure.4.desc",
        label: "Mục 4 - Mô tả",
        placeholder: "Đo từ đáy lót đến cuối chân quần...",
        multiline: true,
      },

      {
        key: "size_guide.tips.title",
        label: "Tiêu đề Mẹo chọn size",
        placeholder: "Mẹo chọn size",
      },
      {
        key: "size_guide.tips.1.title",
        label: "Mẹo 1 - Tiêu đề",
        placeholder: "Size đồ second-hand",
      },
      {
        key: "size_guide.tips.1.desc",
        label: "Mẹo 1 - Mô tả",
        placeholder: "Đồ vintage và pre-loved có thể sai size...",
        multiline: true,
      },
      {
        key: "size_guide.tips.2.title",
        label: "Mẹo 2 - Tiêu đề",
        placeholder: "Đổi trả",
      },
      {
        key: "size_guide.tips.2.desc",
        label: "Mẹo 2 - Mô tả",
        placeholder: "Nếu size không vừa, bạn có thể đổi trả...",
        multiline: true,
      },
      {
        key: "size_guide.tips.3.title",
        label: "Mẹo 3 - Tiêu đề",
        placeholder: "Cần hỗ trợ?",
      },
      {
        key: "size_guide.tips.3.desc",
        label: "Mẹo 3 - Mô tả",
        placeholder: "Liên hệ bộ phận chăm sóc khách hàng...",
        multiline: true,
      },

      {
        key: "size_guide.cta",
        label: "Nút Call to Action",
        placeholder: "Bắt đầu mua sắm",
      },
    ],
  },

  {
    id: "policy_consignment",
    label: "Trang Chính sách ký gửi",
    icon: "📜",
    description: "Cấu hình tiêu đề, SEO và nội dung trang Chính sách ký gửi.",
    fields: [
      {
        key: "page.policy_consignment.title",
        label: "Title (SEO)",
        placeholder: "Chính sách ký gửi - THRIFT.VN",
      },
      {
        key: "page.policy_consignment.desc",
        label: "Description (SEO)",
        placeholder: "Chính sách ký gửi của THRIFT.VN...",
        multiline: true,
      },
      {
        key: "page.policy_consignment.h1",
        label: "Tiêu đề chính (H1)",
        placeholder: "CHÍNH SÁCH KÝ GỬI",
      },
      {
        key: "policy_page.consignment",
        label: "Nội dung chi tiết",
        placeholder: "Nhập nội dung chi tiết...",
        multiline: true,
      },
    ],
  },
  {
    id: "policy_privacy",
    label: "Trang Chính sách bảo mật",
    icon: "🔒",
    description: "Cấu hình tiêu đề, SEO và nội dung trang Chính sách bảo mật.",
    fields: [
      {
        key: "page.policy_privacy.title",
        label: "Title (SEO)",
        placeholder: "Chính sách bảo mật - THRIFT.VN",
      },
      {
        key: "page.policy_privacy.desc",
        label: "Description (SEO)",
        placeholder: "Chính sách bảo mật của THRIFT.VN...",
        multiline: true,
      },
      {
        key: "page.policy_privacy.h1",
        label: "Tiêu đề chính (H1)",
        placeholder: "CHÍNH SÁCH BẢO MẬT",
      },
      {
        key: "policy_page.privacy",
        label: "Nội dung chi tiết",
        placeholder: "Nhập nội dung chi tiết...",
        multiline: true,
      },
    ],
  },
  {
    id: "policy_sales",
    label: "Trang Chính sách bán hàng",
    icon: "🛍️",
    description: "Cấu hình tiêu đề, SEO và nội dung trang Chính sách bán hàng.",
    fields: [
      {
        key: "page.policy_sales.title",
        label: "Title (SEO)",
        placeholder: "Chính sách bán hàng - THRIFT.VN",
      },
      {
        key: "page.policy_sales.desc",
        label: "Description (SEO)",
        placeholder: "Chính sách bán hàng của THRIFT.VN...",
        multiline: true,
      },
      {
        key: "page.policy_sales.h1",
        label: "Tiêu đề chính (H1)",
        placeholder: "CHÍNH SÁCH BÁN HÀNG",
      },
      {
        key: "policy_page.sales",
        label: "Nội dung chi tiết",
        placeholder: "Nhập nội dung chi tiết...",
        multiline: true,
      },
    ],
  },
  {
    id: "policy_terms",
    label: "Trang Điều khoản dịch vụ",
    icon: "⚖️",
    description: "Cấu hình tiêu đề, SEO và nội dung trang Điều khoản dịch vụ.",
    fields: [
      {
        key: "page.policy_terms.title",
        label: "Title (SEO)",
        placeholder: "Điều khoản dịch vụ - THRIFT.VN",
      },
      {
        key: "page.policy_terms.desc",
        label: "Description (SEO)",
        placeholder: "Điều khoản dịch vụ của THRIFT.VN...",
        multiline: true,
      },
      {
        key: "page.policy_terms.h1",
        label: "Tiêu đề chính (H1)",
        placeholder: "ĐIỀU KHOẢN DỊCH VỤ",
      },
      {
        key: "policy_page.terms",
        label: "Nội dung chi tiết",
        placeholder: "Nhập nội dung chi tiết...",
        multiline: true,
      },
    ],
  },
  {
    id: "sell_page",
    label: "Trang Ký gửi",
    icon: "🤝",
    description: "Nội dung hiển thị trên trang Ký gửi / Thu mua.",
    fields: [
      {
        key: "sell_process_heading",
        label: "Tiêu đề Quy trình",
        placeholder: "Quy trình đơn giản",
      },
      {
        key: "sell_process_1_title",
        label: "Tên Bước 1",
        placeholder: "Gửi đồ của bạn",
      },
      {
        key: "sell_process_1_desc",
        label: "Mô tả Bước 1",
        placeholder:
          "Mang hoặc gửi các món đồ hàng hiệu của bạn đến cửa hàng của chúng tôi.",
        multiline: true,
      },
      {
        key: "sell_process_2_title",
        label: "Tên Bước 2",
        placeholder: "Kiểm định & Định giá",
      },
      {
        key: "sell_process_2_desc",
        label: "Mô tả Bước 2",
        placeholder:
          "Chuyên gia của chúng tôi sẽ xác thực và đề xuất mức giá bán hợp lý nhất.",
        multiline: true,
      },
      {
        key: "sell_process_3_title",
        label: "Tên Bước 3",
        placeholder: "Chụp ảnh & Đăng bán",
      },
      {
        key: "sell_process_3_desc",
        label: "Mô tả Bước 3",
        placeholder:
          "Sản phẩm sẽ được chụp ảnh chuyên nghiệp và đăng bán trên mọi nền tảng.",
        multiline: true,
      },
      {
        key: "sell_process_4_title",
        label: "Tên Bước 4",
        placeholder: "Nhận tiền",
      },
      {
        key: "sell_process_4_desc",
        label: "Mô tả Bước 4",
        placeholder:
          "Nhận thanh toán ngay khi sản phẩm của bạn được giao thành công cho người mua.",
        multiline: true,
      },
      {
        key: "sell_whyus_heading",
        label: "Tiêu đề Tại sao chọn",
        placeholder: "Tại sao chọn chúng tôi?",
      },
      {
        key: "sell_whyus_1_title",
        label: "Thẻ 1 - Tiêu đề",
        placeholder: "Thanh khoản nhanh",
      },
      {
        key: "sell_whyus_1_desc",
        label: "Thẻ 1 - Mô tả",
        placeholder:
          "Với lượng khách hàng sẵn có, sản phẩm của bạn sẽ được bán nhanh chóng.",
        multiline: true,
      },
      {
        key: "sell_whyus_2_title",
        label: "Thẻ 2 - Tiêu đề",
        placeholder: "Chiết khấu hợp lý",
      },
      {
        key: "sell_whyus_2_desc",
        label: "Thẻ 2 - Mô tả",
        placeholder:
          "Phí dịch vụ cạnh tranh, đảm bảo lợi ích tối đa cho người ký gửi.",
        multiline: true,
      },
      {
        key: "sell_whyus_3_title",
        label: "Thẻ 3 - Tiêu đề",
        placeholder: "Bảo quản chuyên nghiệp",
      },
      {
        key: "sell_whyus_3_desc",
        label: "Thẻ 3 - Mô tả",
        placeholder:
          "Sản phẩm được bảo quản cẩn thận trong môi trường tiêu chuẩn.",
        multiline: true,
      },
    ],
  },
  {
    id: "testimonials",
    label: "Đánh giá của khách hàng",
    icon: "🌟",
    description: "Nội dung hiển thị trên phần Đánh giá của khách hàng.",
    fields: [
      {
        key: "testimonials.label",
        label: "Nhãn phụ (Label)",
        placeholder: "Đánh giá",
      },
      {
        key: "testimonials.title",
        label: "Tiêu đề chính",
        placeholder: "Khách hàng nói gì về {shopName}",
      },
      {
        key: "testimonials.description",
        label: "Mô tả",
        placeholder:
          "Hơn 10.000 khách hàng đã tin tưởng mua sắm tại {shopName}. Đọc những trải nghiệm thực tế từ cộng đồng của chúng tôi.",
        multiline: true,
      },
      {
        key: "testimonials.stat1.value",
        label: "Thông số 1 - Giá trị",
        placeholder: "10K+",
      },
      {
        key: "testimonials.stat1.label",
        label: "Thông số 1 - Nhãn",
        placeholder: "Khách hàng",
      },
      {
        key: "testimonials.stat2.value",
        label: "Thông số 2 - Giá trị",
        placeholder: "50K+",
      },
      {
        key: "testimonials.stat2.label",
        label: "Thông số 2 - Nhãn",
        placeholder: "Sản phẩm",
      },
      {
        key: "testimonials.stat3.value",
        label: "Thông số 3 - Giá trị",
        placeholder: "4.9",
      },
      {
        key: "testimonials.stat3.label",
        label: "Thông số 3 - Nhãn",
        placeholder: "Đánh giá TB",
      },
      {
        key: "testimonials.stat4.value",
        label: "Thông số 4 - Giá trị",
        placeholder: "98%",
      },
      {
        key: "testimonials.stat4.label",
        label: "Thông số 4 - Nhãn",
        placeholder: "Hài lòng",
      },
      ...Array.from({ length: 4 }).flatMap((_, i) => {
        const id = i + 1;
        return [
          {
            key: `testimonials.item${id}.name`,
            label: `Người review ${id} - Tên`,
            placeholder: "Nguyễn Văn A",
          },
          {
            key: `testimonials.item${id}.location`,
            label: `Người review ${id} - Địa điểm`,
            placeholder: "TP. Hồ Chí Minh",
          },
          {
            key: `testimonials.item${id}.avatar`,
            label: `Người review ${id} - Ảnh đại diện (URL)`,
            placeholder: "https://...",
            isUrl: true,
          },
          {
            key: `testimonials.item${id}.rating`,
            label: `Người review ${id} - Đánh giá (1-5)`,
            placeholder: "5",
          },
          {
            key: `testimonials.item${id}.title`,
            label: `Người review ${id} - Tiêu đề`,
            placeholder: "Tuyệt vời beyond!",
          },
          {
            key: `testimonials.item${id}.content`,
            label: `Người review ${id} - Nội dung`,
            placeholder: "Đã mua túi xách...",
            multiline: true,
          },
          {
            key: `testimonials.item${id}.product`,
            label: `Người review ${id} - Tên sản phẩm mua`,
            placeholder: "Gucci Marmont Small",
          },
          {
            key: `testimonials.item${id}.product_category`,
            label: `Người review ${id} - Danh mục sản phẩm`,
            placeholder: "Túi xách",
          },
          {
            key: `testimonials.item${id}.product_image`,
            label: `Người review ${id} - Ảnh sản phẩm (URL)`,
            placeholder: "https://...",
            isUrl: true,
          },
        ];
      }),
    ],
  },
];

// ─── SEO Preview ──────────────────────────────────────────────────────────────

function SeoPreview({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const siteName = "thrift.vn";
  const displayTitle = title || "Tiêu đề trang";
  const displayDesc =
    description || "Mô tả trang sẽ hiển thị ở đây khi có nội dung.";

  return (
    <div className="mt-3 p-4 bg-white border border-blue-100 rounded-xl">
      <div className="flex items-center gap-1.5 mb-2">
        <Eye size={12} className="text-blue-500" />
        <span className="text-xs font-bold text-blue-600">
          Xem trước Google
        </span>
      </div>
      <div className="space-y-1">
        <div className="text-lg text-blue-800 hover:underline cursor-pointer leading-tight line-clamp-1">
          {displayTitle.slice(0, 60)}
        </div>
        <div className="text-sm text-green-700 leading-tight">
          {siteName} › {displayTitle.slice(0, 30)}
        </div>
        <div className="text-sm text-zinc-500 leading-snug line-clamp-2">
          {displayDesc.slice(0, 160)}
        </div>
      </div>
    </div>
  );
}

// ─── Live Preview Components ─────────────────────────────────────────────────

// Preview: Header breadcrumb (ui.gio_hang)
function PreviewHeaderBreadcrumb({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
      <span className="hover:text-black transition-colors uppercase tracking-widest font-bold">
        {label}
      </span>
      <span>/</span>
      <span className="text-black font-bold uppercase tracking-widest">
        Thanh toán
      </span>
    </div>
  );
}

// Preview: Checkout step 2 payment method labels
function PreviewPaymentMethods({
  vnpayLabel,
  vnpayDesc,
  bankLabel,
  bankDesc,
}: {
  vnpayLabel: string;
  vnpayDesc: string;
  bankLabel: string;
  bankDesc: string;
}) {
  return (
    <div className="space-y-3">
      {/* <div className="flex items-center gap-3 p-3 border-2 border-black bg-zinc-50 rounded-lg">
        <div className="w-4 h-4 rounded-full border-2 border-black flex items-center justify-center">
          <div className="w-2 w-2 bg-black rounded-full" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-zinc-900 uppercase tracking-wide text-xs">{vnpayLabel || 'VNPay (QR Code / Thẻ ATM)'}</p>
          <p className="text-[10px] text-zinc-500">{vnpayDesc || 'Thanh toán qua cổng VNPay an toàn và nhanh chóng'}</p>
        </div>
      </div> */}
      <div className="flex items-center gap-3 p-3 border border-zinc-200 rounded-lg">
        <div className="w-4 h-4 rounded-full border-2 border-zinc-300 flex items-center justify-center"></div>
        <div className="flex-1">
          <p className="font-bold text-zinc-500 uppercase tracking-wide text-xs">
            {bankLabel || "Chuyển khoản ngân hàng trực tiếp"}
          </p>
          <p className="text-[10px] text-zinc-400">
            {bankDesc ||
              "Chuyển tiền trực tiếp vào tài khoản THRIFT.VN để được ưu đãi quà tặng"}
          </p>
        </div>
      </div>
    </div>
  );
}

// Preview: Checkout VNPay notice box
function PreviewVNPayNotice({ text }: { text: string }) {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg">
      <p className="font-bold flex items-center gap-2 mb-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        Thanh toán qua VNPay
      </p>
      <p>
        {text ||
          "Sau khi xác nhận, bạn sẽ được chuyển đến cổng thanh toán VNPay để hoàn tất."}
      </p>
    </div>
  );
}

// Preview: Order success section
function PreviewOrderSuccess({
  emailText,
  confirmMsg,
  tracking,
}: {
  emailText: string;
  confirmMsg: string;
  tracking: string;
}) {
  return (
    <div className="bg-zinc-50 p-4 border border-zinc-200 rounded-xl space-y-2">
      <p className="text-xs text-zinc-600 leading-relaxed">
        {emailText ||
          "Một email xác nhận đã được gửi đến địa chỉ email của bạn."}
      </p>
      <p className="text-xs text-zinc-600 leading-relaxed">
        {confirmMsg ||
          "Nhân viên Thrift.VN sẽ gọi điện xác nhận trong 24h tới."}
      </p>
      <p className="text-xs text-zinc-600 leading-relaxed">
        {tracking ||
          "Bạn có thể theo dõi tình trạng đơn hàng trong phần Tài khoản."}
      </p>
    </div>
  );
}

// Preview: Footer brand column
function PreviewFooterBrand({
  shopName,
  tagline,
  desc,
}: {
  shopName: string;
  tagline: string;
  desc: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xl font-black tracking-tighter">
        {shopName || "THRIFT.VN"}
      </p>
      <p className="text-xs text-zinc-400 leading-relaxed">
        {desc || "Nơi mua bán đồ xa xỉ..."}
      </p>
    </div>
  );
}

// Preview: Contact info row
function PreviewContactRow({
  hotline,
  phone,
  email,
  address,
  hours,
}: {
  hotline: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
}) {
  return (
    <div className="space-y-2 text-[11px] text-zinc-400">
      <div className="flex items-center gap-2">
        <span className="font-bold text-zinc-300 w-16">Hotline</span>
        <span className="text-zinc-200 font-medium">
          {hotline || "1900 1234"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-zinc-300 w-16">Email</span>
        <span>{email || "contact@thrift.vn"}</span>
      </div>
      <div className="flex items-start gap-2">
        <span className="font-bold text-zinc-300 w-16">Địa chỉ</span>
        <span className="leading-relaxed">
          {address || "88 Lê Lai, Quận 1, TP. HCM"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-zinc-300 w-16">Giờ</span>
        <span>{hours || "8h–21h, T2–T7"}</span>
      </div>
    </div>
  );
}

// Preview: UI badges
function PreviewUIBadges({
  addToCart,
  soldOut,
  newArrival,
  traCuu,
  lienHe,
  gioHang,
  yeuThich,
}: {
  addToCart: string;
  soldOut: string;
  newArrival: string;
  traCuu: string;
  lienHe: string;
  gioHang: string;
  yeuThich: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-full">
        {addToCart || "Thêm vào giỏ"}
      </button>
      <span className="px-3 py-1.5 bg-zinc-200 text-zinc-600 text-xs font-bold rounded-full">
        {soldOut || "Hết hàng"}
      </span>
      <span className="px-3 py-1.5 bg-brand-red text-white text-xs font-bold rounded-full">
        {newArrival || "Hàng mới về"}
      </span>
      <span className="px-3 py-1.5 bg-white border border-zinc-300 text-zinc-600 text-xs font-medium rounded">
        {traCuu || "Tra cứu đơn hàng"}
      </span>
      <span className="px-3 py-1.5 bg-white border border-zinc-300 text-zinc-600 text-xs font-medium rounded">
        {lienHe || "Liên hệ"}
      </span>
      <span className="px-3 py-1.5 bg-white border border-zinc-300 text-zinc-600 text-xs font-medium rounded">
        {gioHang || "Giỏ hàng"}
      </span>
      <span className="px-3 py-1.5 bg-white border border-zinc-300 text-zinc-600 text-xs font-medium rounded">
        {yeuThich || "Yêu thích"}
      </span>
    </div>
  );
}

// ─── Live Preview Panel ───────────────────────────────────────────────────────

type PreviewValues = Record<string, string>;

function LivePreviewPanel({
  groupId,
  values,
}: {
  groupId: string;
  values: PreviewValues;
}) {
  const v = values;

  const renderPreview = () => {
    switch (groupId) {
      case "brand":
        return (
          <div className="space-y-4">
            <div className="bg-black text-white p-6 rounded-xl">
              <PreviewFooterBrand
                shopName={v["brand.shop_name"]}
                tagline={v["brand.tagline"]}
                desc={v["brand.description"]}
              />
            </div>
          </div>
        );

      case "contact":
        return (
          <div className="bg-zinc-900 text-white p-6 rounded-xl">
            <PreviewContactRow
              hotline={v["contact.hotline"]}
              phone={v["contact.phone"]}
              email={v["contact.email"]}
              address={v["contact.address"]}
              hours={v["contact.working_hours"]}
            />
          </div>
        );

      case "payment":
        return (
          <div className="space-y-3">
            <PreviewPaymentMethods
              vnpayLabel={v["payment.vnpay_label"]}
              vnpayDesc={v["payment.vnpay_desc"]}
              bankLabel={v["payment.bank_transfer_label"]}
              bankDesc={v["payment.bank_transfer_desc"]}
            />
            <PreviewVNPayNotice text={v["payment.vnpay_notice"]} />
            {v["payment.bank_transfer_notice"] && (
              <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs rounded-lg">
                <p className="font-bold flex items-center gap-2 mb-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M8 8h.01M16 8h.01M8 16h.01M16 16h.01" />
                  </svg>
                  Quét mã VietQR tự động
                </p>
                <p>{v["payment.bank_transfer_notice"]}</p>
              </div>
            )}
          </div>
        );

      case "order":
        return (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Trang thành công (checkout)
            </p>
            <PreviewOrderSuccess
              emailText={v["order.confirmation_email_text"]}
              confirmMsg={v["order.confirmation_message"]}
              tracking={v["order.tracking_notice"]}
            />
            {v["order.success_notice"] && (
              <div className="p-4 bg-zinc-50 border border-zinc-200 text-zinc-600 text-xs rounded-xl">
                {v["order.success_notice"]}
              </div>
            )}
          </div>
        );

      case "ui":
        return (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Header Navigation
            </p>
            <PreviewHeaderBreadcrumb label={v["ui.gio_hang"] || "Giỏ hàng"} />
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Badges
            </p>
            <PreviewUIBadges
              addToCart={v["ui.add_to_cart"]}
              soldOut={v["ui.sold_out"]}
              newArrival={v["ui.new_arrival"]}
              traCuu={v["ui.tra_cuu_don_hang"]}
              lienHe={v["ui.lien_he"]}
              gioHang={v["ui.gio_hang"]}
              yeuThich={v["ui.yeu_thich"]}
            />
          </div>
        );

      case "social":
        return (
          <div className="bg-black text-white p-6 rounded-xl space-y-4">
            <div className="flex gap-4">
              {v["social.facebook"] ? (
                <a className="w-10 h-10 border border-zinc-700 flex items-center justify-center hover:border-white bg-white/5 transition-all">
                  <span className="text-xs">FB</span>
                </a>
              ) : (
                <div className="w-10 h-10 border border-zinc-800 flex items-center justify-center opacity-30">
                  <span className="text-xs">FB</span>
                </div>
              )}
              {v["social.instagram"] ? (
                <a className="w-10 h-10 border border-zinc-700 flex items-center justify-center hover:border-white bg-white/5 transition-all">
                  <span className="text-xs">IG</span>
                </a>
              ) : (
                <div className="w-10 h-10 border border-zinc-800 flex items-center justify-center opacity-30">
                  <span className="text-xs">IG</span>
                </div>
              )}
              {v["social.tiktok"] ? (
                <a className="w-10 h-10 border border-zinc-700 flex items-center justify-center hover:border-white bg-white/5 transition-all">
                  <span className="text-xs">TT</span>
                </a>
              ) : (
                <div className="w-10 h-10 border border-zinc-800 flex items-center justify-center opacity-30">
                  <span className="text-xs">TT</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-zinc-500">
              {v["social.facebook"] ||
              v["social.instagram"] ||
              v["social.tiktok"]
                ? "Liên kết sẽ hiển thị tại footer website"
                : "Chưa có link — chưa nhập link nào"}
            </p>
            {v["messenger_link"] ? (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="white"
                  >
                    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.26L19.752 8.2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-green-400">
                    Nhắn tin Messenger đang bật
                  </p>
                  <p className="text-[9px] text-zinc-500">
                    Link: {v["messenger_link"]}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="white"
                  >
                    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.26L19.752 8.2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500">
                    Nhắn tin Messenger chưa bật
                  </p>
                  <p className="text-[9px] text-zinc-600">
                    Nhập Facebook Page ID để bật
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case "seo":
        return (
          <div className="space-y-4">
            <SeoPreview
              title={v["page.home.title"] || v["seo.site_name"]}
              description={v["seo.default_desc"]}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="border-t border-dashed border-zinc-200 mt-2">
      {renderPreview()}
    </div>
  );
}

// ─── Field row ────────────────────────────────────────────────────────────────

function FieldRow({
  field,
  value,
  onChange,
  validation,
}: {
  field: Field;
  value: string;
  onChange: (key: string, val: string, error: string | null) => void;
  validation: string | null;
}) {
  const { maxLength, validator } = getFieldMeta(field.key, field.label);
  const hasWarning = maxLength !== undefined && value.length > maxLength * 0.9;
  const charCount = maxLength !== undefined ? value.length : null;
  const isOverLimit = maxLength !== undefined && value.length > maxLength;

  const handleChange = (val: string) => {
    const error = validator ? validator(val) : null;
    onChange(field.key, val, error);
  };

  return (
    <div className="px-6 py-4">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-bold text-zinc-700 mb-1">
            {field.label}
          </label>
          {field.description && (
            <p className="text-xs text-zinc-400 mb-2">{field.description}</p>
          )}

          <div className="relative">
            {field.multiline ? (
              <textarea
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                rows={3}
                placeholder={field.placeholder}
                className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-colors resize-none ${
                  validation
                    ? "border-red-400 bg-red-50 focus:ring-red-200"
                    : isOverLimit
                      ? "border-amber-400 bg-amber-50 focus:ring-amber-200"
                      : hasWarning
                        ? "border-amber-300 bg-amber-50/50 focus:ring-amber-100"
                        : "border-zinc-200 focus:ring-black/10 focus:border-black/20"
                }`}
              />
            ) : (
              <input
                type={field.isUrl ? "url" : "text"}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={field.placeholder}
                className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  validation
                    ? "border-red-400 bg-red-50 focus:ring-red-200"
                    : "border-zinc-200 focus:ring-black/10 focus:border-black/20"
                }`}
              />
            )}

            {/* Character count */}
            {charCount !== null && (
              <div
                className={`absolute bottom-2 right-3 text-xs font-mono ${
                  isOverLimit
                    ? "text-red-500 font-bold"
                    : hasWarning
                      ? "text-amber-500"
                      : "text-zinc-400"
                }`}
              >
                {charCount}/{maxLength}
              </div>
            )}
          </div>

          {/* Validation error */}
          {validation && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600">
              <AlertTriangle size={12} />
              {validation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SiteTextsClient() {
  const [dbTexts, setDbTexts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<EditingMap>({});
  const [dirty, setDirty] = useState<DirtyMap>({});
  const [validations, setValidations] = useState<ValidationMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    brand: true,
  });
  const [search, setSearch] = useState("");
  const [previewGroup, setPreviewGroup] = useState<string | null>(null);

  // Track original DB values (empty string = not in DB, undefined = field not in FIELD_GROUPS)
  const [origins, setOrigins] = useState<Record<string, string>>({});

  const loadTexts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSiteTexts();
      const map: Record<string, string> = {};
      for (const t of data) {
        map[t.key] = t.value;
      }
      setDbTexts(map);

      // For every field in FIELD_GROUPS: show DB value if exists, else use placeholder (mock data)
      const editMap: EditingMap = {};
      const initDirty: DirtyMap = {};
      const originMap: Record<string, string> = {};

      for (const group of FIELD_GROUPS) {
        for (const field of group.fields) {
          const dbVal = map[field.key] ?? "";
          // Use DB value if exists, else leave empty (don't use placeholder as actual value!)
          editMap[field.key] = dbVal;
          originMap[field.key] = dbVal;
          initDirty[field.key] = false;
        }
      }

      setOrigins(originMap);
      setEditing(editMap);
      setDirty(initDirty);
    } catch {
      setError("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTexts();
  }, [loadTexts]);

  const showMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleChange = (
    key: string,
    value: string,
    validationError: string | null,
  ) => {
    setEditing((prev) => ({ ...prev, [key]: value }));
    // Compare against the original DB value (empty string if not in DB)
    const original = origins[key] ?? "";
    setDirty((prev) => ({ ...prev, [key]: value !== original }));
    setValidations((prev) => ({ ...prev, [key]: validationError }));
  };

  const handleSaveGroup = async (groupId: string) => {
    const group = FIELD_GROUPS.find((g) => g.id === groupId);
    if (!group) return;

    const toSave = group.fields
      .filter((f) => dirty[f.key])
      .map((f) => ({ key: f.key, value: editing[f.key] ?? "" }));

    if (toSave.length === 0) {
      showMsg("Không có thay đổi trong mục này.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await bulkUpsertSiteTexts(toSave);
      setDbTexts((prev) => {
        const next = { ...prev };
        for (const item of toSave) next[item.key] = item.value;
        return next;
      });
      setDirty((prev) => {
        const next = { ...prev };
        for (const item of toSave) next[item.key] = false;
        return next;
      });
      showMsg(`Đã lưu ${toSave.length} thay đổi trong "${group.label}"!`);
    } catch (err: any) {
      setError(err.message || "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.values(dirty).some(Boolean);
  const totalChanges = Object.values(dirty).filter(Boolean).length;

  const hasErrors = useMemo(
    () => Object.values(validations).some(Boolean),
    [validations],
  );

  // Filter groups by search
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return FIELD_GROUPS;
    const q = search.toLowerCase();
    return FIELD_GROUPS.map((group) => ({
      ...group,
      fields: group.fields.filter(
        (f) =>
          f.label.toLowerCase().includes(q) ||
          f.key.toLowerCase().includes(q) ||
          (f.description?.toLowerCase().includes(q) ?? false),
      ),
    })).filter((g) => g.fields.length > 0);
  }, [search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500 font-medium">
            Đang tải nội dung...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-10 bg-zinc-50/95 backdrop-blur-sm border-b border-zinc-200 -mx-6 px-6 py-4 flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm trường..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20 transition-colors bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {hasChanges && (
            <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              {totalChanges} thay đổi
            </span>
          )}
          {hasErrors && (
            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full flex items-center gap-1">
              <AlertTriangle size={11} />
              Có lỗi validate
            </span>
          )}
          {hasChanges && (
            <button
              onClick={async () => {
                if (hasErrors) {
                  setError("Vui lòng sửa lỗi validate trước khi lưu.");
                  return;
                }
                setSaving(true);
                setError("");
                try {
                  const allDirty = Object.entries(dirty)
                    .filter(([, d]) => d)
                    .map(([key]) => ({ key, value: editing[key] ?? "" }));
                  if (allDirty.length > 0) {
                    const result = await bulkUpsertSiteTexts(allDirty);
                    setDbTexts((prev) => {
                      const next = { ...prev };
                      for (const item of allDirty) next[item.key] = item.value;
                      return next;
                    });
                    setDirty((prev) => {
                      const next = { ...prev };
                      for (const item of allDirty) next[item.key] = false;
                      return next;
                    });
                    showMsg(`Đã lưu ${result.success} thay đổi!`);
                  }
                } catch (err: any) {
                  setError(err.message || "Lưu thất bại.");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-bold rounded-xl hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              <Save size={15} />
              {saving ? "Đang lưu..." : `Lưu tất cả (${totalChanges})`}
            </button>
          )}
        </div>
      </div>

      {/* Status messages */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 text-sm font-bold rounded-xl animate-fade-in">
          <CheckCircle size={16} />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-xl">
          <XCircle size={16} />
          {error}
        </div>
      )}

      {/* Search result indicator */}
      {search && (
        <div className="text-sm text-zinc-500">
          Tìm thấy{" "}
          <strong>
            {filteredGroups.reduce((acc, g) => acc + g.fields.length, 0)}
          </strong>{" "}
          trường trong <strong>{filteredGroups.length}</strong> nhóm
        </div>
      )}

      {/* Category groups */}
      <div className="space-y-3">
        {filteredGroups.map((group) => {
          const groupDirty = group.fields.some((f) => dirty[f.key]);
          const isOpen = expanded[group.id] ?? false;
          const hasGroupErrors = group.fields.some((f) => !!validations[f.key]);
          const isPreviewing = previewGroup === group.id;

          return (
            <div
              key={group.id}
              className={`bg-white border rounded-2xl overflow-hidden ${
                hasGroupErrors
                  ? "border-red-300 ring-1 ring-red-100"
                  : "border-zinc-200"
              }`}
            >
              {/* Group header */}
              <div
                className="w-full flex items-center gap-3 px-6 py-4 hover:bg-zinc-50 transition-colors text-left"
                onClick={() =>
                  setExpanded((prev) => ({
                    ...prev,
                    [group.id]: !prev[group.id],
                  }))
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    setExpanded((prev) => ({
                      ...prev,
                      [group.id]: !prev[group.id],
                    }));
                }}
              >
                <span className="text-2xl w-8 text-center">{group.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-zinc-900">
                      {group.label}
                    </h3>
                    {groupDirty && (
                      <span
                        className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"
                        title="Có thay đổi chưa lưu"
                      />
                    )}
                    {hasGroupErrors && !groupDirty && (
                      <span
                        className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0"
                        title="Có lỗi validate"
                      />
                    )}
                    <span className="text-xs text-zinc-300">
                      ({group.fields.length} trường)
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {group.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-auto shrink-0">
                  {groupDirty && !hasErrors && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveGroup(group.id);
                      }}
                      disabled={saving || hasErrors}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                    >
                      <Save size={12} />
                      Lưu
                    </button>
                  )}
                  {isOpen && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewGroup(isPreviewing ? null : group.id);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        isPreviewing
                          ? "bg-blue-50 text-blue-600 border border-blue-200"
                          : "bg-zinc-50 text-zinc-500 border border-zinc-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                      }`}
                    >
                      {isPreviewing ? (
                        <MonitorCheck size={12} />
                      ) : (
                        <Monitor size={12} />
                      )}
                      {isPreviewing ? "Ẩn preview" : "Xem preview"}
                    </button>
                  )}
                  {isOpen ? (
                    <ChevronUp size={16} className="text-zinc-400" />
                  ) : (
                    <ChevronDown size={16} className="text-zinc-400" />
                  )}
                </div>
              </div>

              {/* Group fields */}
              {isOpen && (
                <div className="border-t border-zinc-100 divide-y divide-zinc-50">
                  {group.fields.map((field) => (
                    <FieldRow
                      key={field.key}
                      field={field}
                      value={editing[field.key] ?? ""}
                      onChange={handleChange}
                      validation={validations[field.key] ?? null}
                    />
                  ))}

                  {/* Live Preview Panel */}
                  {isPreviewing &&
                    (() => {
                      // Merge: edited value wins if dirty, else keep DB value (avoids blanking fields not yet edited)
                      const merged = { ...dbTexts };
                      for (const key of Object.keys(dirty)) {
                        if (dirty[key]) merged[key] = editing[key];
                      }
                      return (
                        <LivePreviewPanel groupId={group.id} values={merged} />
                      );
                    })()}
                </div>
              )}
            </div>
          );
        })}

        {filteredGroups.length === 0 && (
          <div className="text-center py-12 text-zinc-400">
            <p className="text-lg mb-1">Không tìm thấy trường nào</p>
            <p className="text-sm">Thử từ khóa khác hoặc xóa bộ lọc</p>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-400 text-center pb-4">
        Text sẽ hiển thị ngay trên website sau khi lưu · Validate
        URL/email/phone theo format.
      </p>
    </div>
  );
}
