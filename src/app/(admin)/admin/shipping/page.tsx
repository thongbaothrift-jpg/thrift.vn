import { Suspense } from 'react';
import { getShippingAll, getAdminNotifications } from '@/lib/api/admin';
import { ShippingClient } from './ShippingClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function ShippingData({ searchParams }: { searchParams: any }) {
  const params = await searchParams;
  const tab = (params.tab as string) || 'pending';
  const page = parseInt(params.page as string) || 1;

  // Gọi 1 endpoint duy nhất thay vì 5 endpoint riêng biệt
  const [shippingData, notifications] = await Promise.all([
    getShippingAll(tab, page, 20).catch(() => ({
      summary: { pendingOrders: 0, shippedOrders: 0, returnedOrders: 0, failedNotifs: 0 },
      pendingData: { orders: [], total: 0, page: 1, limit: 20 },
      activeData: { orders: [], total: 0, page: 1, limit: 20 },
      returnedData: { orders: [], total: 0, page: 1, limit: 20 },
    })),
    getAdminNotifications({ limit: 20 }).catch(() => ({ notifications: [], total: 0, unreadCount: 0 })),
  ]);

  return (
    <ShippingClient
      initialTab={tab}
      initialPage={page}
      initialSummary={shippingData.summary}
      pendingData={shippingData.pendingData}
      activeData={shippingData.activeData}
      returnedData={shippingData.returnedData}
      notificationsData={notifications}
    />
  );
}

export default async function AdminShippingPage({ searchParams }: PageProps) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900">Quản lý Vận chuyển</h1>
        <p className="text-zinc-500 text-sm font-medium">SuperShip — theo dõi, tạo vận đơn và xử lý sự cố vận chuyển.</p>
      </div>

      <Suspense fallback={
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white border border-zinc-100 rounded-2xl" />)}
          </div>
          <div className="bg-white border border-zinc-100 rounded-[32px] overflow-hidden">
            <div className="h-16 bg-zinc-50 border-b border-zinc-100" />
            <div className="p-6 space-y-4">
              {[...Array(8)].map((_, i) => <div key={i} className="h-16 bg-zinc-50/50 rounded-2xl" />)}
            </div>
          </div>
        </div>
      }>
        <ShippingData searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
