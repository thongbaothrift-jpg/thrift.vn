"use client";

import { Suspense, useState } from 'react';
import { getAllReviews, type Review } from '@/lib/api/reviews-notifications';
import { CommentsAdminClient } from './CommentsAdminClient';

export const dynamic = 'force-dynamic';

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Review[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loaded) {
    getAllReviews()
      .then((data) => {
        setComments(data);
        setLoaded(true);
      })
      .catch((err: any) => {
        setError(err.message || 'Lỗi tải dữ liệu.');
        setLoaded(true);
      });
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900">Quản lý Bình luận</h1>
        <p className="text-zinc-500 text-sm font-medium">Phản hồi hoặc xóa bình luận của khách hàng về sản phẩm.</p>
      </div>

      {!loaded ? (
        <div className="bg-white border border-zinc-200 rounded-[32px] overflow-hidden">
          <div className="p-6 space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-zinc-50/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-12 text-center bg-white border border-red-100 rounded-[32px]">
          <p className="text-red-500 font-black uppercase tracking-widest text-xs">{error}</p>
          <p className="text-zinc-400 text-xs mt-2 font-medium">Vui lòng đăng nhập và thử lại.</p>
        </div>
      ) : (
        <CommentsAdminClient
          initialComments={comments}
          onUpdate={setComments}
        />
      )}
    </div>
  );
}
