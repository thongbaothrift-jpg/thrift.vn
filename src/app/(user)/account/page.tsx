"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { getProducts } from "@/lib/api";
import type { Product } from "@/lib/api/types";
import { useWishlist } from "@/lib/wishlist-context";
import { useAuth } from "@/lib/auth-context";
import { convertDriveLink } from "@/lib/utils";
import { updateUserProfile, changeUserPassword } from "@/lib/api/user";
import { setPassword } from "@/lib/api/auth";
import { getOrders } from "@/lib/api/orders";
import type { Order } from "@/lib/api/orders";
import {
  getMySellRequests,
  respondToSellOffer,
  createShipment,
  cancelShipment,
} from "@/lib/api/sell";
import type { SellRequest } from "@/lib/api/sell";

type Tab = "purchases" | "selling" | "wishlist" | "settings";

const TABS: { id: Tab; label: string }[] = [
  { id: "purchases", label: "Lịch sử mua hàng" },
  { id: "selling", label: "Đang bán" },
  { id: "wishlist", label: "Yêu thích" },
  { id: "settings", label: "Cài đặt" },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Đang xử lý", color: "bg-yellow-100 text-yellow-700" },
  processing: { label: "Đang xử lý", color: "bg-yellow-100 text-yellow-700" },
  shipped: { label: "Đang giao", color: "bg-blue-100 text-blue-700" },
  delivered: { label: "Đã giao", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
};

const formatPriceRq = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    price,
  );

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, token, refreshUser } =
    useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("purchases");
  const { items } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [sellRequests, setSellRequests] = useState<SellRequest[]>([]);
  const [sellRequestsLoading, setSellRequestsLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    getProducts()
      .then((res) => setProducts(res.products ?? []))
      .catch(() => setProducts([]));
  }, []);

  // Fetch orders when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setOrdersLoading(true);
      getOrders()
        .then(setOrders)
        .catch(() => setOrders([]))
        .finally(() => setOrdersLoading(false));
      setSellRequestsLoading(true);
      getMySellRequests()
        .then(setSellRequests)
        .catch(() => setSellRequests([]))
        .finally(() => setSellRequestsLoading(false));
    }
  }, [isAuthenticated]);

  const wishlistProducts = items
    .map((item) => products.find((p) => p.id === item.id))
    .filter((p): p is Product => p !== undefined);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-zinc-500">Đang tải...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">
            Xin chào, {user.firstName} {user.lastName}
          </h1>
          <p className="text-zinc-500 mt-2">{user.email}</p>
        </div>
        <button onClick={handleLogout} className="btn-ghost">
          Đăng xuất
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 mb-12">
        <nav className="flex gap-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 font-label transition-colors relative ${
                activeTab === tab.id
                  ? "text-black border-b-2 border-black"
                  : "text-zinc-500 hover:text-black"
              }`}
            >
              {tab.label}
              {tab.id === "wishlist" && items.length > 0 && (
                <span className="ml-2 text-xs bg-zinc-200 px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "purchases" && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold uppercase tracking-tight">
                Lịch sử mua hàng
              </h2>
              <div className="flex gap-2">
                <select className="input-field py-2 text-sm w-auto">
                  <option>Tất cả</option>
                  <option>Đã giao</option>
                  <option>Đang giao</option>
                  <option>Đang xử lý</option>
                </select>
              </div>
            </div>
            {ordersLoading ? (
              <div className="text-center py-20 text-zinc-500">
                Đang tải đơn hàng...
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white border border-zinc-200 overflow-hidden"
                  >
                    <div className="flex flex-wrap justify-between items-center gap-4 p-6 bg-zinc-50 border-b border-zinc-200">
                      <div className="flex flex-wrap items-center gap-6">
                        <div>
                          <span className="font-label text-zinc-500 block text-[10px]">
                            MÃ ĐƠN HÀNG
                          </span>
                          <span className="font-bold">
                            ORD-{order.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="font-label text-zinc-500 block text-[10px]">
                            NGÀY ĐẶT
                          </span>
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                        <div>
                          <span className="font-label text-zinc-500 block text-[10px]">
                            TỔNG CỘNG
                          </span>
                          <span className="font-bold text-brand-red">
                            {formatPriceRq(order.total)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${statusConfig[order.status.toLowerCase()]?.color || "bg-zinc-100 text-zinc-700"}`}
                        >
                          {statusConfig[order.status.toLowerCase()]?.label ||
                            order.status}
                        </span>
                        <Link
                          href={`/account/orders/${order.id}`}
                          className="btn-ghost py-2 text-[10px]"
                        >
                          Chi tiết
                        </Link>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap gap-4">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex gap-4 items-center bg-zinc-50 p-3 min-w-[280px]"
                          >
                            <div className="relative w-16 h-20 bg-zinc-200 overflow-hidden flex-shrink-0">
                              <Image
                                src={
                                  convertDriveLink(item.product.images?.[0]) ||
                                  "/placeholder-product.jpg"
                                }
                                alt={item.product.name}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-sm line-clamp-2">
                                {item.product.name}
                              </p>
                              <p className="text-zinc-500 text-sm">
                                SL: {item.quantity}
                                {item.size ? ` / ${item.size}` : ""}
                              </p>
                              <p className="font-semibold text-sm mt-1">
                                {formatPriceRq(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-zinc-500 mb-6">Chưa có đơn hàng nào</p>
                <Link href="/shop" className="btn-primary inline-block">
                  Bắt đầu mua sắm
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "selling" && (
          <SellingTab
            requests={sellRequests}
            loading={sellRequestsLoading}
            onUpdate={() => {
              setSellRequestsLoading(true);
              getMySellRequests()
                .then(setSellRequests)
                .catch(() => setSellRequests([]))
                .finally(() => setSellRequestsLoading(false));
            }}
          />
        )}

        {activeTab === "wishlist" && (
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight mb-8">
              Yêu thích của tôi
            </h2>
            {wishlistProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {wishlistProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-zinc-500 mb-6">Danh sách yêu thích trống</p>
                <Link href="/shop" className="btn-primary inline-block">
                  Bắt đầu mua sắm
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <SettingsTab
            user={user}
            token={token}
            onProfileUpdate={refreshUser}
          />
        )}
      </div>
    </div>
  );
}

const sellStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "Đã duyệt", color: "bg-blue-100 text-blue-700" },
  REJECTED: { label: "Từ chối", color: "bg-red-100 text-red-700" },
  RECEIVED: { label: "Đã nhận", color: "bg-purple-100 text-purple-700" },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
};

const itemStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "Đã duyệt", color: "bg-blue-100 text-blue-700" },
  REJECTED: { label: "Từ chối", color: "bg-red-100 text-red-700" },
  RECEIVED: { label: "Đã nhận", color: "bg-purple-100 text-purple-700" },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
};

function SellingTab({
  requests,
  loading,
  onUpdate,
}: {
  requests: SellRequest[];
  loading: boolean;
  onUpdate: () => void;
}) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [cancelSuccessId, setCancelSuccessId] = useState<string | null>(null);
  const [counterItemId, setCounterItemId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState<string>("");

  const handleResponse = async (
    itemId: string,
    action: "ACCEPT" | "REJECT" | "COUNTER_OFFER",
    expectedPrice?: number,
  ) => {
    try {
      setProcessingId(itemId);
      await respondToSellOffer(itemId, action, expectedPrice);
      onUpdate();
      if (action === "COUNTER_OFFER") {
        setCounterItemId(null);
        setCounterPrice("");
      }
    } catch (err: any) {
      alert(err.message || "Thao tác thất bại");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateShipment = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      await createShipment(requestId);
      onUpdate();
    } catch (err: any) {
      alert(err.message || "Tạo vận đơn thất bại");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelShipment = async (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this shipment?")) return;
    if (!confirm("Bạn có chắc muốn hủy vận đơn này không?")) return;
    try {
      setProcessingId(requestId);
      await cancelShipment(requestId);
      onUpdate();
      setCancelSuccessId(requestId);
      setTimeout(() => setCancelSuccessId(null), 3000);
    } catch (err: any) {
      alert(err.message || "Huỷ vận đơn thất bại");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold uppercase tracking-tight">
          Yêu cầu ký gửi / Thu mua
        </h2>
        <Link href="/sell" className="btn-secondary">
          Gửi yêu cầu mới
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white border border-zinc-200 p-6">
              <div className="h-4 bg-zinc-100 rounded animate-pulse w-48 mb-4" />
              <div className="h-3 bg-zinc-100 rounded animate-pulse w-32" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-500 mb-6">Bạn chưa có yêu cầu ký gửi nào</p>
          <Link href="/sell" className="btn-primary inline-block">
            Bắt đầu ký gửi
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((req) => {
            const sc = sellStatusConfig[req.status] || {
              label: req.status,
              color: "bg-zinc-100 text-zinc-700",
            };
            return (
              <div
                key={req.id}
                className="bg-white border border-zinc-200 overflow-hidden"
              >
                {/* Request header */}
                <div className="flex flex-wrap justify-between items-center gap-4 p-6 bg-zinc-50 border-b border-zinc-200">
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <span className="font-label text-zinc-500 block text-[10px]">
                        MÃ YÊU CẦU
                      </span>
                      <span className="font-bold text-xs font-mono">
                        {req.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="font-label text-zinc-500 block text-[10px]">
                        LOẠI
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          req.saleType === "CONSIGNMENT"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {req.saleType === "CONSIGNMENT" ? "Ký gửi" : "Thu mua"}
                      </span>
                    </div>
                    <div>
                      <span className="font-label text-zinc-500 block text-[10px]">
                        NGÀY GỬI
                      </span>
                      <span>{formatDate(req.createdAt)}</span>
                    </div>
                    <div>
                      <span className="font-label text-zinc-500 block text-[10px]">
                        SẢN PHẨM
                      </span>
                      <span className="font-semibold">
                        {req.items?.length || 0}
                      </span>
                    </div>
                    {req.supershipPickupCode && req.status !== "REJECTED" ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-label text-zinc-500 block text-[10px]">
                            VẬN ĐƠN
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <a
                            href={`https://khachhang.supership.vn/orders/awb?q=${req.supershipPickupCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-xs text-brand-red hover:underline"
                          >
                            {req.supershipPickupCode}
                          </a>
                          <button
                            onClick={() => handleCancelShipment(req.id)}
                            disabled={
                              processingId === req.id ||
                              cancelSuccessId === req.id
                            }
                            className={
                              cancelSuccessId === req.id
                                ? "px-2 py-0.5 text-[10px] font-medium border border-green-300 text-green-600 bg-green-50 rounded flex items-center gap-1"
                                : processingId === req.id
                                  ? "px-2 py-0.5 text-[10px] font-medium text-zinc-500 border border-zinc-300 rounded disabled:opacity-50"
                                  : "px-2 py-0.5 text-[10px] font-medium text-zinc-500 border border-zinc-300 hover:border-red-400 hover:text-red-500 transition-colors rounded"
                            }
                          >
                            {cancelSuccessId === req.id ? (
                              <>
                                <svg
                                  className="w-2.5 h-2.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Đã huỷ
                              </>
                            ) : processingId === req.id ? (
                              "Đang huỷ..."
                            ) : (
                              "Huỷ"
                            )}
                          </button>
                        </div>
                      </div>
                    ) : req.supershipPickupCode && req.status === "REJECTED" ? (
                      <div className="flex flex-col gap-1">
                        <span className="font-label text-zinc-500 block text-[10px]">
                          VẬN ĐƠN
                        </span>
                        <span className="text-red-500 text-xs font-bold flex items-center gap-1 mt-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            ></path>
                          </svg>
                          Đã huỷ
                        </span>
                      </div>
                    ) : (req.items || []).some(
                        (i) => i.itemStatus === "APPROVED",
                      ) ? (
                      <button
                        onClick={() => handleCreateShipment(req.id)}
                        disabled={processingId === req.id}
                        className="mt-1 px-3 py-1.5 text-[10px] font-bold bg-brand-red text-white hover:bg-red-700 transition-colors rounded-md disabled:opacity-50"
                      >
                        {processingId === req.id
                          ? "Đang tạo..."
                          : "🛒 Tạo vận đơn"}
                      </button>
                    ) : null}
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${sc.color}`}
                  >
                    {sc.label}
                  </span>
                </div>

                {/* Admin notes */}
                {/* {req.notes && (
                  <div className="px-6 py-4 bg-yellow-50/50 border-b border-zinc-200">
                    <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest mb-1">GHI CHÚ TỪ SHOP (MÃ VẬN ĐƠN GHN...)</p>
                    <p className="text-sm font-medium text-yellow-900 whitespace-pre-wrap">{req.notes}</p>
                  </div>
                )} */}

                {/* Items */}
                <div className="p-6 space-y-4">
                  {(req.items || []).map((item) => {
                    const ic = itemStatusConfig[item.itemStatus] || {
                      label: item.itemStatus,
                      color: "bg-zinc-100 text-zinc-700",
                    };
                    return (
                      <div
                        key={item.id}
                        className="flex gap-4 items-center bg-zinc-50 p-4"
                      >
                        <div className="flex gap-2 flex-shrink-0">
                          {item.images.slice(0, 2).map((img, i) => (
                            <div
                              key={i}
                              className="w-14 h-14 bg-zinc-200 rounded overflow-hidden"
                            >
                              <img
                                src={convertDriveLink(img)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm line-clamp-1">
                                {item.productName}
                              </p>
                              <p className="text-zinc-400 text-xs">
                                {item.brandName} · {item.categoryName}
                              </p>
                              <p className="text-zinc-400 text-xs">
                                Giá mong muốn:{" "}
                                {item.expectedPrice != null
                                  ? formatPriceRq(item.expectedPrice)
                                  : "Chưa có"}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold rounded flex-shrink-0 ${ic.color}`}
                            >
                              {ic.label}
                            </span>
                          </div>
                          {item.offeredPrice != null &&
                            item.itemStatus === "PENDING" && (
                              <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-lg">
                                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                                  Đề xuất từ Shop
                                </p>
                                <div className="flex flex-col gap-3">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-col">
                                      <p className="text-green-700 font-bold text-base">
                                        {formatPriceRq(item.offeredPrice)}
                                      </p>
                                      {item.dealHistory
                                        ?.filter((h) => h.actor === "ADMIN")
                                        .pop()?.note && (
                                        <p className="text-[11px] text-zinc-600 mt-0.5 italic">
                                          "
                                          {
                                            item.dealHistory
                                              .filter(
                                                (h) => h.actor === "ADMIN",
                                              )
                                              .pop()?.note
                                          }
                                          "
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          setCounterItemId(item.id);
                                          setCounterPrice(
                                            item.expectedPrice?.toString() ||
                                              "",
                                          );
                                        }}
                                        disabled={
                                          processingId === item.id ||
                                          counterItemId === item.id
                                        }
                                        className="px-3 py-1.5 text-[10px] font-bold border border-zinc-200 text-zinc-600 hover:bg-zinc-100 transition-colors rounded-md disabled:opacity-50 uppercase"
                                      >
                                        Thương lượng
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleResponse(item.id, "REJECT")
                                        }
                                        disabled={processingId === item.id}
                                        className="px-3 py-1.5 text-xs font-bold border border-red-200 text-red-600 hover:bg-red-50 transition-colors rounded-md disabled:opacity-50"
                                      >
                                        Từ chối
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleResponse(item.id, "ACCEPT")
                                        }
                                        disabled={processingId === item.id}
                                        className="px-4 py-1.5 text-xs font-bold bg-black text-white hover:bg-zinc-800 transition-colors rounded-md shadow-sm disabled:opacity-50"
                                      >
                                        {processingId === item.id &&
                                        !counterItemId
                                          ? "..."
                                          : "Chấp nhận"}
                                      </button>
                                    </div>
                                  </div>
                                  {counterItemId === item.id && (
                                    <div className="flex items-center gap-2 mt-2 pt-3 border-t border-green-200">
                                      <input
                                        type="number"
                                        value={counterPrice}
                                        onChange={(e) =>
                                          setCounterPrice(e.target.value)
                                        }
                                        placeholder="Nhập giá mong muốn..."
                                        className="input-field py-1.5 text-xs font-bold flex-1"
                                      />
                                      <button
                                        onClick={() =>
                                          handleResponse(
                                            item.id,
                                            "COUNTER_OFFER",
                                            Number(counterPrice),
                                          )
                                        }
                                        disabled={
                                          processingId === item.id ||
                                          !counterPrice
                                        }
                                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 disabled:opacity-50"
                                      >
                                        Gửi giá
                                      </button>
                                      <button
                                        onClick={() => setCounterItemId(null)}
                                        className="px-2 py-1.5 text-xs text-zinc-500 font-bold hover:text-black"
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          {item.offeredPrice == null &&
                            item.itemStatus === "PENDING" &&
                            item.expectedPrice != null && (
                              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                                <p className="text-yellow-700 text-xs font-bold flex items-center gap-2">
                                  <svg
                                    className="w-4 h-4 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M12 4V2M12 22V20M4 12H2M22 12H20M17.6569 6.34315L19.0711 4.92893M4.92893 19.0711L6.34315 17.6569M17.6569 17.6569L19.0711 19.0711M4.92893 4.92893L6.34315 6.34315"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  Đang chờ Shop phản hồi giá đề xuất...
                                </p>
                              </div>
                            )}
                          {item.itemStatus === "APPROVED" && (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                              <p className="font-bold mb-1 flex items-center gap-1">
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  ></path>
                                </svg>
                                Đã chấp nhận đề xuất
                              </p>
                              {req.supershipPickupCode ? (
                                <p>
                                  Đơn vận chuyển đã được tạo. Vui lòng chờ
                                  shipper liên hệ để lấy hàng. Bạn có thể bấm{" "}
                                  <strong>"Huỷ"</strong> để huỷ vận đơn nếu cần.
                                </p>
                              ) : (
                                <div>
                                  <p>
                                    Vui lòng bấm <strong>"Tạo vận đơn"</strong>{" "}
                                    ở phía trên để shipper đến lấy hàng.
                                  </p>
                                  <p className="mt-1 text-[11px] text-zinc-500 italic">
                                    *Phí vận chuyển: 1 món 25k, từ món thứ 2
                                    cộng thêm 3k/món. Phí này sẽ được trừ sau
                                    khi shop thanh toán cho bạn.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          {item.itemStatus === "REJECTED" && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
                              <p className="font-bold mb-1 flex items-center gap-1">
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                  ></path>
                                </svg>
                                Bạn đã từ chối đề xuất
                              </p>
                            </div>
                          )}
                          {item.rejectionNote && (
                            <p className="text-red-600 text-xs mt-2 italic flex items-center gap-1">
                              <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                              Lý do: {item.rejectionNote}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Notes */}
                {req.notes && (
                  <div className="px-6 pb-6">
                    <div className="bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
                      <p className="font-label text-yellow-600 text-[10px] mb-1">
                        GHI CHÚ TỪ SHOP
                      </p>
                      {req.notes}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Settings sub-component
function SettingsTab({
  user,
  token,
  onProfileUpdate,
}: {
  user: any;
  token: string | null;
  onProfileUpdate: () => void;
}) {
  const [profileForm, setProfileForm] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phone: user.phone || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setProfileLoading(true);
    setProfileMsg({ type: "", text: "" });

    try {
      await updateUserProfile(
        {
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          phone: profileForm.phone,
        },
        token,
      );
      setProfileMsg({
        type: "success",
        text: "Cập nhật thông tin thành công!",
      });
      onProfileUpdate();
    } catch (err: any) {
      setProfileMsg({
        type: "error",
        text: err.message || "Cập nhật thất bại.",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: "error", text: "Mật khẩu mới không khớp." });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordMsg({
        type: "error",
        text: "Mật khẩu mới phải có ít nhất 8 ký tự.",
      });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg({ type: "", text: "" });

    try {
      if (user.hasPassword) {
        await changeUserPassword(
          {
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          },
          token,
        );
        setPasswordMsg({ type: "success", text: "Đổi mật khẩu thành công!" });
      } else {
        await setPassword(
          {
            newPassword: passwordForm.newPassword,
          },
          token,
        );
        setPasswordMsg({ type: "success", text: "Thiết lập mật khẩu thành công!" });
        // Cập nhật local state user để hiển thị đúng form đổi mật khẩu cho lần sau (có thể cần reload component)
        user.hasPassword = true;
      }
      
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      setPasswordMsg({
        type: "error",
        text: err.message || "Thao tác thất bại.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold uppercase tracking-tight mb-8">
        Cài đặt tài khoản
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div className="bg-white border border-zinc-200 p-8">
          <h3 className="font-bold text-lg mb-6">Thông tin cá nhân</h3>
          {profileMsg.text && (
            <div
              className={`mb-4 px-4 py-3 text-sm rounded ${profileMsg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"}`}
            >
              {profileMsg.text}
            </div>
          )}
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-label text-zinc-700 mb-2">
                  Họ
                </label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      firstName: e.target.value,
                    })
                  }
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block font-label text-zinc-700 mb-2">
                  Tên
                </label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, lastName: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block font-label text-zinc-700 mb-2">
                Email{" "}
                {user.provider === "google" && (
                  <span className="text-zinc-400 font-normal text-xs ml-1">
                    (đăng nhập bằng Google)
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user.email}
                  className="input-field pr-10"
                  disabled
                />
                {user.provider === "google" && (
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
              </div>
            </div>
            <div>
              <label className="block font-label text-zinc-700 mb-2">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, phone: e.target.value })
                }
                className="input-field"
                placeholder="+84 ..."
              />
            </div>
            <button
              type="submit"
              disabled={profileLoading}
              className="btn-ghost mt-2 disabled:opacity-50"
            >
              {profileLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        </div>

        {/* Password Management */}
        <div className="bg-white border border-zinc-200 p-8">
          <h3 className="font-bold text-lg mb-6">
            {user.hasPassword ? "Đổi mật khẩu" : "Thiết lập mật khẩu"}
          </h3>
          {passwordMsg.text && (
            <div
              className={`mb-4 px-4 py-3 text-sm rounded ${passwordMsg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"}`}
            >
              {passwordMsg.text}
            </div>
          )}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {user.hasPassword && (
              <div>
                <label className="block font-label text-zinc-700 mb-2">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  className="input-field"
                  placeholder="Nhập mật khẩu hiện tại"
                  required={user.hasPassword}
                />
              </div>
            )}
            <div>
              <label className="block font-label text-zinc-700 mb-2">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                className="input-field"
                placeholder="Ít nhất 8 ký tự"
                required
              />
            </div>
            <div>
              <label className="block font-label text-zinc-700 mb-2">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                className="input-field"
                placeholder="Nhập lại mật khẩu mới"
                required
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="btn-ghost mt-2 disabled:opacity-50"
            >
              {passwordLoading
                ? "Đang cập nhật..."
                : user.hasPassword
                  ? "Cập nhật mật khẩu"
                  : "Thiết lập mật khẩu"}
            </button>
          </form>
        </div>
      </div>

      {/* Danger Zone */}
      {false && (
        <div className="bg-white border border-red-200 p-8 mt-8">
          <h3 className="font-bold text-lg mb-4 text-red-600">
            Vùng nguy hiểm
          </h3>
          <p className="text-sm text-zinc-500 mb-6">
            Sau khi xóa tài khoản, bạn sẽ không thể khôi phục. Vui lòng chắc
            chắn.
          </p>
          <button className="bg-red-600 text-white px-6 py-3 font-label hover:bg-red-700 transition-colors">
            Xóa tài khoản
          </button>
        </div>
      )}
    </div>
  );
}
