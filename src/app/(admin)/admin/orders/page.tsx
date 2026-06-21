import { Suspense } from 'react';
import { getAdminOrders } from '@/lib/api/admin';
import { OrderTableClient } from './OrderTableClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function OrdersList({ searchParams }: { searchParams: any }) {
  const params = await searchParams;
  const status = (params.status as string) || '';
  const search = (params.search as string) || '';
  const page = parseInt(params.page as string) || 1;
  const limit = 15;
  const hasReturnRequest = params.hasReturnRequest === 'true' ? true : undefined;

  try {
    const res = await getAdminOrders({ status, search, page, limit, hasReturnRequest });
    return (
      <OrderTableClient
        initialOrders={res.orders}
        initialTotal={res.total}
        initialFilters={{ status, search, page, limit, hasReturnRequest }}
      />
    );
  } catch (error) {
    console.error("Failed to load admin orders:", error);
    return <div className="p-8 text-center text-red-500 bg-white border border-red-100">Lỗi tải dữ liệu đơn hàng. Vui lòng thử lại.</div>;
  }
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900">Danh sách Đơn hàng</h1>
        <p className="text-zinc-500 text-sm font-medium">Quản lý giao dịch, trạng thái vận chuyển và thanh toán COD.</p>
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
        <OrdersList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
