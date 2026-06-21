"use client";

import { useState, useEffect, useCallback } from 'react';
import { X, Search, Plus, Trash2, Package, MapPin, Save, AlertTriangle, ChevronDown, Loader2, ShieldAlert } from 'lucide-react';
import { type AdminOrder, updateOrder, getAdminProducts, type AdminProduct } from '@/lib/api/admin';
import { convertDriveLink } from '@/lib/utils';

interface EditItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  size?: string;
  sizes: string[];
}

interface OrderEditModalProps {
  order: AdminOrder;
  onClose: () => void;
  onSaved: (updated: AdminOrder) => void;
}

const API = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_SHIPPING_FEE = 30000;

interface AreaItem { code: string; name: string; }

export function OrderEditModal({ order, onClose, onSaved }: OrderEditModalProps) {
  const canEditProducts = order.paymentMethod === 'COD';
  const [tab, setTab] = useState<'products' | 'shipping'>('products');
  const [saving, setSaving] = useState(false);

  // ── Shipping state ──────────────────────────────────────────────
  const [shippingName, setShippingName] = useState(order.shippingName);
  const [shippingPhone, setShippingPhone] = useState(order.shippingPhone);
  const [shippingEmail, setShippingEmail] = useState(order.shippingEmail || '');
  const [shippingAddress, setShippingAddress] = useState(order.shippingAddress);

  // Address cascade
  const [provinces, setProvinces] = useState<AreaItem[]>([]);
  const [districts, setDistricts] = useState<AreaItem[]>([]);
  const [wards, setWards] = useState<AreaItem[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');
  const [selectedWardName, setSelectedWardName] = useState(order.shippingWard || '');
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [provinceWarning, setProvinceWarning] = useState('');
  const [districtWarning, setDistrictWarning] = useState('');

  // Map existing order data to codes (reverse lookup)
  const [shippingCity, setShippingCity] = useState(order.shippingCity);
  const [shippingDistrict, setShippingDistrict] = useState(order.shippingDistrict);
  const [shippingWard, setShippingWard] = useState(order.shippingWard || '');
  const [shippingFee, setShippingFee] = useState(order.shippingFee);

  // ── Products state ─────────────────────────────────────────────
  // products data for stock validation (productId → AdminProduct)
  const [productsData, setProductsData] = useState<Record<string, AdminProduct>>({});

  const [items, setItems] = useState<EditItem[]>(
    order.items.map(i => ({
      productId: i.productId,
      productName: i.product?.name || 'Sản phẩm đã xóa',
      productImage: i.product?.images?.[0],
      quantity: i.quantity,
      price: i.price,
      size: i.size || '',
      sizes: [],
    }))
  );

  // Fetch sizes for existing order items on mount
  useEffect(() => {
    const uniqueProductIds = [...new Set(order.items.map(i => i.productId))];
    Promise.all(
      uniqueProductIds.map(pid =>
        fetch(`${API}/admin/products/${pid}`)
          .then(r => r.ok ? r.json() : null)
          .then(p => p ? { [pid]: p } : null)
          .catch(() => null)
      )
    ).then(results => {
      const dataMap: Record<string, AdminProduct> = {};
      results.forEach(r => { if (r) Object.assign(dataMap, r); });
      setProductsData(dataMap);

      // Fill sizes into items
      setItems(prev => prev.map(item => ({
        ...item,
        sizes: dataMap[item.productId]?.sizes || [],
      })));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Product search
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<AdminProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Size picker state (shown after selecting a product)
  const [pendingProduct, setPendingProduct] = useState<AdminProduct | null>(null);
  const [pendingSize, setPendingSize] = useState('');
  const [pendingQty, setPendingQty] = useState(1);

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await getAdminProducts({ search: q, page: 1 });
      setSearchResults((res as any).products || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(search), 300);
    return () => clearTimeout(timer);
  }, [search, searchProducts]);

  // Fetch provinces on mount
  useEffect(() => {
    setLoadingProvinces(true);
    fetch(`${API}/areas/provinces`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'Success') {
          setProvinces(data.results || []);
          // Match existing province name → code
          if (order.shippingCity) {
            const found = (data.results || []).find((p: AreaItem) => p.name === order.shippingCity);
            if (found) setSelectedProvinceCode(found.code);
          }
        }
      })
      .catch(() => setProvinces([]))
      .finally(() => setLoadingProvinces(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    if (!selectedProvinceCode) {
      setDistricts([]); setWards([]); setSelectedDistrictCode(''); setSelectedWardCode('');
      setShippingCity('');       setShippingDistrict(''); setShippingWard(''); setSelectedWardName('');
      setProvinceWarning(''); setDistrictWarning('');
      return;
    }
    setLoadingDistricts(true); setWards([]); setSelectedDistrictCode(''); setSelectedWardCode('');
    setDistrictWarning('');
    const prov = provinces.find(p => p.code === selectedProvinceCode);
    setShippingCity(prov?.name || '');
    setShippingDistrict(''); setShippingWard(''); setSelectedWardName('');
    fetch(`${API}/areas/districts?province=${encodeURIComponent(selectedProvinceCode)}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'Success') {
          setDistricts(data.results || []);
          if (!data.results?.length) {
            setProvinceWarning(`Tỉnh "${prov?.name}" không có quận/huyện nào.`);
          }
          // Match existing district name → code
          if (order.shippingDistrict) {
            const found = (data.results || []).find((d: AreaItem) => d.name === order.shippingDistrict);
            if (found) setSelectedDistrictCode(found.code);
          }
        }
      })
      .catch(() => setDistricts([]))
      .finally(() => setLoadingDistricts(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvinceCode]);

  // Fetch wards when district changes
  useEffect(() => {
    if (!selectedDistrictCode) {
      setWards([]); setSelectedWardCode('');
      setShippingDistrict(''); setShippingWard(''); setSelectedWardName('');
      setDistrictWarning('');
      return;
    }
    setLoadingWards(true); setSelectedWardCode('');
    const dist = districts.find(d => d.code === selectedDistrictCode);
    setShippingDistrict(dist?.name || '');
    setShippingWard(''); setSelectedWardName('');
    fetch(`${API}/areas/communes?district=${encodeURIComponent(selectedDistrictCode)}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'Success') {
          setWards(data.results || []);
          if (!data.results?.length) {
            setDistrictWarning(`Quận "${dist?.name}" không có phường/xã nào.`);
          }
          // Match existing ward name → code
          if (order.shippingWard) {
            const found = (data.results || []).find((w: AreaItem) => w.name === order.shippingWard);
            if (found) {
              setSelectedWardCode(found.code);
              setSelectedWardName(found.name);
            }
          }
        }
      })
      .catch(() => setWards([]))
      .finally(() => setLoadingWards(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrictCode]);

  const handleWardChange = (code: string) => {
    setSelectedWardCode(code);
    const ward = wards.find(w => w.code === code);
    setSelectedWardName(ward?.name || '');
    setShippingWard(ward?.name || '');
  };

  // Count unique product lines (distinct productId)
  const uniqueProductCount = new Set(items.map(i => i.productId)).size;

  // Auto-calculate shipping fee: 2+ distinct products → free
  const effectiveShippingFee = uniqueProductCount >= 2 ? 0 : (order.shippingFee > 0 ? order.shippingFee : DEFAULT_SHIPPING_FEE);

  // Sync effective fee to state when items change
  useEffect(() => {
    setShippingFee(effectiveShippingFee);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueProductCount]);

  // When pending product is selected, show size picker
  const openSizePicker = (product: AdminProduct) => {
    setPendingProduct(product);
    setPendingSize('');
    setPendingQty(1);
    setShowSearch(false);
    setSearch('');
  };

  const confirmAddProduct = () => {
    if (!pendingProduct) return;
    setProductsData(prev => ({ ...prev, [pendingProduct.id]: pendingProduct }));
    
    const existing = items.find(i => i.productId === pendingProduct.id && (i.size || '') === (pendingSize || ''));
    if (existing) {
      setItems(items.map(i =>
        i.productId === pendingProduct.id && (i.size || '') === (pendingSize || '')
          ? { ...i, quantity: i.quantity + pendingQty }
          : i
      ));
    } else {
      setItems([
        ...items,
        {
          productId: pendingProduct.id,
          productName: pendingProduct.name,
          productImage: pendingProduct.images?.[0],
          quantity: pendingQty,
          price: pendingProduct.price,
          size: pendingSize,
          sizes: pendingProduct.sizes || [],
        },
      ]);
    }
    setPendingProduct(null);
    setPendingSize('');
    setPendingQty(1);
  };

  const addProduct = (product: AdminProduct) => {
    setProductsData(prev => ({ ...prev, [product.id]: product }));
    
    // If product has sizes, open size picker; otherwise add directly
    if (product.sizes && product.sizes.length > 0) {
      openSizePicker(product);
    } else {
      const existing = items.find(i => i.productId === product.id);
      if (existing) {
        setItems(items.map(i =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        ));
      } else {
        setItems([
          ...items,
          {
            productId: product.id,
            productName: product.name,
            productImage: product.images?.[0],
            quantity: 1,
            price: product.price,
            size: '',
            sizes: product.sizes || [],
          },
        ]);
      }
      setSearch('');
      setShowSearch(false);
    }
  };

  const removeItem = (productId: string, size?: string) => {
    setItems(items.filter(i => !(i.productId === productId && (i.size || '') === (size || ''))));
  };

  // Track old size when size select opens (for correct updateItem key)
  const [oldSizeForUpdate, setOldSizeForUpdate] = useState('');

  const updateItem = (productId: string, oldSize: string, field: keyof EditItem, value: any) => {
    setItems(items.map(i =>
      i.productId === productId && (i.size || '') === (oldSize || '') ? { ...i, [field]: value } : i
    ));
  };

  const getMaxStock = useCallback((productId: string, size?: string) => {
    const product = productsData[productId];
    if (!product) return 999;
    
    let available = 0;
    if (product.stockPerSize && size) {
      available = (product.stockPerSize as Record<string, number>)[size] || 0;
    } else {
      available = product.stock || 0;
    }
    
    const originalItem = order.items.find(i => i.productId === productId && (i.size || '') === (size || ''));
    if (originalItem) {
      available += originalItem.quantity;
    }
    
    return available;
  }, [productsData, order.items]);

  // ── Calculate totals ────────────────────────────────────────────
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal + effectiveShippingFee;

  // ── Save ────────────────────────────────────────────────────────
  const handleSave = async () => {
    // Non-COD can only save shipping changes, not product changes
    if (tab === 'products' && !canEditProducts) return;

    if (tab === 'products' && items.length === 0) {
      alert('Đơn hàng phải có ít nhất 1 sản phẩm.');
      return;
    }

    if (!shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim() ||
        !shippingCity.trim() || !shippingDistrict.trim()) {
      alert('Vui lòng điền đầy đủ thông tin giao hàng.');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        shippingName: shippingName.trim(),
        shippingPhone: shippingPhone.trim(),
        shippingEmail: shippingEmail.trim() || undefined,
        shippingAddress: shippingAddress.trim(),
        shippingCity: shippingCity.trim(),
        shippingDistrict: shippingDistrict.trim(),
        shippingWard: shippingWard.trim() || undefined,
        shippingFee: effectiveShippingFee,
      };

      if (tab === 'products') {
        payload.items = items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
          size: i.size || undefined,
        }));
      }

      const updated = await updateOrder(order.id, payload);
      onSaved(updated);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Lỗi lưu đơn hàng.');
    } finally {
      setSaving(false);
    }
  };

  const shippingChanged =
    shippingName !== order.shippingName ||
    shippingPhone !== order.shippingPhone ||
    shippingAddress !== order.shippingAddress ||
    shippingCity !== order.shippingCity ||
    shippingDistrict !== order.shippingDistrict ||
    shippingWard !== (order.shippingWard || '');

  const productsChanged =
    items.length !== order.items.length ||
    items.some((i) => {
      const orig = order.items.find(o => o.productId === i.productId && (o.size || '') === (i.size || ''));
      return !orig || orig.quantity !== i.quantity || orig.price !== i.price;
    });

  const hasChanges = tab === 'products'
    ? canEditProducts ? (productsChanged || shippingChanged) : false
    : shippingChanged;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-up overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100">
          <div>
            <h2 className="text-2xl font-black text-black tracking-tight">Chỉnh sửa đơn hàng</h2>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">#{order.id.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* COD restriction notice — only affects products tab */}
        {!canEditProducts && (
          <div className="mx-8 mt-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-black text-amber-800">Đơn hàng không phải COD</p>
              <p className="text-xs text-amber-700 mt-1">
                Chỉ đơn COD mới cho phép chỉnh sửa sản phẩm. Thông tin giao hàng vẫn có thể sửa ở tab Giao hàng.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-zinc-100 px-8">
          <button
            onClick={() => setTab('products')}
            className={`py-4 px-1 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${
              tab === 'products'
                ? 'border-black text-black'
                : 'border-transparent text-zinc-400 hover:text-black'
            }`}
          >
            Sản phẩm ({items.length})
          </button>
          <button
            onClick={() => setTab('shipping')}
            className={`py-4 px-1 mr-6 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${
              tab === 'shipping'
                ? 'border-black text-black'
                : 'border-transparent text-zinc-400 hover:text-black'
            }`}
          >
            Giao hàng
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">

          {/* ── PRODUCTS TAB ────────────────────────────────────────── */}
          {tab === 'products' && (
            <div className="space-y-4">

              {/* Add product search */}
              {canEditProducts && (
              <div className="relative">
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="w-full py-3 px-4 border-2 border-dashed border-zinc-200 rounded-2xl text-sm font-medium text-zinc-500 hover:border-black hover:text-black transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Thêm sản phẩm
                </button>

                {showSearch && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl z-10 overflow-hidden">
                    <div className="p-3 border-b border-zinc-100 flex items-center gap-2">
                      <Search size={16} className="text-zinc-400 shrink-0" />
                      <input
                        autoFocus
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Tìm sản phẩm..."
                        className="flex-1 text-sm outline-none placeholder:text-zinc-400"
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-zinc-50">
                      {searching && (
                        <div className="p-4 text-center text-xs text-zinc-400">Đang tìm...</div>
                      )}
                      {!searching && searchResults.length === 0 && search.trim() && (
                        <div className="p-4 text-center text-xs text-zinc-400">Không tìm thấy sản phẩm</div>
                      )}
                      {searchResults.map(p => (
                        <button
                          key={p.id}
                          onClick={() => addProduct(p)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-50 transition-colors text-left"
                        >
                          <div className="w-10 h-10 bg-zinc-50 rounded-lg overflow-hidden shrink-0">
                            {p.images?.[0] ? (
                              <img src={convertDriveLink(p.images[0])} alt={p.name} className="w-full h-full object-contain" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                <Package size={16} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-black line-clamp-1">{p.name}</p>
                            <p className="text-xs text-zinc-500">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(p.price)}
                              {p.sizes?.length ? ` · ${p.sizes.join(', ')}` : ''}
                            </p>
                          </div>
                          <Plus size={14} className="text-zinc-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* Item list */}
              {items.length === 0 ? (
                <div className="py-12 text-center text-sm text-zinc-400">Chưa có sản phẩm nào.</div>
              ) : (
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={`${item.productId}-${item.size}`} className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl">
                      <div className="w-12 h-12 bg-white border border-zinc-100 rounded-xl overflow-hidden shrink-0">
                        {item.productImage ? (
                          <img src={convertDriveLink(item.productImage)} alt={item.productName} className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-300">
                            <Package size={20} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-black line-clamp-1">{item.productName}</p>
                        <div className="flex gap-2 mt-1 items-center flex-wrap">
                          {/* Size selector — uses product's actual sizes */}
                          {canEditProducts && item.sizes.length > 0 && (
                            <select
                              value={item.size}
                              onChange={e => updateItem(item.productId, oldSizeForUpdate || item.size || '', 'size', e.target.value)}
                              onFocus={e => setOldSizeForUpdate((e.target as HTMLSelectElement).value)}
                              className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-white px-2 py-0.5 rounded-lg border border-zinc-200 outline-none cursor-pointer"
                            >
                              <option value="">Không size</option>
                              {item.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          )}
                          {canEditProducts && item.sizes.length === 0 && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-white px-2 py-0.5 rounded-lg border border-zinc-100">—</span>
                          )}
                          {!canEditProducts && item.size && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-white px-2 py-0.5 rounded-lg border border-zinc-100">
                              Size: {item.size}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => updateItem(item.productId, item.size || '', 'quantity', Math.max(1, item.quantity - 1))}
                          className="w-8 h-8 rounded-lg bg-white border border-zinc-200 text-sm font-black hover:bg-zinc-100 transition-colors disabled:opacity-40"
                          disabled={!canEditProducts || item.quantity <= 1}
                        >−</button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => {
                            let val = parseInt(e.target.value);
                            if (isNaN(val)) return;
                            const max = getMaxStock(item.productId, item.size);
                            if (val > max) {
                              val = max;
                              alert(`Sản phẩm này chỉ còn tối đa ${max} cái.`);
                            }
                            updateItem(item.productId, item.size || '', 'quantity', Math.max(1, val));
                          }}
                          className="w-12 text-center text-sm font-black border border-zinc-200 rounded-lg py-1 outline-none disabled:bg-zinc-100"
                          disabled={!canEditProducts}
                        />
                        <button
                          onClick={() => updateItem(item.productId, item.size || '', 'quantity', item.quantity + 1)}
                          className="w-8 h-8 rounded-lg bg-white border border-zinc-200 text-sm font-black hover:bg-zinc-100 transition-colors disabled:opacity-40"
                          disabled={!canEditProducts || item.quantity >= getMaxStock(item.productId, item.size)}
                        >+</button>
                      </div>

                      <div className="w-32 shrink-0">
                        <input
                          type="number"
                          value={item.price}
                          onChange={e => updateItem(item.productId, item.size || '', 'price', Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full text-right text-sm font-black border border-zinc-200 rounded-lg px-3 py-1 outline-none disabled:bg-zinc-100"
                          disabled={!canEditProducts}
                        />
                        <p className="text-[9px] text-zinc-400 text-right mt-0.5">VNĐ / đơn vị</p>
                      </div>

                      <button
                        onClick={() => removeItem(item.productId, item.size)}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors shrink-0 disabled:opacity-30"
                        disabled={!canEditProducts}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              {items.length > 0 && (
                <div className="mt-6 p-5 bg-black rounded-2xl space-y-3">
                  <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    <span>Tạm tính</span>
                    <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                      Phí vận chuyển
                      {uniqueProductCount >= 2 && (
                        <span className="text-[9px] font-black bg-green-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Free {uniqueProductCount} dòng</span>
                      )}
                    </span>
                    <span>
                      {effectiveShippingFee === 0
                        ? 'Miễn phí'
                        : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(effectiveShippingFee)
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <span className="text-sm font-black text-white uppercase tracking-widest">Tổng cộng</span>
                    <span className="text-xl font-black text-white">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(total)}
                    </span>
                  </div>
                </div>
              )}

              {/* Shipping preview in products tab */}
              <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                  <MapPin size={12} />
                  Thông tin giao hàng hiện tại
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 font-medium">{order.shippingName} · {order.shippingPhone}</span>
                </div>
                <div className="text-xs text-zinc-400">
                  {order.shippingAddress}{order.shippingWard ? `, ${order.shippingWard}` : ''}, {order.shippingDistrict}, {order.shippingCity}
                </div>
                <div className="pt-2 border-t border-zinc-100">
                  <button
                    onClick={() => setTab('shipping')}
                    className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest"
                  >
                    Chỉnh sửa thông tin giao hàng →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SHIPPING TAB ────────────────────────────────────────── */}
          {tab === 'shipping' && (
            <div className="space-y-5">
              {/* Shipping fee auto-notice */}
              <div className="flex items-center gap-2 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                <AlertTriangle className="text-zinc-400 shrink-0" size={16} />
                <p className="text-xs text-zinc-500 font-medium">
                  Phí ship tự động:{' '}
                  <span className="font-black text-black">
                    {uniqueProductCount >= 2
                      ? `Miễn phí (${uniqueProductCount} dòng sản phẩm)`
                      : `Phí mặc định ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(effectiveShippingFee)}`
                  }
                  </span>
                  {uniqueProductCount === 1 && (
                    <span className="text-zinc-400"> — Thêm dòng sản phẩm để được miễn phí ship</span>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">Tên người nhận *</label>
                  <input
                    value={shippingName}
                    onChange={e => setShippingName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">Số điện thoại *</label>
                  <input
                    value={shippingPhone}
                    onChange={e => setShippingPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">Email</label>
                  <input
                    value={shippingEmail}
                    onChange={e => setShippingEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">Địa chỉ chi tiết *</label>
                  <input
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    placeholder="VD: 123 Nguyễn Trãi, P.2"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>

                {/* Tỉnh / Thành phố — dropdown */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">Tỉnh/Thành phố *</label>
                  <div className="relative">
                    <select
                      value={selectedProvinceCode}
                      onChange={e => setSelectedProvinceCode(e.target.value)}
                      disabled={loadingProvinces}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 appearance-none pr-10 cursor-pointer"
                    >
                      <option value="">{loadingProvinces ? 'Đang tải...' : 'CHỌN TỈNH/THÀNH PHỐ'}</option>
                      {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  </div>
                  {loadingProvinces && <div className="flex items-center gap-1 mt-1"><Loader2 size={10} className="animate-spin text-zinc-400" /><span className="text-[10px] text-zinc-400">Đang tải...</span></div>}
                  {provinceWarning && <p className="text-[10px] text-amber-600 mt-1">{provinceWarning}</p>}
                </div>

                {/* Quận / Huyện — dropdown */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">Quận/Huyện *</label>
                  <div className="relative">
                    <select
                      value={selectedDistrictCode}
                      onChange={e => setSelectedDistrictCode(e.target.value)}
                      disabled={!selectedProvinceCode || loadingDistricts}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 appearance-none pr-10 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">{loadingDistricts ? 'Đang tải...' : !selectedProvinceCode ? 'CHỌN TỈNH TRƯỚC' : 'CHỌN QUẬN/HUYỆN'}</option>
                      {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  </div>
                  {loadingDistricts && <div className="flex items-center gap-1 mt-1"><Loader2 size={10} className="animate-spin text-zinc-400" /><span className="text-[10px] text-zinc-400">Đang tải...</span></div>}
                  {districtWarning && <p className="text-[10px] text-amber-600 mt-1">{districtWarning}</p>}
                </div>

                {/* Phường / Xã — dropdown */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">Phường/Xã</label>
                  <div className="relative">
                    <select
                      value={selectedWardCode}
                      onChange={e => handleWardChange(e.target.value)}
                      disabled={!selectedDistrictCode || loadingWards}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 appearance-none pr-10 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">{loadingWards ? 'Đang tải...' : !selectedDistrictCode ? 'CHỌN QUẬN TRƯỚC' : 'CHỌN PHƯỜNG/XÃ'}</option>
                      {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  </div>
                  {loadingWards && <div className="flex items-center gap-1 mt-1"><Loader2 size={10} className="animate-spin text-zinc-400" /><span className="text-[10px] text-zinc-400">Đang tải...</span></div>}
                </div>

                {/* Phí vận chuyển (readonly display) */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1.5">Phí vận chuyển</label>
                  <div className="w-full px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-xl text-sm font-black text-black flex items-center justify-between">
                    <span className="text-zinc-400 font-medium text-[10px] uppercase tracking-widest">Tự động</span>
                    <span className={effectiveShippingFee === 0 ? 'text-green-600' : 'text-black'}>
                      {effectiveShippingFee === 0
                        ? 'Miễn phí'
                        : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(effectiveShippingFee)
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Products preview in shipping tab */}
              <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                  <Package size={12} />
                  Sản phẩm ({items.length} dòng)
                  {uniqueProductCount >= 2 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-black">Miễn phí ship</span>
                  )}
                </div>
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={`${item.productId}-${item.size}`} className="flex justify-between text-xs">
                      <span className="text-zinc-600 font-medium">
                        {item.productName}
                        {item.size && ` · Size ${item.size}`}
                        <span className="text-zinc-400 ml-1">×{item.quantity}</span>
                      </span>
                      <span className="font-black text-zinc-800">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-zinc-100 mt-2">
                  <div className="flex justify-between text-xs font-black">
                    <span className="text-zinc-500 uppercase tracking-widest">Tổng sản phẩm</span>
                    <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black mt-1">
                    <span className="text-zinc-500 uppercase tracking-widest">Phí vận chuyển</span>
                    <span className={effectiveShippingFee === 0 ? 'text-green-600' : 'text-black'}>
                      {effectiveShippingFee === 0
                        ? 'Miễn phí'
                        : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(effectiveShippingFee)
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black mt-2 pt-2 border-t border-zinc-100">
                    <span className="text-black uppercase tracking-widest">Tổng cộng</span>
                    <span className="text-black">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-6 border-t border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-2 text-[10px] text-zinc-400">
            {!canEditProducts ? (
              <span className="flex items-center gap-1 text-zinc-400 font-black uppercase tracking-widest">
                Chỉ đơn COD được phép sửa sản phẩm
              </span>
            ) : hasChanges ? (
              <span className="flex items-center gap-1 text-amber-600 font-black uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                Có thay đổi chưa lưu
              </span>
            ) : (
              <span className="font-black uppercase tracking-widest">Không có thay đổi</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-zinc-100 text-zinc-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
            >
              Đóng
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="px-6 py-3 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg shadow-black/10 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Đang lưu...' : <><Save size={14} /> Lưu thay đổi</>}
            </button>
          </div>
        </div>

        {/* Size picker overlay */}
        {pendingProduct && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-fade-in">
            <div className="bg-white rounded-[24px] w-full max-w-sm shadow-2xl overflow-hidden animate-scale-up">
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
                <h3 className="text-lg font-black text-black">Chọn size</h3>
                <button onClick={() => setPendingProduct(null)} className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-zinc-50 rounded-xl overflow-hidden shrink-0">
                    {pendingProduct.images?.[0] && (
                      <img src={convertDriveLink(pendingProduct.images[0])} alt={pendingProduct.name} className="w-full h-full object-contain" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black text-black">{pendingProduct.name}</p>
                    <p className="text-xs text-zinc-500">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(pendingProduct.price)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {pendingProduct.sizes?.map(size => (
                      <button
                        key={size}
                        onClick={() => setPendingSize(size)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
                          pendingSize === size
                            ? 'border-black bg-black text-white'
                            : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Số lượng</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPendingQty(q => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 text-lg font-black hover:bg-zinc-100 transition-colors disabled:opacity-40"
                      disabled={pendingQty <= 1}
                    >−</button>
                    <input
                      type="number"
                      min="1"
                      value={pendingQty}
                      onChange={e => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) return;
                        if (pendingSize) {
                          const max = getMaxStock(pendingProduct.id, pendingSize);
                          if (val > max) {
                            val = max;
                            alert(`Sản phẩm này chỉ còn tối đa ${max} cái.`);
                          }
                        }
                        setPendingQty(Math.max(1, val));
                      }}
                      className="w-20 text-center text-sm font-black border border-zinc-200 rounded-xl py-2 outline-none"
                    />
                    <button
                      onClick={() => setPendingQty(q => q + 1)}
                      className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 text-lg font-black hover:bg-zinc-100 transition-colors disabled:opacity-40"
                      disabled={pendingSize ? pendingQty >= getMaxStock(pendingProduct.id, pendingSize) : false}
                    >+</button>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <button
                  onClick={confirmAddProduct}
                  disabled={!pendingSize}
                  className="w-full py-3 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus size={14} />
                  Thêm vào đơn
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
