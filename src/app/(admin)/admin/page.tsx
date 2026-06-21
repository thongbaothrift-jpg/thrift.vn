import { Suspense } from 'react';
import { getDashboardStats } from '@/lib/api/admin';
import { DashboardContentClient } from './DashboardContentClient';

export const dynamic = 'force-dynamic';

async function DashboardStatsLoader() {
  try {
    const stats = await getDashboardStats();
    return <DashboardContentClient stats={stats} />;
  } catch (error) {
    console.error("Failed to load dashboard stats:", error);
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
        Lỗi tải dữ liệu Dashboard. Vui lòng làm mới trang.
      </div>
    );
  }
}

export default async function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase tracking-tight">Dashboard</h1>
      </div>

      <Suspense fallback={
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-zinc-200 p-5 animate-pulse h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white border border-zinc-200 p-5 animate-pulse h-64" />
            ))}
          </div>
        </div>
      }>
        <DashboardStatsLoader />
      </Suspense>
    </div>
  );
}
