import { Suspense } from 'react';
import { getAdminBrands } from '@/lib/api';
import { BrandTableClient } from './BrandTableClient';

export const dynamic = 'force-dynamic';

async function BrandsLoader() {
  try {
    const brands = await getAdminBrands();
    return <BrandTableClient initialBrands={brands} />;
  } catch (error) {
    console.error("Failed to load brands:", error);
    return (
      <div className="p-8 text-center text-red-500 bg-white border border-red-100 rounded-2xl">
        Lỗi tải dữ liệu thương hiệu. Vui lòng thử lại.
      </div>
    );
  }
}

export default async function AdminBrandsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900">Quản lý Thương hiệu</h1>
        <p className="text-zinc-500 text-sm font-medium">Quản lý danh sách nhãn hiệu xa xỉ và tối ưu metadata.</p>
      </div>

      <Suspense fallback={
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-28 bg-white border border-zinc-100 rounded-2xl" />
            ))}
          </div>
          <div className="h-16 bg-white border border-zinc-100 rounded-2xl" />
          <div className="h-96 bg-white border border-zinc-100 rounded-2xl" />
        </div>
      }>
        <BrandsLoader />
      </Suspense>
    </div>
  );
}
