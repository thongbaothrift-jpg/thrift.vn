"use client";

import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  X, 
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  Edit2
} from 'lucide-react';
import { createBanner, updateBanner, deleteBanner } from '@/lib/api';
import { Banner } from '@/lib/api/types';
import { convertDriveLink } from '@/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function BannerTableClient({ initialBanners }: { initialBanners: Banner[] }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    link: '',
    button1Text: '',
    button1Link: '',
    button2Text: '',
    button2Link: '',
    order: 0,
    isActive: true
  });

  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title || '',
        description: banner.description || '',
        image: banner.image,
        link: banner.link || '',
        button1Text: banner.button1Text || '',
        button1Link: banner.button1Link || '',
        button2Text: banner.button2Text || '',
        button2Link: banner.button2Link || '',
        order: banner.order,
        isActive: banner.isActive
      });
    } else {
      setEditingBanner(null);
      setFormData({ 
        title: '', 
        description: '', 
        image: '', 
        link: '', 
        button1Text: '', 
        button1Link: '', 
        button2Text: '', 
        button2Link: '', 
        order: 0, 
        isActive: true 
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingBanner) {
        await updateBanner(editingBanner.id, formData);
      } else {
        await createBanner(formData);
      }
      setIsModalOpen(false);
      router.refresh();
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu banner');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa banner này?')) return;
    try {
      await deleteBanner(id);
      router.refresh();
    } catch (error) {
      alert('Không thể xóa banner');
    }
  };

  const toggleActive = async (banner: Banner) => {
    const message = !banner.isActive 
      ? `Kích hoạt banner "${banner.title}"?` 
      : `Dừng kích hoạt banner "${banner.title}"?`;

    if (!window.confirm(message)) return;

    try {
      await updateBanner(banner.id, { isActive: !banner.isActive });
      router.refresh();
    } catch (error) {
      console.error('Failed to toggle status', error);
      alert('Lỗi cập nhật trạng thái banner');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Thống kê</p>
          <div className="flex items-center gap-4 text-sm font-black text-black uppercase tracking-tight">
            <span>Tổng {initialBanners.length} Banner</span>
            <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full" />
            <span className="text-green-600">{initialBanners.filter(b => b.isActive).length} Đang chạy</span>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-xl shadow-black/5"
        >
          <Plus size={18} />
          Thêm Banner mới
        </button>
      </div>

      {initialBanners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-100 p-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ImageIcon size={32} className="text-zinc-300" />
          </div>
          <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Chưa có banner nào</h3>
          <p className="text-zinc-500 text-sm font-medium mt-1">Hãy thêm banner đầu tiên để làm đẹp trang chủ của bạn.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialBanners.map((banner) => (
            <div key={banner.id} className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className="relative aspect-[21/9] bg-zinc-50">
                <Image
                  src={(banner.image && (banner.image.startsWith('http') || banner.image.startsWith('/'))) 
                    ? convertDriveLink(banner.image) 
                    : "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80"
                  }
                  alt={banner.title || 'Banner'}
                  fill
                  className="object-cover"
                  unoptimized
                  priority
                />
                <div className="absolute top-3 right-3 flex gap-2 transition-opacity">
                  <button 
                    onClick={() => handleOpenModal(banner)}
                    className="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center text-zinc-600 hover:text-black shadow-lg"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(banner.id)}
                    className="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 shadow-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="absolute top-3 left-3">
                  <button
                    onClick={() => toggleActive(banner)}
                    className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg border-2 border-white/20 ${
                      banner.isActive 
                        ? 'bg-green-500 text-white' 
                        : 'bg-zinc-500/80 text-white backdrop-blur-md'
                    }`}
                  >
                    {banner.isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                    {banner.isActive ? 'Active' : 'Offline'}
                  </button>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-black text-black uppercase tracking-tight truncate text-sm">{banner.title || 'Untitled'}</h3>
                <p className="text-[10px] text-zinc-400 font-medium truncate mt-0.5">{banner.description || 'No description provided'}</p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-50 px-2 py-1 rounded-lg">
                    <ArrowUpDown size={12} />
                    Order: <span className="text-black">{banner.order}</span>
                  </div>
                  {banner.link && (
                    <a 
                      href={banner.link} 
                      target="_blank" 
                      className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink size={10} />
                      View Link
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h2 className="font-black uppercase tracking-tight text-black">
                {editingBanner ? 'Update Banner' : 'Create New Banner'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Banner Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: BST Xuân Hè 2024"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="VD: Mua sắm ngay để nhận ưu đãi..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none min-h-[80px] resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Google Drive Image Link *</label>
                <input
                  type="text"
                  required
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="Dán link ảnh tại đây..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Primary Button</h4>
                  <input
                    type="text"
                    value={formData.button1Text}
                    onChange={(e) => setFormData({ ...formData, button1Text: e.target.value })}
                    placeholder="Text"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                  />
                  <input
                    type="text"
                    value={formData.button1Link}
                    onChange={(e) => setFormData({ ...formData, button1Link: e.target.value })}
                    placeholder="Link (e.g. /shop)"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                  />
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Secondary Button</h4>
                  <input
                    type="text"
                    value={formData.button2Text}
                    onChange={(e) => setFormData({ ...formData, button2Text: e.target.value })}
                    placeholder="Text"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                  />
                  <input
                    type="text"
                    value={formData.button2Link}
                    onChange={(e) => setFormData({ ...formData, button2Link: e.target.value })}
                    placeholder="Link"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 items-end">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Order Number</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-black outline-none"
                  />
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Publish</span>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`w-10 h-5 rounded-full transition-all relative ${formData.isActive ? 'bg-black' : 'bg-zinc-300'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isActive ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl font-black uppercase tracking-widest text-xs text-zinc-400 hover:text-black transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-[2] bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 shadow-xl shadow-black/20 transition-all disabled:opacity-50"
                >
                  {formLoading ? '...' : (editingBanner ? 'Save Changes' : 'Create Banner')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
