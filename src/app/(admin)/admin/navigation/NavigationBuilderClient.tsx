'use client';

import { useState, useEffect } from 'react';
import { getSiteTexts, upsertSiteText } from '@/lib/api/admin';
import { getAdminCategories, getAdminBrands } from '@/lib/api';
import type { Category, Brand } from '@/lib/api/types';
import { Plus, Trash2, GripVertical, Save, CheckCircle, AlertTriangle } from 'lucide-react';

export type MenuItemType = 'LINK' | 'MEGA_MENU' | 'CATEGORIES' | 'BRANDS';

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  type: MenuItemType;
  children?: MenuItem[];
}

const DEFAULT_MENU: MenuItem[] = [
  { id: '1', label: 'Cửa hàng', href: '/shop', type: 'MEGA_MENU' },
  { id: '2', label: 'Ký gửi', href: '/sell', type: 'LINK' },
  { id: '3', label: 'Tin tức', href: '/blog', type: 'LINK' },
  { id: '4', label: 'Voucher', href: '/voucher', type: 'LINK' },
  { id: '5', label: 'Liên hệ', href: '/contact', type: 'LINK' },
];

const SYSTEM_LINKS = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Cửa hàng', href: '/shop' },
  { label: 'Ký gửi', href: '/sell' },
  { label: 'Tin tức', href: '/blog' },
  { label: 'Voucher', href: '/voucher' },
  { label: 'Liên hệ', href: '/contact' },
  { label: 'Giỏ hàng', href: '/cart' },
  { label: 'Tài khoản', href: '/account' },
];

export function NavigationBuilderClient() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [texts, cats, brs] = await Promise.all([
        getSiteTexts(),
        getAdminCategories().catch(() => []),
        getAdminBrands().catch(() => [])
      ]);
      
      setCategories(cats);
      setBrands(brs);

      const menuText = texts.find(t => t.key === 'config.main_menu');
      if (menuText && menuText.value) {
        setMenuItems(JSON.parse(menuText.value));
      } else {
        setMenuItems(DEFAULT_MENU);
      }
    } catch (err) {
      setError('Không thể tải cấu hình menu.');
      setMenuItems(DEFAULT_MENU);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await upsertSiteText('config.main_menu', JSON.stringify(menuItems), 'ui');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('thrifted_nav_data');
        // trigger an event to clear sessionStorage just in case someone has it from earlier
        sessionStorage.removeItem('thrifted_nav_data');
      }
      setSuccess('Đã lưu cấu hình menu thành công!');
      setHasChanges(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi lưu.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    setMenuItems([
      ...menuItems,
      { id: Date.now().toString(), label: 'Menu mới', href: '/', type: 'LINK' },
    ]);
    setHasChanges(true);
  };

  const handleRemoveItem = (id: string) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
    setHasChanges(true);
  };

  const handleChange = (id: string, field: keyof MenuItem, value: string) => {
    setMenuItems(menuItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
    setHasChanges(true);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === menuItems.length - 1) return;

    const newItems = [...menuItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setMenuItems(newItems);
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Quản lý Menu</h1>
          <p className="text-zinc-500 text-sm mt-1">Cấu hình thanh điều hướng chính (Header) của website</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAddItem}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-black rounded-xl font-bold hover:bg-zinc-200 transition-colors"
          >
            <Plus size={18} />
            Thêm Menu
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-xl font-bold hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Lưu thay đổi
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle size={20} />
          <p className="font-medium text-sm">{success}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle size={20} />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="p-6 space-y-4">
          {menuItems.map((item, index) => (
            <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-xl group relative">
              <div className="flex flex-col gap-1 items-center justify-center shrink-0">
                <button
                  onClick={() => moveItem(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-zinc-400 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                </button>
                <GripVertical size={16} className="text-zinc-300" />
                <button
                  onClick={() => moveItem(index, 'down')}
                  disabled={index === menuItems.length - 1}
                  className="p-1 text-zinc-400 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Tên hiển thị</label>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => handleChange(item.id, 'label', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                    placeholder="VD: Cửa hàng"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Loại Menu</label>
                  <select
                    value={item.type}
                    onChange={(e) => handleChange(item.id, 'type', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 appearance-none"
                  >
                    <option value="LINK">Link Cơ bản</option>
                    <option value="MEGA_MENU">Mega Menu (Gộp Danh mục & Thương hiệu)</option>
                    <option value="CATEGORIES">Chỉ xổ Danh mục</option>
                    <option value="BRANDS">Chỉ xổ Thương hiệu</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Đường dẫn (URL)</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleChange(item.id, 'href', e.target.value);
                          if (!item.label || item.label === 'Menu mới') {
                            const optionText = e.target.options[e.target.selectedIndex].text;
                            handleChange(item.id, 'label', optionText.replace(/^(.*? )/, ''));
                          }
                          e.target.value = '';
                        }
                      }}
                      className="text-[10px] text-brand-red bg-red-50 hover:bg-red-100 font-bold px-2 py-0.5 rounded cursor-pointer outline-none border-none max-w-[120px]"
                      title="Chọn nhanh trang có sẵn"
                      value=""
                    >
                      <option value="" disabled>+ Chọn nhanh</option>
                      <optgroup label="Hệ thống">
                        {SYSTEM_LINKS.map(link => (
                          <option key={link.href} value={link.href}>{link.label}</option>
                        ))}
                      </optgroup>
                      {categories.length > 0 && (
                        <optgroup label="Danh mục sản phẩm">
                          {categories.map(cat => (
                            <option key={cat.id} value={`/shop?category=${cat.slug}`}>{cat.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {brands.length > 0 && (
                        <optgroup label="Thương hiệu">
                          {brands.map(brand => (
                            <option key={brand.id} value={`/shop?brand=${brand.slug}`}>{brand.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={item.href}
                    onChange={(e) => handleChange(item.id, 'href', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                    placeholder="VD: /shop"
                  />
                </div>
              </div>

              <button
                onClick={() => handleRemoveItem(item.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0 transition-colors"
                title="Xóa menu"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}

          {menuItems.length === 0 && (
            <div className="py-12 text-center text-zinc-500 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl">
              <p>Chưa có menu nào. Hãy bấm "Thêm Menu" để bắt đầu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
