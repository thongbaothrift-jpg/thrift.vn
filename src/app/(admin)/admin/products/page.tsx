import { Suspense } from 'react';
import { getAdminProducts } from '@/lib/api/admin';
import { ProductTableClient } from './ProductTableClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function ProductsList({ searchParams }: { searchParams: any }) {
  const params = await searchParams;
  const status = (params.status as string) || '';
  const search = (params.search as string) || '';
  const page = parseInt(params.page as string) || 1;
  const limit = 15;

  try {
    const res = await getAdminProducts({ status, search, page, limit });
    return (
      <ProductTableClient 
        initialProducts={res.products} 
        initialTotal={res.total} 
        initialFilters={{ status, search, page, limit }} 
      />
    );
  } catch (error) {
    console.error("Failed to load admin products:", error);
    return <div className="p-8 text-center text-red-500 bg-white border border-red-100">Lỗi tải dữ liệu sản phẩm. Vui lòng thử lại.</div>;
  }
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900">Kho hàng Sản phẩm</h1>
        <p className="text-zinc-500 text-sm font-medium">Quản lý tồn kho, giá bán và thông tin chi tiết sản phẩm.</p>
      </div>
      
      <Suspense fallback={
        <div className="space-y-8 animate-pulse">
          <div className="h-16 bg-white border border-zinc-100 rounded-2xl w-full max-w-xl" />
          <div className="bg-white border border-zinc-100 rounded-[32px] overflow-hidden">
            <div className="h-16 bg-zinc-50 border-b border-zinc-100" />
            <div className="p-6 space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-16 bg-zinc-50/50 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      }>
        <ProductsList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
