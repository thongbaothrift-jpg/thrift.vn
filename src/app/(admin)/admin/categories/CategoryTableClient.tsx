"use client";

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Folder,
  Image as ImageIcon,
  LayoutGrid,
  Globe,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/api';
import type { Category } from '@/lib/api/types';
import { convertDriveLink } from '@/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function CategoryTableClient({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with props for SSR
  React.useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    parentId: '',
    seoTitle: '',
    seoDescription: '',
  });

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        image: category.image || '',
        parentId: category.parentId || '',
        seoTitle: category.seoTitle || '',
        seoDescription: category.seoDescription || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        image: '',
        parentId: '',
        seoTitle: '',
        seoDescription: '',
      });
    }
    setIsModalOpen(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await createCategory(formData);
      }
      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi lưu danh mục.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;

    try {
      await deleteCategory(id);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Không thể xóa danh mục này.');
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const parentCategories = categories.filter(c => !c.parentId);

  return (
    <div className="space-y-6">
      {/* Stats/Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <LayoutGrid size={20} />
          </div>
          <p className="text-zinc-500 text-sm font-medium">Tổng danh mục</p>
          <h3 className="text-2xl font-bold mt-1 text-black">{categories.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4">
            <Folder size={20} />
          </div>
          <p className="text-zinc-500 text-sm font-medium">Danh mục chính</p>
          <h3 className="text-2xl font-bold mt-1 text-black">{parentCategories.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
            <Globe size={20} />
          </div>
          <p className="text-zinc-500 text-sm font-medium">Đã tối ưu SEO</p>
          <h3 className="text-2xl font-bold mt-1 text-black">
            {categories.filter(c => (c.seoTitle?.trim() || '') !== '' && (c.seoDescription?.trim() || '') !== '').length}
          </h3>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-sm"
        >
          <Plus size={18} />
          Thêm danh mục
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Danh mục</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Slug</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Cấp độ</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">SEO</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    Chưa có danh mục nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-100 rounded-lg overflow-hidden relative flex-shrink-0 border border-zinc-200">
                          {category.image ? (
                            <Image
                              src={convertDriveLink(category.image)}
                              alt={category.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-400">
                              <ImageIcon size={16} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 text-sm">{category.name}</p>
                          <p className="text-zinc-500 text-[10px] line-clamp-1">{category.description || 'Không có mô tả'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono bg-zinc-100 px-2 py-1 rounded text-zinc-600">
                        /{category.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {category.parentId ? (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase border border-blue-100">Con</span>
                      ) : (
                        <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-bold uppercase border border-zinc-200">Chính</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${category.seoTitle && category.seoDescription ? 'bg-green-500' : 'bg-zinc-200'}`} />
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
                          {category.seoTitle && category.seoDescription ? 'Tối ưu' : 'Chưa'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(category)}
                          className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h2 className="text-xl font-black uppercase tracking-tight text-black">
                {editingCategory ? 'Chỉnh sửa Danh mục' : 'Thêm Danh mục mới'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-bold">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Thông tin cơ bản</h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Tên danh mục *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          name: val,
                          slug: val.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
                        });
                      }}
                      placeholder="VD: Túi xách Luxury"
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Đường dẫn (Slug) *</label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="tui-xach-luxury"
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Danh mục cha</label>
                    <select
                      value={formData.parentId}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/5 appearance-none"
                    >
                      <option value="">Không có (Danh mục chính)</option>
                      {parentCategories
                        .filter(c => c.id !== editingCategory?.id)
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))
                      }
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Hình ảnh & Mô tả</h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Link ảnh Google Drive</label>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="Dán link ảnh..."
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                    {formData.image && (
                      <div className="mt-2 w-full h-32 bg-zinc-100 rounded-xl overflow-hidden relative border border-zinc-200">
                        <Image
                          src={convertDriveLink(formData.image)}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Mô tả</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder="Mô tả cho người dùng..."
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* SEO Section */}
              <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 space-y-6 shadow-inner">
                <div className="flex items-center gap-2 text-black">
                  <Globe size={18} />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest">Tối ưu SEO Google</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">SEO Title</label>
                      <span className={`text-[10px] font-bold ${(formData.seoTitle || '').length > 60 ? 'text-brand-red' : 'text-zinc-400'}`}>
                        {(formData.seoTitle || '').length} / 60
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">SEO Description</label>
                      <span className={`text-[10px] font-bold ${(formData.seoDescription || '').length > 160 ? 'text-brand-red' : 'text-zinc-400'}`}>
                        {(formData.seoDescription || '').length} / 160
                      </span>
                    </div>
                    <textarea
                      value={formData.seoDescription}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-zinc-400 hover:text-black transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="bg-black text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-lg hover:shadow-black/20 disabled:opacity-50"
                >
                  {formLoading ? '...' : (editingCategory ? 'Cập nhật' : 'Tạo mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
