"use client";

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Globe,
  AlertCircle,
  X,
  Tags,
  MapPin,
  Image as ImageIcon,
} from 'lucide-react';
import {
  createBrand,
  updateBrand,
  deleteBrand,
} from '@/lib/api';
import type { Brand } from '@/lib/api/types';
import { convertDriveLink } from '@/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function BrandTableClient({ initialBrands }: { initialBrands: Brand[] }) {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with props for SSR
  React.useEffect(() => {
    setBrands(initialBrands);
  }, [initialBrands]);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo: '',
    country: '',
    seoTitle: '',
    seoDescription: '',
  });

  const handleOpenModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        name: brand.name || '',
        slug: brand.slug || '',
        description: brand.description || '',
        logo: brand.logo || '',
        country: brand.country || '',
        seoTitle: brand.seoTitle || '',
        seoDescription: brand.seoDescription || '',
      });
    } else {
      setEditingBrand(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        logo: '',
        country: '',
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
      if (editingBrand) {
        await updateBrand(editingBrand.id, formData);
      } else {
        await createBrand(formData);
      }
      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi lưu thương hiệu.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thương hiệu này?')) return;

    try {
      await deleteBrand(id);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Không thể xóa thương hiệu này.');
    }
  };

  const filteredBrands = initialBrands.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-900 text-white rounded-xl flex items-center justify-center">
            <Tags size={24} />
          </div>
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Tổng số thương hiệu</p>
            <h3 className="text-2xl font-black text-black">{initialBrands.length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center">
            <Globe size={24} />
          </div>
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Đã tối ưu SEO</p>
            <h3 className="text-2xl font-black text-black">
              {brands.filter(b => (b.seoTitle?.trim() || '') !== '' && (b.seoDescription?.trim() || '') !== '').length}
            </h3>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm thương hiệu..."
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
          Thêm thương hiệu
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Thương hiệu</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Quốc gia</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">SEO</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 text-sm">
                    Không tìm thấy thương hiệu nào.
                  </td>
                </tr>
              ) : (
                filteredBrands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-zinc-100 rounded-lg overflow-hidden relative p-1 shrink-0">
                          {brand.logo ? (
                            <Image
                              src={convertDriveLink(brand.logo)}
                              alt={brand.name}
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-300">
                              <ImageIcon size={18} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 text-sm">{brand.name}</p>
                          <p className="text-zinc-400 text-[10px] font-mono">/{brand.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-zinc-600 text-sm font-medium">
                        <MapPin size={14} className="text-zinc-400" />
                        {brand.country || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${brand.seoTitle && brand.seoDescription ? 'bg-green-500' : 'bg-zinc-200'}`} />
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
                          {brand.seoTitle && brand.seoDescription ? 'Tối ưu' : 'Chưa'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button
                          onClick={() => handleOpenModal(brand)}
                          className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id)}
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
                {editingBrand ? 'Chỉnh sửa Thương hiệu' : 'Thêm Thương hiệu mới'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-bold leading-none">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Thông tin cơ bản</h3>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Tên thương hiệu *</label>
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
                      placeholder="VD: Hermes"
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Đường dẫn (Slug) *</label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Quốc gia</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="VD: France"
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Hình ảnh & Mô tả</h3>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Logo URL</label>
                    <input
                      type="text"
                      value={formData.logo}
                      onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                      placeholder="Dán link ảnh..."
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                    {formData.logo && (
                      <div className="mt-2 w-20 h-20 bg-white border border-zinc-200 rounded-xl overflow-hidden relative p-1.5">
                        <Image
                          src={convertDriveLink(formData.logo)}
                          alt="Preview"
                          fill
                          className="object-contain"
                          unoptimized
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
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 space-y-6 shadow-inner">
                <div className="flex items-center gap-2 text-black">
                  <Globe size={18} />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest">Tối ưu hóa SEO</h3>
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
                      className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
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
                  className="bg-black text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 shadow-lg hover:shadow-black/20 transition-all disabled:opacity-50"
                >
                  {formLoading ? '...' : (editingBrand ? 'Cập nhật' : 'Tạo mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
