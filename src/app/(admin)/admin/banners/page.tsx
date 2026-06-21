import { Suspense } from 'react';
import { getAdminBanners } from '@/lib/api';
import { BannerTableClient } from './BannerTableClient';

export const dynamic = 'force-dynamic';

async function BannersLoader() {
  try {
    const banners = await getAdminBanners();
    return <BannerTableClient initialBanners={banners} />;
  } catch (error) {
    console.error("Failed to load banners:", error);
    return (
      <div className="p-8 text-center text-red-500 bg-white border border-red-100 rounded-2xl">
        Lỗi tải dữ liệu banner. Vui lòng thử lại.
      </div>
    );
  }
}

export default async function AdminBannersPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900">Quản lý Banner</h1>
        <p className="text-zinc-500 text-sm font-medium">Quản lý các tấm ảnh quảng cáo trượt ngoài trang chủ.</p>
      </div>

      <Suspense fallback={
        <div className="space-y-6 animate-pulse">
          <div className="flex justify-between">
            <div className="w-48 h-8 bg-zinc-100 rounded-lg" />
            <div className="w-32 h-10 bg-zinc-100 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="aspect-[21/9] bg-white border border-zinc-100 rounded-2xl" />
            ))}
          </div>
        </div>
      }>
        <BannersLoader />
      </Suspense>
    </div>
  );
}
