"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createProduct,
  updateProduct,
  getAdminAttributes,
  getAdminCategories,
  getAdminUsers,
  type AdminProduct,
  type AdminAttribute,
  type AdminCategory,
  type AdminUser,
} from "@/lib/api/admin";
import { getAdminBrands, createBrand, createCategory } from "@/lib/api";
import { Combobox } from "@/components/Combobox";
import type { Brand } from "@/lib/api/types";
import { convertDriveLink } from "@/lib/utils";

interface Props {
  product?: AdminProduct;
  mode: "create" | "edit";
}

const CONDITIONS = [
  { value: "NEW_WITH_TAGS", label: "Mới có tag (New with Tags)" },
  { value: "LIKE_NEW", label: "Như mới (Like New)" },
  { value: "EXCELLENT", label: "Tốt (Excellent)" },
  { value: "GOOD", label: "Khá (Good)" },
];

const AUTHENTIC_TYPES = [
  { value: "AUTHENTIC", label: "Authentic (Hàng thật 100%)" },
  { value: "LIKE_AUTHENTIC", label: "Like Authentic (Gần như thật)" },
  { value: "REP_UNBRANDED", label: "Rep Unbranded (Gicăng không logo)" },
  { value: "REP_BRANDED", label: "Rep Branded (Gicăng có logo)" },
];

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Nháp (Draft)" },
  { value: "AVAILABLE", label: "Đang bán (Available)" },
  { value: "HIDDEN", label: "Ẩn (Hidden)" },
  { value: "SOLD_OUT", label: "Hết hàng (Sold Out)" },
];

const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];

interface FormData {
  name: string;
  description: string;
  price: string;
  oldPrice: string;
  condition: string;
  conditionPercent: string;
  authenticType: string;
  isHotDeal: boolean;
  isNewArrival: boolean;
  status: string;
  stockPerSize: Record<string, string>; // VD: {"S": "1", "M": "0"}
  weight: string; // gram
  images: string;
  tags: string;
  sizes: string;
  sizingRong: string;
  sizingDai: string;
  sizingBung: string;
  sizingDayQuan: string;
  sizingOngQuan: string;
  categoryId: string;
  brandId: string;
  categoryName: string;
  brandName: string;
  sellerId: string;
  seoTitle: string;
  seoDescription: string;
  scheduledAt: string; // ISO datetime string for scheduled publishing
}

export function ProductForm({ product, mode }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [availableAttributes, setAvailableAttributes] = useState<
    AdminAttribute[]
  >([]);
  const [brandsList, setBrandsList] = useState<Brand[]>([]);
  const [categoriesList, setCategoriesList] = useState<AdminCategory[]>([]);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [selectedAttrValueIds, setSelectedAttrValueIds] = useState<string[]>(
    product?.productAttributes?.map((pa) => pa.attributeValueId) || [],
  );

  const [conditionsList, setConditionsList] = useState<{id: string, name: string}[]>(() => {
    const list = CONDITIONS.map(c => ({ id: c.value, name: c.label }));
    if (product?.condition && !list.some(c => c.id === product.condition)) {
      list.push({ id: product.condition, name: product.condition });
    }
    return list;
  });

  const [authenticTypesList, setAuthenticTypesList] = useState<{id: string, name: string}[]>(() => {
    const list = AUTHENTIC_TYPES.map(a => ({ id: a.value, name: a.label }));
    if (product?.authenticType && !list.some(a => a.id === product.authenticType)) {
      list.push({ id: product.authenticType, name: product.authenticType });
    }
    return list;
  });

  const [form, setForm] = useState<FormData>({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    oldPrice: product?.oldPrice?.toString() || "",
    condition: product?.condition || "LIKE_NEW",
    conditionPercent: product?.conditionPercent?.toString() || "",
    authenticType: product?.authenticType || "",
    isHotDeal: product?.isHotDeal || false,
    isNewArrival: product?.isNewArrival ?? true,
    status: product?.status || "DRAFT",
    stockPerSize: Object.fromEntries(
      (product?.sizes || ["S", "M", "L", "XL"]).map((size) => [
        size,
        String((product?.stockPerSize as Record<string, number>)?.[size] ?? 0),
      ]),
    ),
    weight: product?.weight?.toString() || "500",
    images: product?.images?.join("\n") || "",
    tags: product?.tags?.join(", ") || "",
    sizes: product?.sizes?.join(", ") || "",
    sizingRong: product?.sizingRong || "",
    sizingDai: product?.sizingDai || "",
    sizingBung: product?.sizingBung || "",
    sizingDayQuan: product?.sizingDayQuan || "",
    sizingOngQuan: product?.sizingOngQuan || "",
    categoryId: product?.categoryId || "",
    categoryName: product?.category?.name || "",
    brandId: product?.brandId || "",
    brandName: product?.brand?.name || "",
    sellerId: (product as any)?.sellerId || "",
    seoTitle: product?.seoTitle || "",
    seoDescription: product?.seoDescription || "",
    scheduledAt: product?.scheduledAt
      ? formatLocalDateTime(new Date(product.scheduledAt))
      : "",
  });

  // Sync stockPerSize when sizes change (add/remove size entries)
  useEffect(() => {
    const currentSizes = form.sizes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setForm((prev) => {
      const newStockPerSize: Record<string, string> = {};
      currentSizes.forEach((size) => {
        newStockPerSize[size] = prev.stockPerSize[size] ?? "0";
      });
      return { ...prev, stockPerSize: newStockPerSize };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.sizes]);

  useEffect(() => {
    getAdminAttributes().then(setAvailableAttributes).catch(console.error);
    getAdminBrands().then(setBrandsList).catch(console.error);
    getAdminCategories().then(setCategoriesList).catch(console.error);
    getAdminUsers({ limit: 1000 })
      .then((res) => setUsersList(res.users))
      .catch(console.error);
  }, []);

  function formatLocalDateTime(d: Date) {
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  function getDefaultScheduleTime() {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return formatLocalDateTime(d);
  }

  const set = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      setError("Tên sản phẩm và giá bán bắt buộc.");
      return;
    }

    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      oldPrice: form.oldPrice ? parseFloat(form.oldPrice) : null,
      condition: form.condition,
      conditionPercent: form.conditionPercent
        ? parseInt(form.conditionPercent)
        : null,
      authenticType: form.authenticType || null,
      isHotDeal: form.isHotDeal,
      isNewArrival: form.isNewArrival,
      status: form.scheduledAt ? "DRAFT" : form.status,
      stockPerSize: Object.fromEntries(
        Object.entries(form.stockPerSize).map(([size, qty]) => [
          size,
          parseInt(qty) || 0,
        ]),
      ),
      weight: parseInt(form.weight) || 500,
      images: form.images
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      sizes: form.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      sizingRong: form.sizingRong.trim() || null,
      sizingDai: form.sizingDai.trim() || null,
      sizingBung: form.sizingBung.trim() || null,
      sizingDayQuan: form.sizingDayQuan.trim() || null,
      sizingOngQuan: form.sizingOngQuan.trim() || null,
      attributeValueIds: selectedAttrValueIds,
      categoryId: form.categoryId || null,
      brandId: form.brandId || null,
      sellerId: form.sellerId || null,
      seoTitle: form.seoTitle.trim() || null,
      seoDescription: form.seoDescription.trim() || null,
      // Gửi UTC timezone để tránh lệch 7 tiếng do local datetime-local
      scheduledAt: form.scheduledAt
        ? new Date(form.scheduledAt).toISOString()
        : null,
    };

    try {
      if (mode === "create") {
        await createProduct(payload);
        router.push("/admin/products");
      } else {
        await updateProduct(product!.id, payload);
        router.push("/admin/products");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lỗi lưu sản phẩm");
    } finally {
      setSaving(false);
    }
  };

  const imgUrls = form.images
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);
  const previewImages = imgUrls.slice(0, 5);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Name */}
          <div className="bg-white border border-zinc-200 p-5">
            <h3 className="text-sm font-semibold text-black mb-4">
              Thông tin cơ bản
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Tên sản phẩm <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className="input-field"
                  placeholder="VD: Túi xách Chanel Classic Flap"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Mô tả
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  className="input-field resize-none"
                  rows={4}
                  placeholder="Mô tả chi tiết sản phẩm..."
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white border border-zinc-200 p-5">
            <h3 className="text-sm font-semibold text-black mb-4">
              Giá & Tình trạng
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Giá bán <span className="text-brand-red">*</span>
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  className="input-field"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Giá cũ
                </label>
                <input
                  type="number"
                  value={form.oldPrice}
                  onChange={(e) => set("oldPrice", e.target.value)}
                  className="input-field"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  % mới
                </label>
                <input
                  type="number"
                  value={form.conditionPercent}
                  onChange={(e) => set("conditionPercent", e.target.value)}
                  className="input-field"
                  placeholder="VD: 95"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Trọng lượng (g)
                </label>
                <input
                  type="number"
                  value={form.weight}
                  onChange={(e) => set("weight", e.target.value)}
                  className="input-field"
                  placeholder="500"
                  min="1"
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  Tính phí vận chuyển
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Tình trạng
                </label>
                <Combobox
                  options={conditionsList}
                  value={conditionsList.find(c => c.id === form.condition) || null}
                  onChange={(item) => set("condition", item?.id || "")}
                  placeholder="Chọn hoặc nhập tình trạng mới..."
                  displayValue={(item) => item?.name || ""}
                  renderOption={(item) => item.name}
                  onCreate={async (name) => {
                    const newItem = { id: name, name };
                    setConditionsList(prev => [...prev, newItem]);
                    return newItem;
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Loại hàng
                </label>
                <Combobox
                  options={authenticTypesList}
                  value={authenticTypesList.find(a => a.id === form.authenticType) || null}
                  onChange={(item) => set("authenticType", item?.id || "")}
                  placeholder="Chọn hoặc nhập loại hàng mới..."
                  displayValue={(item) => item?.name || ""}
                  renderOption={(item) => item.name}
                  onCreate={async (name) => {
                    const newItem = { id: name, name };
                    setAuthenticTypesList(prev => [...prev, newItem]);
                    return newItem;
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sizes */}
          <div className="bg-white border border-zinc-200 p-5">
            <h3 className="text-sm font-semibold text-black mb-4">
              Kích thước & Sizing
            </h3>
            <div>
              <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                Sizes (phân cách bằng dấu phẩy)
              </label>
              <input
                type="text"
                value={form.sizes}
                onChange={(e) => set("sizes", e.target.value)}
                className="input-field"
                placeholder="VD: S, M, L, XL"
              />
              <p className="text-xs text-zinc-400 mt-1">
                Gợi ý: {DEFAULT_SIZES.join(", ")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Chiều rộng
                </label>
                <input
                  type="text"
                  value={form.sizingRong}
                  onChange={(e) => set("sizingRong", e.target.value)}
                  className="input-field"
                  placeholder="VD: 30cm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Chiều dài
                </label>
                <input
                  type="text"
                  value={form.sizingDai}
                  onChange={(e) => set("sizingDai", e.target.value)}
                  className="input-field"
                  placeholder="VD: 40cm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Rộng Bụng
                </label>
                <input
                  type="text"
                  value={form.sizingBung}
                  onChange={(e) => set("sizingBung", e.target.value)}
                  className="input-field"
                  placeholder="VD: 80cm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Dài Quần
                </label>
                <input
                  type="text"
                  value={form.sizingDayQuan}
                  onChange={(e) => set("sizingDayQuan", e.target.value)}
                  className="input-field"
                  placeholder="VD: 60cm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Ống quần
                </label>
                <input
                  type="text"
                  value={form.sizingOngQuan}
                  onChange={(e) => set("sizingOngQuan", e.target.value)}
                  className="input-field"
                  placeholder="VD: 20cm"
                />
              </div>
            </div>
          </div>

          {/* Tồn kho theo size */}
          <div className="bg-white border border-zinc-200 p-5">
            <h3 className="text-sm font-semibold text-black mb-4">
              Tồn kho theo size
            </h3>
            {Object.keys(form.stockPerSize).length === 0 ? (
              <p className="text-sm text-zinc-400 italic">
                Nhập Sizes bên trên trước để thiết lập tồn kho.
              </p>
            ) : (
              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider w-1/2">
                        Size
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                        Số lượng tồn
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(form.stockPerSize).map(([size, qty], i) => (
                      <tr
                        key={size}
                        className={i % 2 === 0 ? "bg-white" : "bg-zinc-50"}
                      >
                        <td className="px-4 py-2 font-semibold text-zinc-800">
                          {size}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={qty}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                stockPerSize: {
                                  ...prev.stockPerSize,
                                  [size]: e.target.value,
                                },
                              }))
                            }
                            className="input-field w-28"
                            min="0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Dynamic Attributes */}
          {availableAttributes.length > 0 && (
            <div className="bg-white border border-zinc-200 p-5">
              <h3 className="text-sm font-semibold text-black mb-4">
                Thuộc tính mở rộng
              </h3>
              <div className="space-y-6">
                {availableAttributes.map((attr) => (
                  <div key={attr.id}>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
                      {attr.name}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {attr.values.map((val) => {
                        const isSelected = selectedAttrValueIds.includes(
                          val.id,
                        );
                        return (
                          <button
                            key={val.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedAttrValueIds((prev) =>
                                  prev.filter((id) => id !== val.id),
                                );
                              } else {
                                setSelectedAttrValueIds((prev) => [
                                  ...prev,
                                  val.id,
                                ]);
                              }
                            }}
                            className={`px-4 py-2 text-xs font-medium border transition-all ${
                              isSelected
                                ? "bg-black text-white border-black"
                                : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400"
                            }`}
                          >
                            {val.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-white border border-zinc-200 p-5">
            <h3 className="text-sm font-semibold text-black mb-4">
              Hình ảnh sản phẩm (Google Drive)
            </h3>
            <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
              Danh sách URL ảnh{" "}
              <span className="text-zinc-400 font-normal ml-1">
                (Mỗi dòng một link ảnh - Link Google Drive trực tiếp)
              </span>
            </label>
            <textarea
              value={form.images}
              onChange={(e) => set("images", e.target.value)}
              className="input-field resize-none font-mono text-xs"
              rows={6}
              placeholder="https://drive.google.com/file/d/...\nhttps://drive.google.com/file/d/..."
            />
            {previewImages.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {previewImages.map((url, i) => (
                  <div
                    key={i}
                    className="w-16 h-16 bg-zinc-100 rounded overflow-hidden border border-zinc-200"
                  >
                    <img
                      src={convertDriveLink(url)}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                      loading="eager"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - Settings */}
        <div className="space-y-5">
          {/* Publish settings */}
          <div className="bg-white border border-zinc-200 p-5">
            <h3 className="text-sm font-semibold text-black mb-4">Cài đặt</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Trạng thái
                </label>
                {form.scheduledAt ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg">
                      ĐANG ĐẶT LỊCH — Sẽ tự động chuyển sang ĐANG BÁN khi đến
                      giờ
                    </span>
                    <select
                      value="DRAFT"
                      disabled
                      className="input-field text-sm opacity-50 cursor-not-allowed"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                    className="input-field text-sm"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">Hot Deal</p>
                  <p className="text-xs text-zinc-400">Hiển thị nhãn HOT</p>
                </div>
                <button
                  type="button"
                  onClick={() => set("isHotDeal", !form.isHotDeal)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.isHotDeal ? "bg-black" : "bg-zinc-300"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isHotDeal ? "translate-x-5" : ""}`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">Hàng mới về</p>
                  <p className="text-xs text-zinc-400">Hiển thị nhãn MỚI</p>
                </div>
                <button
                  type="button"
                  onClick={() => set("isNewArrival", !form.isNewArrival)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.isNewArrival ? "bg-black" : "bg-zinc-300"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isNewArrival ? "translate-x-5" : ""}`}
                  />
                </button>
              </div>
            </div>

            {/* Scheduling */}
            <div className="border-t border-zinc-100 pt-3 mt-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-black">
                    Lên lịch đăng
                  </p>
                  <p className="text-xs text-zinc-400">
                    Tự động đăng khi đến giờ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => {
                      if (prev.scheduledAt) {
                        return {
                          ...prev,
                          scheduledAt: "",
                          status: "AVAILABLE",
                        };
                      }
                      return {
                        ...prev,
                        scheduledAt: getDefaultScheduleTime(),
                        status: "DRAFT",
                      };
                    })
                  }
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${form.scheduledAt ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-zinc-50 border-zinc-200 text-zinc-500"}`}
                >
                  {form.scheduledAt ? "Hủy lịch" : "Đặt lịch"}
                </button>
              </div>
              {form.scheduledAt && (
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => set("scheduledAt", e.target.value)}
                  className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                />
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white border border-zinc-200 p-5">
            <h3 className="text-sm font-semibold text-black mb-4">Tags</h3>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              className="input-field text-sm"
              placeholder="VD: NEW, HOT, SALE 20%"
            />
            <p className="text-xs text-zinc-400 mt-1">
              Phân cách bằng dấu phẩy
            </p>
          </div>

          {/* SEO Settings */}
          <div className="bg-black text-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-sm font-bold uppercase tracking-widest">
                Tối ưu hóa SEO
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mb-1.5">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={form.seoTitle}
                  onChange={(e) => set("seoTitle", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600"
                  placeholder="Tiêu đề trên Google..."
                  maxLength={60}
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  {form.seoTitle.length} / 60 ký tự
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mb-1.5">
                  SEO Description
                </label>
                <textarea
                  value={form.seoDescription}
                  onChange={(e) => set("seoDescription", e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 resize-none"
                  rows={3}
                  placeholder="Mô tả trên Google..."
                  maxLength={160}
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  {form.seoDescription.length} / 160 ký tự
                </p>
              </div>
            </div>
          </div>

          {/* Brand & Category */}
          <div className="bg-white border border-zinc-200 p-5">
            <h3 className="text-sm font-semibold text-black mb-4">Phân loại</h3>
            <div className="space-y-3">
              {/* Brand */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Thương hiệu
                </label>
                <Combobox
                  options={brandsList}
                  value={brandsList.find((b) => b.id === form.brandId) ?? null}
                  onChange={(item) =>
                    setForm((prev) => ({
                      ...prev,
                      brandId: item?.id ?? "",
                      brandName: item?.name ?? "",
                    }))
                  }
                  placeholder="Nhập hoặc chọn thương hiệu..."
                  displayValue={(item) => item?.name ?? ""}
                  renderOption={(item) => item.name}
                  onCreate={async (name) => {
                    const generateSlug = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
                    const newBrand = await createBrand({ name, slug: generateSlug(name) });
                    setBrandsList(prev => [...prev, newBrand]);
                    return newBrand;
                  }}
                />
              </div>
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Danh mục
                </label>
                <Combobox
                  options={categoriesList}
                  value={
                    categoriesList.find((c) => c.id === form.categoryId) ?? null
                  }
                  onChange={(item) =>
                    setForm((prev) => ({
                      ...prev,
                      categoryId: item?.id ?? "",
                      categoryName: item?.name ?? "",
                    }))
                  }
                  placeholder="Nhập/chọn danh mục (VD: Áo > Áo thun)..."
                  displayValue={(item) => item?.name ?? ""}
                  renderOption={(item) => item.name}
                  onCreate={async (name) => {
                    const generateSlug = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
                    if (name.includes('>')) {
                      const parts = name.split('>');
                      const parentName = parts[0].trim();
                      const childName = parts[1].trim();
                      
                      if (!parentName || !childName) {
                        const cleanName = name.replace('>', '').trim();
                        const newCategory = await createCategory({ name: cleanName, slug: generateSlug(cleanName) });
                        setCategoriesList(prev => [...prev, newCategory as any]);
                        return newCategory as any;
                      }

                      let parent = categoriesList.find(c => c.name.toLowerCase() === parentName.toLowerCase());
                      const addedToState: any[] = [];
                      
                      if (!parent) {
                        parent = await createCategory({ name: parentName, slug: generateSlug(parentName) }) as any;
                        addedToState.push(parent);
                      }

                      const child = await createCategory({ name: childName, slug: generateSlug(childName), parentId: parent?.id }) as any;
                      addedToState.push(child);

                      setCategoriesList(prev => [...prev, ...addedToState]);
                      return child;
                    } else {
                      const newCategory = await createCategory({ name, slug: generateSlug(name) });
                      setCategoriesList(prev => [...prev, newCategory as any]);
                      return newCategory as any;
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                  Người bán (Ký gửi)
                </label>
                <select
                  value={form.sellerId}
                  onChange={(e) => set("sellerId", e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">
                    -- THRIFT.VN Official (Shop tự bán) --
                  </option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Chọn user nếu đây là hàng ký gửi của khách.
                </p>
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
              {saving
                ? "Đang lưu..."
                : mode === "create"
                  ? "Tạo sản phẩm"
                  : "Lưu thay đổi"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
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
