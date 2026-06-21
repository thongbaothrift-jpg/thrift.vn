import { Suspense } from 'react';
import { getAdminBlogPosts } from '@/lib/api/admin';
import { BlogTableClient } from './BlogTableClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function BlogLoader({ searchParams }: { searchParams: any }) {
  const params = await searchParams;
  const category = (params.category as string) || '';
  const published = (params.published as string) || '';
  const page = parseInt(params.page as string) || 1;
  const limit = 15;

  try {
    const res = await getAdminBlogPosts({ category, published, page, limit });
    return (
      <BlogTableClient 
        initialPosts={res.posts} 
        initialTotal={res.total} 
        initialFilters={{ category, published, page, limit }} 
      />
    );
  } catch (error) {
    console.error("Failed to load blog posts:", error);
    return (
      <div className="p-12 text-center bg-white border border-red-100 rounded-[32px]">
        <p className="text-red-500 font-black uppercase tracking-widest text-xs">Lỗi tải dữ liệu bài viết</p>
        <p className="text-zinc-400 text-xs mt-2 font-medium">Vui lòng kiểm tra lại kết nối và thử lại sau.</p>
      </div>
    );
  }
}

export default async function AdminBlogPage({ searchParams }: PageProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900">Quản lý Blog & Nội dung</h1>
          <p className="text-zinc-500 text-sm font-medium">Viết bài mới, hướng dẫn xác thực và cập nhật tin tức thời trang.</p>
        </div>
      </div>

      <Suspense fallback={
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-white border border-zinc-100 rounded-3xl" />
            ))}
          </div>
          <div className="h-14 bg-white border border-zinc-100 rounded-2xl w-full max-w-xl" />
          <div className="bg-white border border-zinc-100 rounded-[32px] overflow-hidden">
            <div className="h-16 bg-zinc-50 border-b border-zinc-100" />
            <div className="p-6 space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-zinc-50/50 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      }>
        <BlogLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
