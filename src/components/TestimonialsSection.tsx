"use client";

import Image from "next/image";
import { Star, Quote } from "lucide-react";
import { useSiteTexts } from "@/lib/site-texts-context";
import { convertDriveLink } from "@/lib/utils";

interface Testimonial {
  id: number;
  name: string;
  location: string;
  avatar: string;
  rating: number;
  title: string;
  content: string;
  product?: string;
  productCategory?: string;
  productImage?: string;
}


const DEFAULT_TESTIMONIALS = [
  {
    name: "Nguyễn Minh Anh",
    location: "TP. Hồ Chí Minh",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    title: "Tuyệt vời beyond!",
    content: "Đã mua túi xách Gucci từ {shopName} và không thể tin được tình trạng của nó. Y như mới, giá lại rẻ hơn thị trường 40%. Đội ngũ xác thực chuyên nghiệp, giao hàng cực nhanh. Chắc chắn sẽ quay lại!",
    product: "Gucci Marmont Small",
    productCategory: "Túi xách",
    productImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=120&h=120&fit=crop",
  },
  {
    name: "Trần Thu Hà",
    location: "Hà Nội",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    title: "Mua đồ hiệu ở đây quá OK",
    content: "Trước đây luôn lo mua online không biết thật giả thế nào. {shopName} có đội ngũ xác thực chuyên nghiệp, cung cấp đầy đủ thông tin nguồn gốc từng sản phẩm. Đã mua 3 đôi giày và 1 chiếc đồng hồ, tất cả đều chuẩn như mô tả.",
    product: "Nike Air Jordan 1 Retro",
    productCategory: "Giày",
    productImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&h=120&fit=crop",
  },
  {
    name: "Lê Hoàng Nam",
    location: "Đà Nẵng",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    title: "Dịch vụ khách hàng xuất sắc",
    content: "Mình bán đồ trên {shopName}, quy trình rất chuyên nghiệp. Đội ngũ hỗ trợ 24/7, tư vấn định giá chính xác, hàng bán ra trong 48h. Đã kiếm được hơn 30 triệu từ tủ đồ cũ không dùng đến.",
    product: "Louis Vuitton Speedy",
    productCategory: "Túi xách",
    productImage: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=120&h=120&fit=crop",
  },
  {
    name: "Phạm Thị Mai Linh",
    location: "Cần Thơ",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    title: "Đồ hiệu chính hãng, giá cực tốt",
    content: "Đã mua đồng hồ Omega Seamaster từ {shopName}, đợi 1 tuần để xác thực kỹ lưỡng. Khi nhận hàng thì quá ưng ý — y hệt như đồng hồ mới mua ở boutique. Tiết kiệm được gần 50 triệu so với giá chính hãng. Highly recommend!",
    product: "Omega Seamaster",
    productCategory: "Đồng hồ",
    productImage: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=120&h=120&fit=crop",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < rating ? "text-brand-red fill-brand-red" : "text-zinc-300"
          }
        />
      ))}
    </div>
  );
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: Testimonial;
  index: number;
}) {
  return (
    <div
      className="reveal group"
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="bg-white border border-zinc-200 p-8 h-full flex flex-col transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-black/5 relative overflow-hidden">
        {/* Quote icon */}
        <div className="absolute top-6 right-6 opacity-5">
          <Quote size={64} className="text-brand-red" />
        </div>

        {/* Product tag */}
        {testimonial.product && (
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-100">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0">
              <img
                src={convertDriveLink(testimonial.productImage || "")}
                alt={testimonial.product}
                className="w-full h-full object-cover absolute inset-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=120&h=120&fit=crop";
                }}
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-black uppercase tracking-wide">
                {testimonial.product}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {testimonial.productCategory}
              </p>
            </div>
          </div>
        )}

        {/* Rating */}
        <div className="mb-4">
          <StarRating rating={testimonial.rating} />
        </div>

        {/* Title */}
        <h4 className="text-lg font-bold text-black mb-3 leading-tight">
          {testimonial.title}
        </h4>

        {/* Content */}
        <p className="text-zinc-600 text-sm leading-relaxed flex-grow mb-6">
          {testimonial.content}
        </p>

        {/* Author */}
        <div className="flex items-center gap-4 pt-6 border-t border-zinc-100 mt-auto">
          <div className="relative w-11 h-11 rounded-full overflow-hidden bg-zinc-200 flex-shrink-0">
            <img
              src={convertDriveLink(testimonial.avatar || "")}
              alt={testimonial.name}
              className="w-full h-full object-cover absolute inset-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face";
              }}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-black">
              {testimonial.name}
            </p>
            <p className="text-xs text-zinc-500">{testimonial.location}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  const siteTexts = useSiteTexts();
  const shopName = siteTexts.get("brand.shop_name") || "THRIFT.VN";
  const testimonials = Array.from({ length: 4 }).map((_, i) => {
    const id = i + 1;
    const defaultT = DEFAULT_TESTIMONIALS[i];
    
    return {
      id,
      name: siteTexts.get(`testimonials.item${id}.name`) || defaultT.name,
      location: siteTexts.get(`testimonials.item${id}.location`) || defaultT.location,
      avatar: siteTexts.get(`testimonials.item${id}.avatar`) || defaultT.avatar,
      rating: Number(siteTexts.get(`testimonials.item${id}.rating`)) || defaultT.rating,
      title: siteTexts.get(`testimonials.item${id}.title`) || defaultT.title,
      content: (
        siteTexts.get(`testimonials.item${id}.content`) || defaultT.content
      ).replace(/{shopName}/g, shopName),
      product: siteTexts.get(`testimonials.item${id}.product`) || defaultT.product,
      productCategory:
        siteTexts.get(`testimonials.item${id}.product_category`) || defaultT.productCategory,
      productImage:
        siteTexts.get(`testimonials.item${id}.product_image`) || defaultT.productImage,
    };
  });

  return (
    <section className="py-24 bg-white text-black">
      <div className="max-w-[1440px] mx-auto px-8">
        {/* Section Header */}
        <div className="text-center mb-16 reveal">
          <span className="font-label text-brand-red mb-3 block uppercase tracking-widest">
            {siteTexts.get("testimonials.label") || "Đánh giá"}
          </span>
          <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-black mb-4 whitespace-pre-wrap">
            {siteTexts
              .get("testimonials.title")
              ?.replace("{shopName}", shopName) ||
              `Khách hàng nói gì về ${shopName}`}
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto whitespace-pre-wrap">
            {siteTexts
              .get("testimonials.description")
              ?.replace("{shopName}", shopName) ||
              `Hơn 10.000 khách hàng đã tin tưởng mua sắm tại ${shopName}. Đọc những trải nghiệm thực tế từ cộng đồng của chúng tôi.`}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 stagger-reveal">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </div>

        {/* Stats Bar */}
        <div className="mt-20 pt-12 border-t border-zinc-200 grid grid-cols-2 md:grid-cols-4 gap-8 text-center reveal">
          <div>
            <p className="text-4xl font-black text-black mb-2">
              {siteTexts.get("testimonials.stat1.value") || "10K+"}
            </p>
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              {siteTexts.get("testimonials.stat1.label") || "Khách hàng"}
            </p>
          </div>
          <div>
            <p className="text-4xl font-black text-black mb-2">
              {siteTexts.get("testimonials.stat2.value") || "50K+"}
            </p>
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              {siteTexts.get("testimonials.stat2.label") || "Sản phẩm"}
            </p>
          </div>
          <div>
            <p className="text-4xl font-black text-black mb-2">
              {siteTexts.get("testimonials.stat3.value") || "4.9"}
            </p>
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              {siteTexts.get("testimonials.stat3.label") || "Đánh giá TB"}
            </p>
          </div>
          <div>
            <p className="text-4xl font-black text-black mb-2">
              {siteTexts.get("testimonials.stat4.value") || "98%"}
            </p>
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              {siteTexts.get("testimonials.stat4.label") || "Hài lòng"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
