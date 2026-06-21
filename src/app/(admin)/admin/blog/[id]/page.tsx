'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getAdminBlogPost, type AdminBlogPost } from '@/lib/api/admin';
import { BlogForm } from '@/components/admin/BlogForm';

export default function EditBlogPage() {
  const params = useParams();
  const id = params.id as string;
  const [post, setPost] = useState<AdminBlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminBlogPost(id)
      .then(setPost)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Lỗi tải'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-zinc-200 rounded w-1/4" />
        <div className="h-96 bg-zinc-100 rounded" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm mb-4">
          {error || 'Không tìm thấy bài viết.'}
        </div>
        <Link href="/admin/blog" className="text-sm text-brand-red hover:underline">← Quay lại danh sách</Link>
      </div>
    );
  }

  return <BlogForm mode="edit" post={post} />;
}
