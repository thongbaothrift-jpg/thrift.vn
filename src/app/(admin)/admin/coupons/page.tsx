import { Suspense } from 'react';
import { getAdminCoupons } from '@/lib/api/admin';
import { CouponTableClient } from './CouponTableClient';

export const dynamic = 'force-dynamic';

async function CouponsLoader() {
  try {
    const res = await getAdminCoupons();
    return <CouponTableClient initialCoupons={res.coupons} total={res.total} />;
  } catch (error) {
    console.error("Failed to load coupons:", error);
    return (
      <div className="p-8 text-center text-red-500 bg-white border border-red-100 rounded-2xl">
        Lỗi tải dữ liệu mã giảm giá. Vui lòng thử lại.
      </div>
    );
  }
}

export default async function AdminCouponsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900">Quản lý Mã giảm giá</h1>
        <p className="text-zinc-500 text-sm font-medium">Tạo và quản lý các chương trình khuyến mãi cho khách hàng.</p>
      </div>

      <Suspense fallback={
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-white border border-zinc-100 rounded-2xl" />
            ))}
          </div>
          <div className="h-16 bg-white border border-zinc-100 rounded-2xl" />
          <div className="h-96 bg-white border border-zinc-100 rounded-2xl" />
        </div>
      }>
        <CouponsLoader />
      </Suspense>
    </div>
  );
}
