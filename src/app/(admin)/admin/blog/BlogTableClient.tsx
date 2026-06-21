"use client";

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteBlogPost, updateBlogPost, type AdminBlogPost } from '@/lib/api/admin';
import { Plus, Search, FileText, CheckCircle, Clock, Eye, Trash2, Edit3, ArrowRight, User as UserIcon } from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: '', label: 'Tất cả danh mục' },
  { value: 'FASHION', label: 'Fashion' },
  { value: 'AUTHENTIC_GUIDE', label: 'Hướng dẫn xác thực' },
  { value: 'NEWS', label: 'Tin tức' },
  { value: 'LIFESTYLE', label: 'Lifestyle' },
];

const CATEGORY_LABELS: Record<string, string> = {
  FASHION: 'Fashion',
  AUTHENTIC_GUIDE: 'Guide',
  NEWS: 'News',
  LIFESTYLE: 'Lifestyle',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function BlogTableClient({ 
  initialPosts, 
  initialTotal, 
  initialFilters 
}: { 
  initialPosts: AdminBlogPost[];
  initialTotal: number;
  initialFilters: { category: string; published: string; page: number; limit: number };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [posts, setPosts] = useState<AdminBlogPost[]>(initialPosts);
  const [categoryFilter, setCategoryFilter] = useState(initialFilters.category);
  const [publishedFilter, setPublishedFilter] = useState(initialFilters.published);
  const [actionId, setActionId] = useState<string | null>(null);

  const updateUrl = (overrides: any) => {
    const params = new URLSearchParams();
    const c = overrides.category !== undefined ? overrides.category : categoryFilter;
    const p_status = overrides.published !== undefined ? overrides.published : publishedFilter;
    const p = overrides.page !== undefined ? overrides.page : initialFilters.page;

    if (c) params.set('category', c);
    if (p_status) params.set('published', p_status);
    if (p > 1) params.set('page', p.toString());

    startTransition(() => {
      router.push(`/admin/blog?${params.toString()}`);
    });
  };

  const handleTogglePublish = async (post: AdminBlogPost) => {
    setActionId(post.id);
    try {
      await updateBlogPost(post.id, { published: !post.published });
      setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, published: !p.published } : p));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Lỗi cập nhật');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (post: AdminBlogPost) => {
    if (!confirm(`Xóa bài viết "${post.title}"?`)) return;
    setActionId(post.id);
    try {
      await deleteBlogPost(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Lỗi xóa');
    } finally {
      setActionId(null);
    }
  };

  const totalPages = Math.ceil(initialTotal / initialFilters.limit);

  return (
    <div className={`space-y-6 transition-all duration-300 ${isPending ? 'opacity-50 grayscale-[0.2]' : 'opacity-100'}`}>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-3">Tổng bài viết</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-black leading-none">{initialTotal}</h3>
            <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400">
              <FileText size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-3">Đã xuất bản</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-green-600 leading-none">{posts.filter(p => p.published).length}</h3>
            <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-3">Bản nháp</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-amber-500 leading-none">{posts.filter(p => !p.published).length}</h3>
            <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-3">Lượt xem ước tính</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-black leading-none">1.2k</h3>
            <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400">
              <Eye size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => {
              const val = e.target.value;
              setCategoryFilter(val);
              updateUrl({ category: val, page: 1 });
            }}
            className="px-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-black focus:ring-4 focus:ring-black/5 outline-none shadow-sm cursor-pointer min-w-[200px]"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={publishedFilter}
            onChange={(e) => {
              const val = e.target.value;
              setPublishedFilter(val);
              updateUrl({ published: val, page: 1 });
            }}
            className="px-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-black focus:ring-4 focus:ring-black/5 outline-none shadow-sm cursor-pointer min-w-[160px]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đã đăng</option>
            <option value="false">Bản nháp</option>
          </select>
        </div>

        <Link href="/admin/blog/new" className="bg-black text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2">
          <Plus size={18} />
          Viết bài mới
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Bài viết</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Danh mục</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Tác giả</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Trạng thái</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="max-w-[200px] mx-auto opacity-20">
                      <FileText size={48} className="mx-auto mb-4" />
                      <p className="text-sm font-black uppercase tracking-widest">Không có bài viết</p>
                    </div>
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white border border-zinc-100 rounded-2xl overflow-hidden shrink-0 shadow-sm p-1">
                          {post.coverImage ? (
                            <img src={post.coverImage} alt="" className="w-full h-full object-cover rounded-xl" loading="eager" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-200">
                              <FileText size={24} />
                            </div>
                          )}
                        </div>
                        <div className="max-w-md">
                          <Link href={`/admin/blog/${post.id}`} className="font-black text-black text-sm tracking-tight hover:text-zinc-600 transition-colors line-clamp-1 block">
                            {post.title}
                          </Link>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                            {formatDate(post.createdAt)} • {post.readTime || '5'} phút đọc
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-zinc-50 text-zinc-500 border border-zinc-100">
                        {CATEGORY_LABELS[post.category] || post.category}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-zinc-900 text-white rounded-lg flex items-center justify-center text-[8px] font-black">
                          {post.author.firstName?.[0]}{post.author.lastName?.[0]}
                        </div>
                        <p className="text-xs font-bold text-zinc-600">{post.author.firstName} {post.author.lastName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <button
                        onClick={() => handleTogglePublish(post)}
                        disabled={actionId === post.id}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all ${
                          post.published 
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white'
                        }`}
                      >
                        {post.published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <Link href={`/admin/blog/${post.id}`} className="w-10 h-10 bg-zinc-50 text-zinc-400 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all">
                          <Edit3 size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(post)}
                          disabled={actionId === post.id}
                          className="w-10 h-10 bg-zinc-50 text-zinc-400 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-5 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
              Showing {(initialFilters.page - 1) * initialFilters.limit + 1} to {Math.min(initialFilters.page * initialFilters.limit, initialTotal)} of {initialTotal} Posts
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => updateUrl({ page: initialFilters.page - 1 })}
                disabled={initialFilters.page === 1}
                className="w-10 h-10 border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-400 hover:border-black hover:text-black disabled:opacity-40 transition-all"
              >
                ←
              </button>
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                if (p === 1 || p === totalPages || (p >= initialFilters.page - 1 && p <= initialFilters.page + 1)) {
                  return (
                    <button
                      key={p}
                      onClick={() => updateUrl({ page: p })}
                      className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                        p === initialFilters.page ? 'bg-black text-white shadow-lg shadow-black/10' : 'border border-zinc-200 text-zinc-400 hover:border-black hover:text-black'
                      }`}
                    >
                      {p}
                    </button>
                  );
                }
                if (p === initialFilters.page - 2 || p === initialFilters.page + 2) return <span key={p} className="flex items-end pb-2 text-zinc-300">...</span>;
                return null;
              })}
              <button
                onClick={() => updateUrl({ page: initialFilters.page + 1 })}
                disabled={initialFilters.page === totalPages}
                className="w-10 h-10 border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-400 hover:border-black hover:text-black disabled:opacity-40 transition-all"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
