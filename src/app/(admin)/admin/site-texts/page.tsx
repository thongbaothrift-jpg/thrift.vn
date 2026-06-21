import { Suspense } from 'react';
import { SiteTextsClient } from './SiteTextsClient';

export const dynamic = 'force-dynamic';

async function SiteTextsLoader() {
  return <SiteTextsClient />;
}

export default async function AdminSiteTextsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900">Quản lý Nội dung</h1>
        <p className="text-zinc-500 text-sm font-medium">Chỉnh sửa các text hiển thị trên website: hotline, thông báo, chính sách, thông tin liên hệ.</p>
      </div>

      <Suspense fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-12 bg-white border border-zinc-100 rounded-2xl" />
          <div className="h-96 bg-white border border-zinc-100 rounded-2xl" />
        </div>
      }>
        <SiteTextsLoader />
      </Suspense>
    </div>
  );
}
