"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteProduct,
  updateProduct,
  type AdminProduct,
} from "@/lib/api/admin";
import { convertDriveLink } from "@/lib/utils";
import {
  Search,
  Plus,
  Edit2,
  Eye,
  EyeOff,
  Trash2,
  Package,
  Copy,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "AVAILABLE", label: "Đang bán" },
  { value: "DRAFT", label: "Nháp" },
  { value: "HIDDEN", label: "Ẩn" },
  { value: "SOLD_OUT", label: "Hết hàng" },
];

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  DRAFT: "bg-zinc-100 text-zinc-800",
  HIDDEN: "bg-red-50 text-red-600",
  SOLD_OUT: "bg-amber-100 text-amber-800",
};

const CONDITION_LABELS: Record<string, string> = {
  NEW_WITH_TAGS: "Mới có tag",
  LIKE_NEW: "Như mới",
  EXCELLENT: "Tốt",
  GOOD: "Khá",
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v);
}

interface ProductTableClientProps {
  initialProducts: AdminProduct[];
  initialTotal: number;
  initialFilters: {
    status: string;
    search: string;
    page: number;
    limit: number;
  };
}

export function ProductTableClient({
  initialProducts,
  initialTotal,
  initialFilters,
}: ProductTableClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [actionId, setActionId] = useState<string | null>(null);
  const [search, setSearch] = useState(initialFilters.search);
  const [statusFilter, setStatusFilter] = useState(initialFilters.status);

  // Sync state when server data changes (navigation between pages)
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Sync search & status from URL when navigating
  useEffect(() => {
    setSearch(initialFilters.search);
    setStatusFilter(initialFilters.status);
  }, [initialFilters.search, initialFilters.status]);

  const updateUrl = (overrides: any) => {
    const params = new URLSearchParams();
    const s = overrides.search !== undefined ? overrides.search : search;
    const st = overrides.status !== undefined ? overrides.status : statusFilter;
    const p =
      overrides.page !== undefined ? overrides.page : initialFilters.page;

    if (s) params.set("search", s);
    if (st) params.set("status", st);
    if (p > 1) params.set("page", p.toString());

    startTransition(() => {
      router.push(`/admin/products?${params.toString()}`);
    });
  };

  const handleToggleStatus = async (product: AdminProduct) => {
    const isHiding = product.status === "AVAILABLE";
    const message = isHiding
      ? `Bạn có chắc chắn muốn ẩn sản phẩm "${product.name}"?`
      : `Hiện lại sản phẩm "${product.name}"?`;

    if (!window.confirm(message)) return;

    setActionId(product.id);
    try {
      const newStatus = isHiding ? "HIDDEN" : "AVAILABLE";
      const updated = await updateProduct(product.id, { status: newStatus });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, status: updated.status } : p,
        ),
      );
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi cập nhật");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (product: AdminProduct) => {
    if (!confirm(`Xóa sản phẩm "${product.name}"?`)) return;
    setActionId(product.id);
    try {
      await deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi xóa");
    } finally {
      setActionId(null);
    }
  };

  const totalPages = Math.ceil(initialTotal / initialFilters.limit);

  return (
    <div
      className={`space-y-4 transition-opacity duration-300 ${isPending ? "opacity-50 grayscale-[0.2]" : "opacity-100"}`}
    >
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
              size={18}
            />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateUrl({ page: 1 });
              }}
            >
              <input
                type="text"
                placeholder="Tìm sản phẩm, SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-black/5 outline-none shadow-sm transition-all"
              />
            </form>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              const val = e.target.value;
              setStatusFilter(val);
              updateUrl({ status: val, page: 1 });
            }}
            className="px-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-black/5 outline-none shadow-sm cursor-pointer min-w-[160px]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <Link
          href="/admin/products/new"
          className="bg-black text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Tạo sản phẩm
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Sản phẩm
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Thương hiệu
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Giá bán
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Kho hàng
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Trạng thái
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Lịch đăng
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-zinc-400">
                    Không có sản phẩm nào.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-zinc-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white border border-zinc-100 rounded-xl overflow-hidden shrink-0 relative p-1 shadow-sm">
                          {product.images[0] ? (
                            <img
                              src={convertDriveLink(product.images[0])}
                              alt={product.name}
                              className="w-full h-full object-contain"
                              loading="eager"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-300">
                              <Package size={18} />
                            </div>
                          )}
                        </div>
                        <div className="max-w-[200px]">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="font-black text-black text-sm tracking-tight hover:text-zinc-600 transition-colors line-clamp-1 block"
                          >
                            {product.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
                              {CONDITION_LABELS[product.condition] ||
                                product.condition}
                            </span>
                            {product.isHotDeal && (
                              <span className="text-[8px] font-black bg-red-500 text-white px-1 rounded-sm">
                                HOT
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-zinc-600 uppercase tracking-tight">
                        {product.brand?.name || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-black">
                        {formatCurrency(product.price)}
                      </p>
                      {product.oldPrice && (
                        <p className="text-[10px] text-zinc-400 line-through font-bold">
                          {formatCurrency(product.oldPrice)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {(product.stockPerSize as Record<
                        string,
                        number
                      > | null) ? (
                        (() => {
                          const total = Object.values(
                            product.stockPerSize as Record<string, number>,
                          ).reduce((sum, q) => sum + (q || 0), 0);
                          return (
                            <span
                              className={`text-xs font-black ${total <= 0 ? "text-red-500" : total <= 3 ? "text-amber-500" : "text-zinc-900"}`}
                            >
                              {total}
                            </span>
                          );
                        })()
                      ) : (
                        <span
                          className={`text-xs font-black ${product.stock <= 0 ? "text-red-500" : product.stock <= 3 ? "text-amber-500" : "text-zinc-900"}`}
                        >
                          {product.stock}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${STATUS_COLORS[product.status] || "bg-zinc-100 text-zinc-800"}`}
                      >
                        {STATUS_OPTIONS.find((o) => o.value === product.status)
                          ?.label || product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {(product as any).scheduledAt ? (
                        <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                          {new Date(
                            (product as any).scheduledAt,
                          ).toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <Link
                          href={`/admin/products/new?cloneFrom=${product.id}`}
                          title="Sao chép sản phẩm"
                          className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Copy size={16} />
                        </Link>
                        <Link
                          href={`/admin/products/${product.id}`}
                          title="Sửa sản phẩm"
                          className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(product)}
                          disabled={actionId === product.id}
                          className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-all disabled:opacity-50"
                        >
                          {product.status === "AVAILABLE" ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          disabled={actionId === product.id}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-5 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
              Showing {(initialFilters.page - 1) * initialFilters.limit + 1} to{" "}
              {Math.min(
                initialFilters.page * initialFilters.limit,
                initialTotal,
              )}{" "}
              of {initialTotal} Products
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
                if (
                  p === 1 ||
                  p === totalPages ||
                  (p >= initialFilters.page - 1 && p <= initialFilters.page + 1)
                ) {
                  return (
                    <button
                      key={p}
                      onClick={() => updateUrl({ page: p })}
                      className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                        p === initialFilters.page
                          ? "bg-black text-white shadow-lg shadow-black/10"
                          : "border border-zinc-200 text-zinc-400 hover:border-black hover:text-black"
                      }`}
                    >
                      {p}
                    </button>
                  );
                }
                if (
                  p === initialFilters.page - 2 ||
                  p === initialFilters.page + 2
                )
                  return (
                    <span key={p} className="flex items-end pb-2 text-zinc-300">
                      ...
                    </span>
                  );
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
