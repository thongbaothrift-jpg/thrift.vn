import { Suspense } from 'react';
import Link from 'next/link';
import { getAdminProduct } from '@/lib/api/admin';
import { ProductForm } from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function ProductLoader({ params }: { params: any }) {
  const { id } = await params;
  try {
    const product = await getAdminProduct(id);
    if (!product) throw new Error("Product not found");
    return <ProductForm mode="edit" product={product} />;
  } catch (error) {
    return (
      <div className="p-12 text-center bg-white border border-red-100 rounded-[32px]">
        <p className="text-red-500 font-black uppercase tracking-widest text-xs">Không tìm thấy sản phẩm</p>
        <p className="text-zinc-400 text-xs mt-2 font-medium">Sản phẩm này không tồn tại hoặc đã bị xóa.</p>
        <Link href="/admin/products" className="inline-block mt-6 px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
          Quay lại kho hàng
        </Link>
      </div>
    );
  }
}

export default async function EditProductPage({ params }: PageProps) {
  return (
    <div className="p-6">
      <Suspense fallback={
        <div className="space-y-8 animate-pulse max-w-5xl mx-auto">
          <div className="space-y-2">
            <div className="h-4 bg-zinc-100 rounded-full w-24" />
            <div className="h-10 bg-zinc-100 rounded-2xl w-64" />
          </div>
          <div className="bg-white border border-zinc-100 rounded-[32px] p-8 space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="h-4 bg-zinc-50 rounded w-20" />
                <div className="h-12 bg-zinc-50 rounded-2xl" />
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-zinc-50 rounded w-20" />
                <div className="h-12 bg-zinc-50 rounded-2xl" />
              </div>
            </div>
            <div className="h-64 bg-zinc-50 rounded-2xl" />
            <div className="h-12 bg-zinc-900 rounded-2xl w-32 ml-auto" />
          </div>
        </div>
      }>
        <ProductLoader params={params} />
      </Suspense>
    </div>
  );
}
