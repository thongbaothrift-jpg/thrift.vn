import { Suspense } from 'react';
import { getAdminUsers } from '@/lib/api/admin';
import { UserTableClient } from './UserTableClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function UsersLoader({ searchParams }: { searchParams: any }) {
  const params = await searchParams;
  const role = (params.role as string) || '';
  const search = (params.search as string) || '';
  const page = parseInt(params.page as string) || 1;
  const limit = 15;

  try {
    const res = await getAdminUsers({ role, search, page, limit });
    return (
      <UserTableClient 
        initialUsers={res.users} 
        initialTotal={res.total} 
        initialFilters={{ role, search, page, limit }} 
      />
    );
  } catch (error) {
    console.error("Failed to load users:", error);
    return (
      <div className="p-12 text-center bg-white border border-red-100 rounded-[32px]">
        <p className="text-red-500 font-black uppercase tracking-widest text-xs">Lỗi tải dữ liệu người dùng</p>
        <p className="text-zinc-400 text-xs mt-2 font-medium">Vui lòng kiểm tra lại kết nối và thử lại sau.</p>
      </div>
    );
  }
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900">Quản lý Thành viên</h1>
          <p className="text-zinc-500 text-sm font-medium">Theo dõi hoạt động, phân quyền và quản lý hồ sơ khách hàng.</p>
        </div>
      </div>

      <Suspense fallback={
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-white border border-zinc-100 rounded-3xl" />
            ))}
          </div>
          <div className="h-14 bg-white border border-zinc-100 rounded-2xl w-full max-w-md" />
          <div className="bg-white border border-zinc-100 rounded-[32px] overflow-hidden">
            <div className="h-16 bg-zinc-50 border-b border-zinc-100" />
            <div className="p-6 space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-zinc-50/50 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      }>
        <UsersLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
