'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createBlogPost, updateBlogPost, type AdminBlogPost } from '@/lib/api/admin';
import { convertDriveLink } from '@/lib/utils';

const HugeRTEEditor = dynamic(
  () => import('@/components/HugeRTEEditor').then((m) => m.HugeRTEEditor),
  {
    ssr: false,
    loading: () => (
      <div className="border border-zinc-300 rounded-md overflow-hidden">
        <div className="bg-zinc-50 h-[450px] animate-pulse flex items-center justify-center">
          <span className="text-sm text-zinc-400">Đang tải editor...</span>
        </div>
      </div>
    ),
  }
);

interface Props {
  post?: AdminBlogPost;
  mode: 'create' | 'edit';
}

const CATEGORIES = [
  { value: 'FASHION', label: 'Fashion' },
  { value: 'AUTHENTIC_GUIDE', label: 'Hướng dẫn xác thực' },
  { value: 'NEWS', label: 'Tin tức' },
  { value: 'LIFESTYLE', label: 'Lifestyle' },
];

interface FormData {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string;
  readTime: string;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
}

export function BlogForm({ post, mode }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormData>({
    title: post?.title || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    coverImage: post?.coverImage || '',
    category: post?.category || 'FASHION',
    tags: post?.tags?.join(', ') || '',
    readTime: post?.readTime?.toString() || '',
    published: post?.published || false,
    seoTitle: post?.seoTitle || '',
    seoDescription: post?.seoDescription || '',
  });

  const set = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim() || !form.category) {
      setError('Tiêu đề, nội dung và danh mục là bắt buộc.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim() || null,
      content: form.content.trim(),
      coverImage: convertDriveLink(form.coverImage.trim()) || '',
      category: form.category,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      readTime: form.readTime ? parseInt(form.readTime) : null,
      published: form.published,
      seoTitle: form.seoTitle.trim() || null,
      seoDescription: form.seoDescription.trim() || null,
    };

    try {
      if (mode === 'create') {
        await createBlogPost(payload);
      } else {
        await updateBlogPost(post!.id, payload);
      }
      router.push('/admin/blog');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi lưu bài viết');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title & Content */}
          <div className="bg-white border border-zinc-200 p-5">
            <h3 className="text-sm font-semibold text-black mb-4">Nội dung bài viết</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Tiêu đề <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  className="input-field"
                  placeholder="VD: Cách nhận biết túi xách LV chính hãng"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Mô tả ngắn (excerpt)
                </label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => set('excerpt', e.target.value)}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Mô tả ngắn hiển thị trong danh sách bài viết..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Nội dung <span className="text-brand-red">*</span>
                </label>
                <HugeRTEEditor
                  value={form.content}
                  onChange={(html) => set('content', html)}
                  placeholder="Nhập nội dung bài viết..."
                  minHeight={450}
                />
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div className="bg-white border border-zinc-200 p-5">
            <h3 className="text-sm font-semibold text-black mb-4">Ảnh bìa</h3>
            <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
              URL ảnh bìa
            </label>
            <input
              type="url"
              value={form.coverImage}
              onChange={(e) => set('coverImage', e.target.value)}
              className="input-field"
              placeholder="https://drive.google.com/uc?id=..."
            />
            {form.coverImage && (
              <div className="mt-3 w-full h-40 bg-zinc-100 rounded overflow-hidden relative">
                <Image key={form.coverImage} src={convertDriveLink(form.coverImage)} alt="Cover preview" fill className="object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </div>

          {/* SEO */}
          <div className="bg-white border border-zinc-200 p-5">
            <h3 className="text-sm font-semibold text-black mb-4">SEO</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={form.seoTitle}
                  onChange={(e) => set('seoTitle', e.target.value)}
                  className="input-field"
                  placeholder="Tiêu đề hiển thị trên Google (tối đa 60 ký tự)"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  SEO Description
                </label>
                <textarea
                  value={form.seoDescription}
                  onChange={(e) => set('seoDescription', e.target.value)}
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Mô tả hiển thị trên Google (tối đa 160 ký tự)"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Publish settings */}
          <div className="bg-white border border-zinc-200 p-5">
            <h3 className="text-sm font-semibold text-black mb-4">Cài đặt</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Danh mục <span className="text-brand-red">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  className="input-field text-sm"
                  required
                >
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Thời gian đọc (phút)
                </label>
                <input
                  type="number"
                  value={form.readTime}
                  onChange={(e) => set('readTime', e.target.value)}
                  className="input-field text-sm"
                  placeholder="VD: 5"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Tags (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => set('tags', e.target.value)}
                  className="input-field text-sm"
                  placeholder="VD: luxury, authentic, tips"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                <div>
                  <p className="text-sm font-medium text-black">Xuất bản ngay</p>
                  <p className="text-xs text-zinc-400">
                    {form.published ? 'Bài viết sẽ được hiển thị' : 'Lưu thành nháp'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => set('published', !form.published)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.published ? 'bg-black' : 'bg-zinc-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.published ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="space-y-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full btn-primary text-xs py-3 text-center disabled:opacity-60"
            >
              {saving ? 'Đang lưu...' : mode === 'create' ? 'Xuất bản bài viết' : 'Lưu thay đổi'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/blog')}
              className="w-full border border-zinc-300 text-zinc-600 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest hover:bg-zinc-50 transition-colors"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
