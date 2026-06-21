import { Suspense } from 'react';
import { getAdminAttributes } from '@/lib/api';
import { AttributeTableClient } from './AttributeTableClient';

export const dynamic = 'force-dynamic';

async function AttributesLoader() {
  try {
    const attributes = await getAdminAttributes();
    return <AttributeTableClient initialAttributes={attributes} />;
  } catch (error) {
    console.error("Failed to load attributes:", error);
    return (
      <div className="p-8 text-center text-red-500 bg-white border border-red-100 rounded-2xl">
        Lỗi tải dữ liệu thuộc tính. Vui lòng thử lại.
      </div>
    );
  }
}

export default async function AdminAttributesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900">Thuộc tính sản phẩm</h1>
        <p className="text-zinc-500 text-sm font-medium">Quản lý các loại Size, Màu sắc hoặc Chất liệu cho sản phẩm.</p>
      </div>

      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-white border border-zinc-100 rounded-3xl" />
          ))}
        </div>
      }>
        <AttributesLoader />
      </Suspense>
    </div>
  );
}
