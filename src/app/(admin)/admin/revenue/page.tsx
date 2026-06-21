import { getRevenueData } from '@/lib/api/admin';
import { RevenueClient } from './RevenueClient';

export const dynamic = 'force-dynamic';

async function RevenueContent() {
  try {
    const data = await getRevenueData();
    return <RevenueClient initialData={data} />;
  } catch (error) {
    console.error('Failed to load revenue data:', error);
    return (
      <div className="p-8 text-center text-red-500 bg-white border border-red-100 rounded-2xl">
        Lỗi tải dữ liệu doanh thu. Vui lòng thử lại.
      </div>
    );
  }
}

export default async function AdminRevenuePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900">Doanh thu</h1>
        <p className="text-zinc-500 text-sm font-medium">
          Thống kê doanh thu theo ngày, tháng và năm.
        </p>
      </div>
      <RevenueContent />
    </div>
  );
}
