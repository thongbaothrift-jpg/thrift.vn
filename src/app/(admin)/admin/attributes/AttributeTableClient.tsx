"use client";

import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  X, 
  Settings2,
  Tag,
  ChevronRight,
  Layers
} from 'lucide-react';
import { 
  createAttribute, 
  deleteAttribute, 
  addAttributeValue, 
  deleteAttributeValue 
} from '@/lib/api';
import { Attribute } from '@/lib/api/types';
import { useRouter } from 'next/navigation';

export function AttributeTableClient({ initialAttributes }: { initialAttributes: Attribute[] }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAttrName, setNewAttrName] = useState('');
  const [newValueInput, setNewValueInput] = useState<{ [key: string]: string }>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttrName.trim()) return;
    try {
      await createAttribute(newAttrName);
      setNewAttrName('');
      setIsModalOpen(false);
      router.refresh();
    } catch (error) {
      alert('Có lỗi xảy ra khi tạo thuộc tính');
    }
  };

  const handleDeleteAttribute = async (id: string) => {
    if (!confirm('Xóa thuộc tính này sẽ xóa tất cả các giá trị đi kèm. Bạn có chắc chắn?')) return;
    try {
      await deleteAttribute(id);
      router.refresh();
    } catch (error) {
      alert('Không thể xóa thuộc tính');
    }
  };

  const handleAddValue = async (attributeId: string) => {
    const value = newValueInput[attributeId];
    if (!value?.trim()) return;
    setLoadingId(attributeId);
    try {
      await addAttributeValue(attributeId, value);
      setNewValueInput({ ...newValueInput, [attributeId]: '' });
      router.refresh();
    } catch (error) {
      alert('Lỗi khi thêm giá trị');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteValue = async (valueId: string) => {
    try {
      await deleteAttributeValue(valueId);
      router.refresh();
    } catch (error) {
      alert('Lỗi khi xóa giá trị');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Cấu hình biến thể</p>
          <div className="flex items-center gap-2 text-sm font-black text-black uppercase tracking-tight">
            <span>{initialAttributes.length} Nhóm Thuộc Tính</span>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-xl shadow-black/5"
        >
          <Plus size={18} />
          Thêm nhóm mới
        </button>
      </div>

      {initialAttributes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-100 p-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Settings2 size={32} className="text-zinc-300" />
          </div>
          <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Chưa có thuộc tính nào</h3>
          <p className="text-zinc-500 text-sm font-medium mt-1">Bắt đầu bằng cách thêm "Size giày" hoặc "Màu sắc".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialAttributes.map((attr) => (
            <div key={attr.id} className="bg-white rounded-3xl border border-zinc-100 shadow-sm flex flex-col overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-black text-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
                    <Tag size={18} />
                  </div>
                  <h3 className="font-black text-black uppercase tracking-tight text-sm">{attr.name}</h3>
                </div>
                <button 
                  onClick={() => handleDeleteAttribute(attr.id)}
                  className="text-zinc-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="p-6 flex-1 space-y-6">
                <div className="flex flex-wrap gap-2">
                  {attr.values.length === 0 ? (
                    <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest italic py-2">Chưa có giá trị</p>
                  ) : (
                    attr.values.map((v) => (
                      <div 
                        key={v.id} 
                        className="group/val relative flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-black text-zinc-900 hover:border-black transition-all"
                      >
                        {v.value}
                        <button 
                          onClick={() => handleDeleteValue(v.id)}
                          className="text-zinc-300 hover:text-red-500 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Thêm giá trị..."
                      value={newValueInput[attr.id] || ''}
                      onChange={(e) => setNewValueInput({ ...newValueInput, [attr.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddValue(attr.id)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-black/5 transition-all outline-none pr-10"
                    />
                    <button 
                      onClick={() => handleAddValue(attr.id)}
                      disabled={loadingId === attr.id}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-black p-1 transition-colors"
                    >
                      {loadingId === attr.id ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Plus size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Layers size={14} />
                  {attr.values.length} Items Configured
                </span>
                <ChevronRight size={16} className="text-zinc-200 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Attribute Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-[slideUp_0.3s_ease-out]">
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h2 className="font-black uppercase tracking-tight text-black">Thêm nhóm mới</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateAttribute} className="p-6 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tên nhóm thuộc tính</label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newAttrName}
                  onChange={(e) => setNewAttrName(e.target.value)}
                  placeholder="VD: Size giày, Màu sắc..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-black/5 outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-black text-white rounded-2xl py-4 text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-black/20"
              >
                Tạo Nhóm Ngay
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
