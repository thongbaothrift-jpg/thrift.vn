import { Suspense } from 'react';
import Link from 'next/link';
import { getAdminOrder } from '@/lib/api/admin';
import { OrderDetailClient } from './OrderDetailClient';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="p-6">
      <Suspense fallback={
        <div className="space-y-8 animate-pulse max-w-6xl mx-auto">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <div className="h-4 bg-zinc-100 rounded-full w-24" />
              <div className="h-10 bg-zinc-100 rounded-2xl w-64" />
            </div>
            <div className="flex gap-3">
              <div className="h-12 bg-zinc-100 rounded-2xl w-32" />
              <div className="h-12 bg-zinc-100 rounded-2xl w-24" />
            </div>
          </div>
          <div className="h-32 bg-white border border-zinc-100 rounded-[32px]" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[600px] bg-white border border-zinc-100 rounded-[32px]" />
            <div className="space-y-6">
              <div className="h-64 bg-white border border-zinc-100 rounded-[32px]" />
              <div className="h-64 bg-white border border-zinc-100 rounded-[32px]" />
            </div>
          </div>
        </div>
      }>
        <OrderLoader id={id} />
      </Suspense>
    </div>
  );
}

async function OrderLoader({ id }: { id: string }) {
  try {
    const order = await getAdminOrder(id);
    if (!order) throw new Error("Order not found");
    return <OrderDetailClient initialOrder={order} />;
  } catch (error) {
    return (
      <div className="p-12 text-center bg-white border border-red-100 rounded-[32px]">
        <p className="text-red-500 font-black uppercase tracking-widest text-xs">Không tìm thấy đơn hàng</p>
        <p className="text-zinc-400 text-xs mt-2 font-medium">Đơn hàng này không tồn tại hoặc đã bị xóa.</p>
        <Link href="/admin/orders" className="inline-block mt-6 px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
          Quay lại danh sách
        </Link>
      </div>
    );
  }
}
