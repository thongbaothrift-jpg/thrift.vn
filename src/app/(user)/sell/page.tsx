"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { SellPageSkeleton } from "@/components/Skeleton";
import { getPublicSiteTexts } from "@/lib/api";

function SellContent() {
  const [loading, setLoading] = useState(true);
  const [siteTexts, setSiteTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    getPublicSiteTexts().then((texts) => {
      if (isMounted) {
        setSiteTexts(texts || {});
        setTimeout(() => setLoading(false), 300);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 },
    );

    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [loading]);

  if (loading) {
    return <SellPageSkeleton />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero - Static Gradient: Pink top-left → White bottom */}
      <section className="relative min-s-screen flex items-center justify-center">
        {/* Static gradient: pink glow top-left, white at bottom */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(160deg, rgba(254,205,211,0.4) 0%, rgba(254,205,211,0.15) 20%, rgba(254,205,211,0.05) 40%, transparent 70%, white 100%)",
          }}
        />

        <div className="relative max-w-2xl mx-auto px-4 md:px-8 text-center py-10 md:py-24">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-500 mb-4 block reveal">
            Dịch vụ ký gửi cao cấp
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase mb-4 tracking-tight reveal">
            Sell with{" "}
            <span className="text-red-500">
              {siteTexts["brand.shop_name"] || "THRIFT.VN"} Việt Nam
            </span>
          </h1>
          <p className="text-base text-zinc-600 mb-10 reveal">
            Gửi đồ — chúng tôi định giá, chụp ảnh, và bán giúp bạn.
          </p>
          <div className="reveal">
            <Link
              href="/sell/form"
              className="inline-block bg-red-500 text-white px-12 py-4 font-bold uppercase text-xs tracking-widest hover:bg-black transition-colors"
            >
              Bắt đầu ngay
            </Link>
          </div>
        </div>
      </section>

      {/* Process Section - Floating Cards */}
      <section className="py-8 md:py-16 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400 mb-12 reveal">
            {siteTexts["sell_process_heading"] || "Quy trình đơn giản"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                num: "01",
                title: siteTexts["sell_process_1_title"] || "Gửi đồ của bạn",
                text:
                  siteTexts["sell_process_1_desc"] ||
                  "Đóng gói và Shipper chúng tôi sẽ đến lấy hàng tại nhà bạn. Miễn phí giao hàng đơn từ 2 sản phẩm",
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" x2="12" y1="3" y2="15" />
                  </svg>
                ),
              },
              {
                num: "02",
                title:
                  siteTexts["sell_process_2_title"] || "Chúng tôi chụp ảnh",
                text:
                  siteTexts["sell_process_2_desc"] ||
                  "Đội ngũ chuyên nghiệp của chúng tôi sẽ chụp ảnh sản phẩm với chất lượng cao nhất.",
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                ),
              },
              {
                num: "03",
                title:
                  siteTexts["sell_process_3_title"] || "Xác thực & định giá",
                text:
                  siteTexts["sell_process_3_desc"] ||
                  "Chúng tôi kiểm tra tính xác thực và đưa ra mức giá hợp lý dựa trên thị trường.",
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                ),
              },
              {
                num: "04",
                title: siteTexts["sell_process_4_title"] || "Bán & nhận tiền",
                text:
                  siteTexts["sell_process_4_desc"] ||
                  "Khi sản phẩm được bán, bạn sẽ nhận được thanh toán ngay lập tức vào tài khoản.",
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                ),
              },
            ].map((step, idx) => (
              <div
                key={idx}
                className="reveal group cursor-pointer"
                style={{ transitionDelay: `${idx * 80}ms` }}
              >
                <div className="bg-white p-6 border border-zinc-100 hover:border-zinc-200 transition-all duration-300 hover:shadow-xl hover:shadow-zinc-200/50 hover:-translate-y-2 hover:scale-[1.02]">
                  <div className="w-14 h-14 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-5 text-red-500 group-hover:bg-red-50 transition-colors">
                    {step.icon}
                  </div>
                  <div className="flex justify-center mb-4">
                    <span className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center text-lg font-bold">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold mb-2 uppercase tracking-wide text-center">
                    {step.title}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed text-center">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="py-10 md:py-16 px-4 md:px-8 bg-zinc-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400 mb-12 reveal">
            {siteTexts["sell_whyus_heading"] || "Tại sao chọn chúng tôi?"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: siteTexts["sell_whyus_1_title"] || "Miễn phí giao hàng",
                desc: siteTexts["sell_whyus_1_desc"] || "Đơn từ 1500K trở lên",
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
                    <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
                    <circle cx="7" cy="18" r="2" />
                    <path d="M15 18H9" />
                    <circle cx="17" cy="18" r="2" />
                  </svg>
                ),
              },
              {
                title:
                  siteTexts["sell_whyus_2_title"] || "Đổi trả trong 7 ngày",
                desc: siteTexts["sell_whyus_2_desc"] || "Chính sách linh hoạt",
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M12 7v5l4 2" />
                  </svg>
                ),
              },
              {
                title:
                  siteTexts["sell_whyus_3_title"] || "Authentic Guaranteed",
                desc: siteTexts["sell_whyus_3_desc"] || "100% hàng chính hãng",
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                ),
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-8 text-center border border-zinc-100 hover:border-zinc-200 hover:shadow-lg hover:shadow-zinc-200/30 hover:-translate-y-1 transition-all duration-300 reveal"
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                  {item.icon}
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wide mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accept / Not Accept */}
      <section className="py-16 px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400 mb-12 reveal">
            Chúng tôi nhận gì?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Accept */}
            <div className="reveal">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[11px] font-bold uppercase tracking-widest text-red-500">
                  Chấp nhận
                </span>
                <div className="flex-1 h-px bg-zinc-200"></div>
              </div>
              <ul className="space-y-4">
                {[
                  "Quần áo và phụ kiện hàng hiệu",
                  "Tình trạng tốt, không có vết bẩn hoặc hư hỏng",
                  "Hàng chính hãng có thể xác thực",
                  "Các thương hiệu phổ biến và cao cấp",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#16a34a"
                        strokeWidth="2.5"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                    <span className="text-xs text-zinc-600 pt-0.5">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Not Accept */}
            <div className="reveal" style={{ transitionDelay: "100ms" }}>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                  Không chấp nhận
                </span>
                <div className="flex-1 h-px bg-zinc-200"></div>
              </div>
              <ul className="space-y-4">
                {[
                  "Hàng giả hoặc không rõ nguồn gốc",
                  "Đồ bị hư hỏng, rách, hoặc có vết bẩn",
                  "Đồ lót và đồ bơi đã qua sử dụng",
                  "Hàng không có thương hiệu rõ ràng",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#71717a"
                        strokeWidth="2"
                      >
                        <path d="m18 6-12 12M6 6l12 12" />
                      </svg>
                    </div>
                    <span className="text-xs text-zinc-500 pt-0.5">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function SellPage() {
  return (
    <Suspense fallback={<SellPageSkeleton />}>
      <SellContent />
    </Suspense>
  );
}
