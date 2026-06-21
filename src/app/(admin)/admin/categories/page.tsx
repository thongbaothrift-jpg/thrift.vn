import { Suspense } from 'react';
import { getAdminCategories } from '@/lib/api';
import { CategoryTableClient } from './CategoryTableClient';

export const dynamic = 'force-dynamic';

async function CategoriesLoader() {
  try {
    const categories = await getAdminCategories();
    return <CategoryTableClient initialCategories={categories} />;
  } catch (error) {
    console.error("Failed to load categories:", error);
    return (
      <div className="p-8 text-center text-red-500 bg-white border border-red-100 rounded-2xl">
        Lỗi tải dữ liệu danh mục. Vui lòng thử lại.
      </div>
    );
  }
}

export default async function AdminCategoriesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-black">Quản lý Danh mục</h1>
        <p className="text-zinc-500 text-sm font-medium">Quản lý cấu trúc nhóm sản phẩm và tối ưu SEO.</p>
      </div>

      <Suspense fallback={
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white border border-zinc-100 rounded-2xl" />
            ))}
          </div>
          <div className="h-16 bg-white border border-zinc-100 rounded-2xl" />
          <div className="h-96 bg-white border border-zinc-100 rounded-2xl" />
        </div>
      }>
        <CategoriesLoader />
      </Suspense>
    </div>
  );
}
