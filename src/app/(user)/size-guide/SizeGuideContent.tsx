"use client";

import Link from "next/link";
import { useSiteTexts } from "@/lib/site-texts-context";

export function SizeGuideContent() {
  const { get } = useSiteTexts();

  return (
    <div className="max-w-[1440px] mx-auto px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">
          {get("page.size_guide.h1", "Hướng dẫn chọn size")}
        </h1>
        <p className="text-zinc-500 max-w-2xl">
          {get("page.size_guide.subtitle", "Tìm size phù hợp với bảng hướng dẫn chi tiết của chúng tôi. Tất cả số đo theo centimet.")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Clothing Size Guide */}
        <div className="bg-white border border-zinc-200 p-8">
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">
            {get("size_guide.clothing.title", "Size quần áo")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-3 px-4 font-semibold">{get("size_guide.clothing.col1", "Size")}</th>
                  <th className="text-left py-3 px-4 font-semibold">{get("size_guide.clothing.col2", "Vòng ngực (cm)")}</th>
                  <th className="text-left py-3 px-4 font-semibold">{get("size_guide.clothing.col3", "Vòng eo (cm)")}</th>
                  <th className="text-left py-3 px-4 font-semibold">{get("size_guide.clothing.col4", "Vòng mông (cm)")}</th>
                </tr>
              </thead>
              <tbody className="text-zinc-600">
                {[
                  { id: "r1", data: get("size_guide.clothing.xs", "XS, 82-86, 62-66, 88-92") },
                  { id: "r2", data: get("size_guide.clothing.s", "S, 86-90, 66-70, 92-96") },
                  { id: "r3", data: get("size_guide.clothing.m", "M, 90-94, 70-74, 96-100") },
                  { id: "r4", data: get("size_guide.clothing.l", "L, 94-98, 74-78, 100-104") },
                  { id: "r5", data: get("size_guide.clothing.xl", "XL, 98-102, 78-82, 104-108") },
                  { id: "r6", data: get("size_guide.clothing.xxl", "XXL, 102-106, 82-86, 108-112") },
                ].map((row) => {
                  const parts = row.data.split(",").map(s => s.trim());
                  return (
                    <tr key={row.id} className="border-b border-zinc-100">
                      <td className="py-3 px-4 font-medium">{parts[0]}</td>
                      <td className="py-3 px-4">{parts[1]}</td>
                      <td className="py-3 px-4">{parts[2]}</td>
                      <td className="py-3 px-4">{parts[3]}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shoe Size Guide */}
        <div className="bg-white border border-zinc-200 p-8">
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">
            {get("size_guide.shoes.title", "Size giày")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-3 px-4 font-semibold">{get("size_guide.shoes.col1", "US")}</th>
                  <th className="text-left py-3 px-4 font-semibold">{get("size_guide.shoes.col2", "EU")}</th>
                  <th className="text-left py-3 px-4 font-semibold">{get("size_guide.shoes.col3", "UK")}</th>
                  <th className="text-left py-3 px-4 font-semibold">{get("size_guide.shoes.col4", "CM")}</th>
                </tr>
              </thead>
              <tbody className="text-zinc-600">
                {[
                  { id: "s1", data: get("size_guide.shoes.6", "6, 39, 5.5, 24") },
                  { id: "s2", data: get("size_guide.shoes.7", "7, 40, 6.5, 25") },
                  { id: "s3", data: get("size_guide.shoes.8", "8, 41, 7.5, 26") },
                  { id: "s4", data: get("size_guide.shoes.9", "9, 42, 8.5, 27") },
                  { id: "s5", data: get("size_guide.shoes.10", "10, 43, 9.5, 28") },
                  { id: "s6", data: get("size_guide.shoes.11", "11, 44, 10.5, 29") },
                ].map((row) => {
                  const parts = row.data.split(",").map(s => s.trim());
                  return (
                    <tr key={row.id} className="border-b border-zinc-100">
                      <td className="py-3 px-4 font-medium">{parts[0]}</td>
                      <td className="py-3 px-4">{parts[1]}</td>
                      <td className="py-3 px-4">{parts[2]}</td>
                      <td className="py-3 px-4">{parts[3]}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* How to Measure */}
      <section className="bg-white border border-zinc-200 p-8 mb-16">
        <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">
          {get("size_guide.measure.title", "Cách đo")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { 
              n: "1", 
              title: get("size_guide.measure.1.title", "Vòng ngực"), 
              desc: get("size_guide.measure.1.desc", "Đo quanh phần rộng nhất của ngực, giữ thước nằm ngang.") 
            },
            { 
              n: "2", 
              title: get("size_guide.measure.2.title", "Vòng eo"), 
              desc: get("size_guide.measure.2.desc", "Đo quanh phần eo hẹp nhất, giữ thước thoải mái.") 
            },
            { 
              n: "3", 
              title: get("size_guide.measure.3.title", "Vòng mông"), 
              desc: get("size_guide.measure.3.desc", "Đo quanh phần mông rộng nhất, cách eo khoảng 20cm.") 
            },
            { 
              n: "4", 
              title: get("size_guide.measure.4.title", "Chiều dài chân trong"), 
              desc: get("size_guide.measure.4.desc", "Đo từ đáy lót đến cuối chân quần.") 
            },
          ].map((item) => (
            <div key={item.n} className="flex gap-4">
              <div className="w-12 h-12 bg-zinc-100 flex items-center justify-center font-bold text-lg flex-shrink-0">{item.n}</div>
              <div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Size Tips */}
      <section className="bg-zinc-50 p-8">
        <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">
          {get("size_guide.tips.title", "Mẹo chọn size")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>,
              title: get("size_guide.tips.1.title", "Size đồ second-hand"),
              desc: get("size_guide.tips.1.desc", "Đồ vintage và pre-loved có thể sai size. Luôn kiểm tra số đo được cung cấp."),
            },
            {
              icon: <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></>,
              title: get("size_guide.tips.2.title", "Đổi trả"),
              desc: get("size_guide.tips.2.desc", "Nếu size không vừa, bạn có thể đổi trả trong 7 ngày để được hoàn tiền đầy đủ."),
            },
            {
              icon: <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></>,
              title: get("size_guide.tips.3.title", "Cần hỗ trợ?"),
              desc: get("size_guide.tips.3.desc", "Liên hệ bộ phận chăm sóc khách hàng để được tư vấn size cá nhân."),
            },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-red flex-shrink-0">{item.icon}</svg>
              <div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="text-center mt-12">
        <Link href="/shop" className="btn-primary inline-block">
          {get("size_guide.cta", "Bắt đầu mua sắm")}
        </Link>
      </div>
    </div>
  );
}
