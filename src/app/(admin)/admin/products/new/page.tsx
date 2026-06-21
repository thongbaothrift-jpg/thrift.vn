import { Suspense } from 'react';
import { ProductForm } from "@/components/admin/ProductForm";
import { getAdminProduct } from '@/lib/api/admin';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ cloneFrom?: string }>;
}

async function NewProductLoader({ searchParams }: { searchParams: any }) {
  const { cloneFrom } = await searchParams;
  let clonedProduct = undefined;
  
  if (cloneFrom) {
    try {
      clonedProduct = await getAdminProduct(cloneFrom);
    } catch (e) {
      // Ignore if not found
    }
  }

  return <ProductForm mode="create" product={clonedProduct} />;
}

export default async function NewProductPage({ searchParams }: PageProps) {
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
          </div>
        </div>
      }>
        <NewProductLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
