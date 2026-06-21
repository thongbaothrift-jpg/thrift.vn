"use client";

import { useState, useCallback, useEffect } from 'react';
import { createCoupon, updateCoupon, deleteCoupon, type AdminCoupon } from '@/lib/api/admin';
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit2, Trash2, Tag, Calendar, AlertCircle, X, ChevronRight, Filter } from 'lucide-react';

function formatCurrency(v: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function CouponTableClient({ 
  initialCoupons, 
  total: initialTotal 
}: { 
  initialCoupons: AdminCoupon[], 
  total: number 
}) {
  const router = useRouter();
  const [coupons, setCoupons] = useState<AdminCoupon[]>(initialCoupons);
  const [activeFilter, setActiveFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | undefined>(undefined);
  const [actionId, setActionId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync state with props for SSR
  useEffect(() => {
    setCoupons(initialCoupons);
  }, [initialCoupons]);

  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'percent',
    discountValue: '',
    minOrderValue: '',
    maxDiscount: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
  });

  const handleOpenModal = (coupon?: AdminCoupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setForm({
        code: coupon.code || '',
        description: coupon.description || '',
        discountType: coupon.discountPercent ? 'percent' : 'fixed',
        discountValue: coupon.discountPercent?.toString() || coupon.discountAmount?.toString() || '',
        minOrderValue: coupon.minOrderValue?.toString() || '',
        maxDiscount: coupon.maxDiscount?.toString() || '',
        maxUses: coupon.maxUses?.toString() || '',
        validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 10) : '',
        validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().slice(0, 10) : '',
        isActive: coupon.isActive ?? true,
      });
    } else {
      setEditingCoupon(undefined);
      setForm({
        code: '',
        description: '',
        discountType: 'percent',
        discountValue: '',
        minOrderValue: '',
        maxDiscount: '',
        maxUses: '',
        validFrom: '',
        validUntil: '',
        isActive: true,
      });
    }
    setShowModal(true);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      const data: any = {
        code: form.code.toUpperCase().trim(),
        description: form.description.trim() || null,
        discountPercent: form.discountType === 'percent' ? parseFloat(form.discountValue) : null,
        discountAmount: form.discountType === 'fixed' ? parseFloat(form.discountValue) : null,
        minOrderValue: form.minOrderValue ? parseFloat(form.minOrderValue) : null,
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        validFrom: form.validFrom || null,
        validUntil: form.validUntil || null,
        isActive: form.isActive,
      };

      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, data);
      } else {
        await createCoupon(data);
      }
      setShowModal(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (coupon: AdminCoupon) => {
    const message = !coupon.isActive 
      ? `Kích hoạt mã giảm giá "${coupon.code}"?` 
      : `Dừng kích hoạt mã giảm giá "${coupon.code}"?`;

    if (!window.confirm(message)) return;

    setActionId(coupon.id);
    try {
      await updateCoupon(coupon.id, { isActive: !coupon.isActive });
      router.refresh();
    } catch (e: any) {
      alert(e.message || 'Lỗi cập nhật');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (coupon: AdminCoupon) => {
    if (!confirm(`Xóa mã "${coupon.code}"?`)) return;
    setActionId(coupon.id);
    try {
      await deleteCoupon(coupon.id);
      router.refresh();
    } catch (e: any) {
      alert(e.message || 'Lỗi xóa');
    } finally {
      setActionId(null);
    }
  };

  const filteredCoupons = initialCoupons.filter(c => {
    if (activeFilter === 'true') return c.isActive;
    if (activeFilter === 'false') return !c.isActive;
    return true;
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center">
            <Tag size={24} />
          </div>
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Tổng mã</p>
            <h3 className="text-2xl font-black text-black">{initialTotal}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-600 text-white rounded-xl flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Đang chạy</p>
            <h3 className="text-2xl font-black text-black">{initialCoupons.filter(c => c.isActive).length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Sắp hết hạn</p>
            <h3 className="text-2xl font-black text-black">
              {initialCoupons.filter(c => {
                const end = new Date(c.validUntil);
                const diff = (end.getTime() - now.getTime()) / (1000 * 3600 * 24);
                return diff > 0 && diff < 7;
              }).length}
            </h3>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-zinc-100 w-fit">
          <button 
            onClick={() => setActiveFilter('')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeFilter === '' ? 'bg-black text-white shadow-lg' : 'text-zinc-500 hover:bg-zinc-50'}`}
          >
            Tất cả
          </button>
          <button 
            onClick={() => setActiveFilter('true')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeFilter === 'true' ? 'bg-black text-white shadow-lg' : 'text-zinc-500 hover:bg-zinc-50'}`}
          >
            Đang chạy
          </button>
          <button 
            onClick={() => setActiveFilter('false')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeFilter === 'false' ? 'bg-black text-white shadow-lg' : 'text-zinc-500 hover:bg-zinc-50'}`}
          >
            Đã dừng
          </button>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-xl shadow-black/5"
        >
          <Plus size={18} />
          Tạo mã mới
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Mã Coupon</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Mức giảm</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Lượt dùng</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Thời hạn</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Trạng thái</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 text-sm">
                    Chưa có mã giảm giá nào được tạo.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => {
                  const isExpired = new Date(coupon.validUntil) < now;
                  const usagePct = coupon.maxUses ? Math.round((coupon.usedCount / coupon.maxUses) * 100) : 0;

                  return (
                    <tr key={coupon.id} className="hover:bg-zinc-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-black font-mono tracking-tighter text-sm uppercase">
                            {coupon.code}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[150px]">
                            {coupon.description || 'Không có mô tả'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-black text-sm">
                            {coupon.discountPercent ? `${coupon.discountPercent}%` : formatCurrency(coupon.discountAmount || 0)}
                          </span>
                          {(coupon.minOrderValue ?? 0) > 0 && (
                            <span className="text-[10px] text-zinc-400 font-bold tracking-tighter">
                              ĐƠN TỪ {formatCurrency(coupon.minOrderValue ?? 0)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center w-24">
                            <span className="text-xs font-black text-zinc-900">{coupon.usedCount}</span>
                            <span className="text-[10px] text-zinc-400 font-bold">/ {coupon.maxUses || '∞'}</span>
                          </div>
                          {coupon.maxUses && (
                            <div className="w-24 h-1 bg-zinc-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${usagePct >= 90 ? 'bg-red-500' : usagePct >= 70 ? 'bg-amber-500' : 'bg-black'}`}
                                style={{ width: `${usagePct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-zinc-500 leading-tight">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full" />
                          {formatDate(coupon.validFrom)}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-brand-red rounded-full" />
                          {formatDate(coupon.validUntil)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                          isExpired ? 'bg-zinc-100 text-zinc-400' :
                          !coupon.isActive ? 'bg-red-50 text-red-500' :
                          'bg-green-50 text-green-600'
                        }`}>
                          {isExpired ? 'Hết hạn' : !coupon.isActive ? 'Đã tắt' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          <button
                            onClick={() => handleOpenModal(coupon)}
                            className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(coupon)}
                            disabled={actionId === coupon.id}
                            className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-all disabled:opacity-50"
                          >
                            <div className={`w-2 h-2 rounded-full ${coupon.isActive ? 'bg-red-500' : 'bg-green-500'}`} />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon)}
                            disabled={actionId === coupon.id}
                            className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h2 className="text-xl font-black uppercase tracking-tight text-black">
                {editingCoupon ? 'Cập nhật mã giảm giá' : 'Tạo mã giảm giá mới'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-xs font-bold">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Mã Coupon *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-black font-mono focus:ring-2 focus:ring-black/5 outline-none"
                    placeholder="VD: THRIFTED2024"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Loại giảm giá</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value, discountValue: '' })}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                  >
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (VND)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Giá trị giảm *</label>
                  <input
                    type="number"
                    required
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                    placeholder="VD: 20 hoặc 100000"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Giảm tối đa (VND)</label>
                  <input
                    type="number"
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                    placeholder="Không giới hạn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Đơn tối thiểu (VND)</label>
                  <input
                    type="number"
                    value={form.minOrderValue}
                    onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                    placeholder="VD: 500000"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Lượt dùng tối đa</label>
                  <input
                    type="number"
                    value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                    placeholder="Bỏ trống = Vô hạn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Mô tả chương trình</label>
                  <span className={`text-[10px] font-bold ${(form.description || '').length > 100 ? 'text-brand-red' : 'text-zinc-400'}`}>
                    {(form.description || '').length} / 100
                  </span>
                </div>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none resize-none"
                  placeholder="Mô tả cho khách hàng..."
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-zinc-400 hover:text-black transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-[2] bg-black text-white py-3 rounded-xl font-bold text-sm hover:bg-zinc-800 shadow-xl shadow-black/10 transition-all disabled:opacity-50"
                >
                  {formLoading ? 'Đang lưu...' : (editingCoupon ? 'Cập nhật' : 'Tạo mã ngay')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
