import { Suspense } from "react";
import { getAdminSellRequests, getSellRequestStats } from "@/lib/api/sell";
import { SellRequestTableClient } from "./SellRequestTableClient";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function StatsContent() {
  try {
    const stats = await getSellRequestStats();
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white border border-zinc-200 p-6">
          <p className="font-label text-zinc-500 mb-1 text-[10px] font-bold uppercase tracking-widest">Tổng yêu cầu</p>
          <p className="text-3xl font-black">{stats.totalRequests}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 p-6">
          <p className="font-label text-yellow-600 mb-1 text-[10px] font-bold uppercase tracking-widest">Chờ duyệt</p>
          <p className="text-3xl font-black text-yellow-700">{stats.pendingCount}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-6">
          <p className="font-label text-blue-600 mb-1 text-[10px] font-bold uppercase tracking-widest">Đã duyệt</p>
          <p className="text-3xl font-black text-blue-700">{stats.approvedCount}</p>
        </div>
        <div className="bg-red-50 border border-red-200 p-6">
          <p className="font-label text-red-600 mb-1 text-[10px] font-bold uppercase tracking-widest">Từ chối</p>
          <p className="text-3xl font-black text-red-700">{stats.rejectedCount}</p>
        </div>
        <div className="bg-green-50 border border-green-200 p-6">
          <p className="font-label text-green-600 mb-1 text-[10px] font-bold uppercase tracking-widest">Hoàn thành</p>
          <p className="text-3xl font-black text-green-700">{stats.completedCount}</p>
        </div>
        <div className="bg-white border border-zinc-200 p-6">
          <p className="font-label text-zinc-500 mb-1 text-[10px] font-bold uppercase tracking-widest">Ký gửi</p>
          <p className="text-3xl font-black">
            {stats.bySaleType.find((t) => t.saleType === "CONSIGNMENT")?.count ?? 0}
          </p>
        </div>
      </div>
    );
  } catch (error) {
    return <div className="mb-8 text-red-500 text-sm">Lỗi tải thống kê</div>;
  }
}

async function SellRequestsContent({ searchParams }: { searchParams: any }) {
  const params = await searchParams;
  const status = (params.status as string) || "";
  const saleType = (params.saleType as string) || "";
  const page = parseInt(params.page as string) || 1;

  try {
    const data = await getAdminSellRequests({
      status: status || undefined,
      saleType: saleType || undefined,
      page,
      limit: 20,
    });

    return (
      <SellRequestTableClient
        initialRequests={data.requests}
        initialTotal={data.total}
        initialFilters={{ status, saleType, page }}
      />
    );
  } catch (error) {
    console.error("Failed to load sell requests:", error);
    return (
      <div className="p-8 text-center text-red-500 bg-white border border-red-100 rounded-xl">
        Lỗi tải dữ liệu yêu cầu ký gửi. Vui lòng thử lại sau.
      </div>
    );
  }
}

export default async function AdminSellRequestsPage({ searchParams }: PageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase tracking-tight">Ký gửi / Thu mua</h1>
      </div>

      <Suspense fallback={
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-white border border-zinc-200 rounded-lg" />
          ))}
        </div>
      }>
        <StatsContent />
      </Suspense>

      <Suspense fallback={
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden animate-pulse">
          <div className="h-16 bg-zinc-50 border-b border-zinc-100" />
          <div className="p-6 space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-zinc-50 rounded-lg" />
            ))}
          </div>
        </div>
      }>
        <SellRequestsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
