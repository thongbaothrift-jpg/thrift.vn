"use client";

import { useEffect, useState } from "react";

export function AboutContent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-10 md:py-20">
      {/* Hero */}
      <div className="text-center mb-12 md:mb-24">
        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-6">
          THRIFTED
        </h1>
        <p className="text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
          Thương hiệu second-hand cao cấp hàng đầu Việt Nam. Mỗi sản phẩm đều
          qua quy trình xác thực nghiêm ngặt.
        </p>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-12 md:mb-24">
        {[
          {
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
                <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
            ),
            title: "Xác thực chuyên nghiệp",
            desc: "Đội ngũ chuyên gia xác thực hàng hiệu với 5+ năm kinh nghiệm. Mỗi sản phẩm được kiểm tra 12 bước trước khi lên kệ.",
          },
          {
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
                <path d="M4.318 6.318a4.5 4.5 0 0 0 0 6.364L12 20.364l7.682-7.682a4.5 4.5 0 0 0-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 0 0-6.364 0z" />
              </svg>
            ),
            title: "Bền vững & ý nghĩa",
            desc: "Mua bán second-hand là cách tuyệt vời để giảm rác thải thời trang. Mỗi sản phẩm tìm được chủ mới là một hành động xanh.",
          },
          {
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
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
            ),
            title: "Giá trị thật",
            desc: "Sản phẩm hàng hiệu với giá chỉ từ 30-70% giá gốc. Minh bạch về nguồn gốc, tình trạng và giá cả.",
          },
        ].map((item, i) => (
          <div
            key={i}
            className={`text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{ transitionDelay: `${i * 150}ms` }}
          >
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6 text-black">
              {item.icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{item.title}</h3>
            <p className="text-zinc-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Story */}
      <div className="max-w-3xl mx-auto text-center mb-12 md:mb-24">
        <h2 className="text-3xl font-bold mb-8">Câu chuyện của Thrifted</h2>
        <p className="text-zinc-500 leading-relaxed text-lg">
          Khởi nguồn từ niềm đam mê thời trang bền vững, THRIFT.VN ra đời với
          sứ mệnh mang đến cơ hội sở hữu đồ xa xỉ second-hand cho tất cả mọi
          người. Chúng tôi tin rằng mỗi món đồ đều có câu chuyện — và việc trao
          lại nó cho người tiếp theo là cách đẹp nhất để kể tiếp.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 py-8 md:py-16 border-y border-zinc-200 mb-12 md:mb-24">
        {[
          { num: "10,000+", label: "Sản phẩm đã bán" },
          { num: "5,000+", label: "Khách hàng tin tưởng" },
          { num: "98%", label: "Tỷ lệ hài lòng" },
          { num: "3+", label: "Năm kinh nghiệm" },
        ].map((stat, i) => (
          <div key={i} className="text-center">
            <div className="text-4xl font-black mb-2">{stat.num}</div>
            <div className="text-sm text-zinc-500 uppercase tracking-widest font-bold">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="text-zinc-500 mb-8">Sẵn sàng khám phá?</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a href="/shop" className="btn-primary px-10 py-4">
            Khám phá sản phẩm
          </a>
          <a href="/sell" className="btn-ghost px-10 py-4">
            Ký gửi đồ của bạn
          </a>
        </div>
      </div>
    </div>
  );
}
