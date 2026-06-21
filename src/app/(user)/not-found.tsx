import Link from "next/link";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "404 - Trang không tìm thấy",
    description: "Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.",
  };
}

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-8">
      <div className="text-center max-w-lg">
        {/* 404 Typography */}
        <div className="mb-8">
          <span className="text-[120px] md:text-[180px] font-black text-zinc-100 leading-none select-none block">
            404
          </span>
          <div className="-mt-8 relative">
            <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight text-black">
              Trang không tìm thấy
            </h1>
          </div>
        </div>

        <p className="text-zinc-500 mb-10 text-base leading-relaxed">
          Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc không còn tồn tại.
          Hãy kiểm tra lại URL hoặc quay về trang chủ.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn-primary">
            Quay về trang chủ
          </Link>
          <Link href="/shop" className="btn-ghost">
            Tiếp tục mua sắm
          </Link>
        </div>

        {/* Suggestions */}
        <div className="mt-16 pt-12 border-t border-zinc-200">
          <p className="text-sm text-zinc-400 mb-4 font-label uppercase tracking-widest">
            Có thể bạn đang tìm
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { label: "Túi xách", href: "/shop?category=bags" },
              { label: "Giày hiệu", href: "/shop?category=shoes" },
              { label: "Đồng hồ", href: "/shop?category=watches" },
              { label: "Khuyến mãi", href: "/shop?filter=hot-deals" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 border border-zinc-200 text-sm text-zinc-600 hover:border-black hover:text-black transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
