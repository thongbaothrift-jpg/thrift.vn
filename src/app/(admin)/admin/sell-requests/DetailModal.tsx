"use client";

import { useState, memo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  getAdminSellRequest,
  type SellRequest,
  type SellRequestItem,
} from "@/lib/api/sell";

const itemStatusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  PENDING: {
    label: "Chờ duyệt",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
  },
  APPROVED: { label: "Chấp nhận", color: "text-blue-700", bg: "bg-blue-100" },
  REJECTED: { label: "Từ chối", color: "text-red-700", bg: "bg-red-100" },
  RECEIVED: { label: "Đã nhận", color: "text-purple-700", bg: "bg-purple-100" },
  COMPLETED: {
    label: "Hoàn thành",
    color: "text-green-700",
    bg: "bg-green-100",
  },
};

const pickupStatusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  PENDING_PICKUP: {
    label: "Chờ lấy hàng",
    color: "text-yellow-700",
    bg: "bg-yellow-50 border-yellow-200",
  },
  PICKING_UP: {
    label: "Đang lấy hàng",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  IN_TRANSIT: {
    label: "Đang vận chuyển",
    color: "text-indigo-700",
    bg: "bg-indigo-50 border-indigo-200",
  },
  DELIVERING: {
    label: "Đang giao hàng",
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200",
  },
  DELIVERED: {
    label: "Đã giao hàng",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
  },
  RETURNING: {
    label: "Đang hoàn hàng",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
  },
  RETURNED: {
    label: "Đã hoàn hàng",
    color: "text-red-700",
    bg: "bg-red-100 border-red-200",
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "text-zinc-600",
    bg: "bg-zinc-100 border-zinc-300",
  },
};

const formatPrice = (price?: number) =>
  price != null
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
      }).format(price)
    : "—";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface DetailModalProps {
  request: SellRequest;
  onClose: () => void;
  onItemStatusChange: (item: SellRequestItem, status: string) => void;
  onItemOfferPrice: (
    item: SellRequestItem,
    price: string,
    note?: string,
  ) => void;
  onRejectWithNote: (item: SellRequestItem, note: string) => void;
  onRequestStatusChange?: (requestId: string, status: string) => void;
  onRequestNoteChange?: (requestId: string, notes: string) => void;
  savingItem: string | null;
  onLoadFullData?: (data: SellRequest) => void;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  PENDING: {
    label: "Chờ duyệt",
    color: "text-yellow-700",
    bg: "bg-yellow-50 border-yellow-200",
  },
  APPROVED: {
    label: "Đã duyệt",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  REJECTED: {
    label: "Từ chối",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
  },
  RECEIVED: {
    label: "Đã nhận",
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200",
  },
  COMPLETED: {
    label: "Hoàn thành",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
  },
};

export const DetailModal = memo(function DetailModal({
  request,
  onClose,
  onItemStatusChange,
  onItemOfferPrice,
  onRejectWithNote,
  onRequestStatusChange,
  onRequestNoteChange,
  savingItem,
  onLoadFullData,
}: DetailModalProps) {
  const sc = statusConfig[request.status] || {
    label: request.status,
    color: "text-zinc-700",
    bg: "bg-zinc-50",
  };
  const [mounted, setMounted] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState(request.notes || "");
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!request.items) {
      getAdminSellRequest(request.id)
        .then((data) => {
          if (onLoadFullData) onLoadFullData(data);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [request.id, request.items, onLoadFullData]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 overflow-y-auto py-8 px-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden border border-zinc-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/50">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-black">
              Chi tiết yêu cầu
            </h2>
            <p className="text-zinc-400 text-[10px] font-mono mt-1 font-bold uppercase tracking-widest">
              {request.id}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded border ${sc.bg} ${sc.color}`}
            >
              {sc.label}
            </span>
            {request.status !== "REJECTED" &&
              request.status !== "COMPLETED" &&
              onRequestStatusChange && (
                <button
                  onClick={() => {
                    if (
                      confirm(
                        "Bạn có chắc chắn muốn huỷ toàn bộ đơn này không? Mọi sản phẩm bên trong sẽ bị chuyển sang trạng thái TỪ CHỐI.",
                      )
                    ) {
                      onRequestStatusChange(request.id, "REJECTED");
                    }
                  }}
                  className="px-3 py-1.5 text-[10px] font-bold uppercase text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors"
                >
                  Huỷ đơn
                </button>
              )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Contact Info */}
          <div className="bg-zinc-50 border border-zinc-200 p-6 rounded-lg">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
              THÔNG TIN LIÊN HỆ
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-widest">
                  HỌ TÊN
                </p>
                <p className="font-bold text-sm text-black">
                  {request.contactName}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-widest">
                  EMAIL
                </p>
                <p className="font-bold text-sm text-black break-all">
                  {request.contactEmail}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-widest">
                  ĐIỆN THOẠI
                </p>
                <p className="font-bold text-sm text-black">
                  {request.contactPhone}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-widest">
                  GỬI HÀNG
                </p>
                <p className="font-bold text-sm text-black">
                  {request.deliveryMethod === "SHOP_PICKUP"
                    ? "Shop hỗ trợ giao"
                    : "Tự mang đến cửa hàng"}
                </p>
                {(request.pickupProvince || request.pickupAddress) && (
                  <p className="text-[10px] font-bold text-zinc-500 mt-0.5 leading-relaxed">
                    {[
                      request.pickupAddress,
                      request.pickupWard,
                      request.pickupDistrict,
                      request.pickupProvince,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>
              {request.user && (
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-widest">
                    TÀI KHOẢN
                  </p>
                  <p className="font-bold text-sm text-black">
                    {request.user.firstName} {request.user.lastName}
                  </p>
                  <p className="text-[10px] font-bold text-zinc-500 mt-0.5">
                    {request.user.email}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-widest">
                  LOẠI
                </p>
                <span
                  className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                    request.saleType === "CONSIGNMENT"
                      ? "bg-purple-100 text-purple-700 border-purple-200"
                      : "bg-blue-100 text-blue-700 border-blue-200"
                  }`}
                >
                  {request.saleType === "CONSIGNMENT" ? "Ký gửi" : "Thu mua"}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-widest">
                  NGÀY GỬI
                </p>
                <p className="font-bold text-sm text-black">
                  {formatDate(request.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Vận đơn SuperShip */}
          {request.supershipPickupCode && (
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-4">
                VẬN ĐƠN SUPERSHIP
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
                <div>
                  <p className="text-[10px] font-bold text-blue-400 mb-1 uppercase tracking-widest">
                    MÃ VẬN ĐƠN
                  </p>
                  <div className="flex items-center gap-3">
                    <p className="font-mono font-black text-sm text-blue-700">
                      {request.supershipPickupCode}
                    </p>
                    <a
                      href={`https://tracking.supership.vn/?code=${request.supershipPickupCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-blue-500 hover:text-blue-700 underline uppercase tracking-widest"
                    >
                      Tra cứu →
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-400 mb-1 uppercase tracking-widest">
                    TRẠNG THÁI GIAO HÀNG
                  </p>
                  {request.pickupStatus ? (
                    <span
                      className={`inline-block px-2 py-1 text-[10px] font-bold uppercase rounded border ${
                        pickupStatusConfig[request.pickupStatus]?.bg ??
                        "bg-zinc-50 border-zinc-200"
                      } ${
                        pickupStatusConfig[request.pickupStatus]?.color ??
                        "text-zinc-700"
                      }`}
                    >
                      {pickupStatusConfig[request.pickupStatus]?.label ??
                        request.pickupStatus}
                    </span>
                  ) : (
                    <p className="text-sm text-zinc-400 font-bold">—</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-400 mb-1 uppercase tracking-widest">
                    NGÀY TẠO VẬN ĐƠN
                  </p>
                  <p className="font-bold text-sm text-black">
                    {formatDate(request.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
              SẢN PHẨM ({request._count?.items ?? request.items?.length ?? 0})
            </h3>
            {!request.items ? (
              <div className="flex flex-col items-center justify-center py-12 bg-zinc-50 border border-zinc-200 border-dashed rounded-xl">
                <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Đang tải sản phẩm...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {request.items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onStatusChange={onItemStatusChange}
                    onOfferPrice={onItemOfferPrice}
                    onRejectWithNote={onRejectWithNote}
                    saving={savingItem === item.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Notes from Admin */}
          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                GHI CHÚ ADMIN / GỬI MÃ GHN CHO KHÁCH
              </p>
              {!isEditingNote && onRequestNoteChange && (
                <button
                  onClick={() => setIsEditingNote(true)}
                  className="text-[10px] font-bold text-blue-500 hover:text-blue-700 uppercase tracking-widest underline"
                >
                  Sửa ghi chú
                </button>
              )}
            </div>

            {isEditingNote ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Nhập ghi chú cho khách hoặc gửi mã vận đơn..."
                  className="input-field py-2 text-sm"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!onRequestNoteChange) return;
                      setIsSavingNote(true);
                      await onRequestNoteChange(request.id, noteInput);
                      setIsSavingNote(false);
                      setIsEditingNote(false);
                    }}
                    disabled={isSavingNote}
                    className="bg-black text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded hover:bg-zinc-800 transition-colors"
                  >
                    {isSavingNote ? "..." : "Lưu"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingNote(false);
                      setNoteInput(request.notes || "");
                    }}
                    className="text-[10px] font-bold text-zinc-400 hover:text-black uppercase tracking-widest"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-700 min-h-[1.5rem]">
                {request.notes || (
                  <span className="text-zinc-400 italic">
                    Chưa có ghi chú nào.
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
});

interface ItemCardProps {
  item: SellRequestItem;
  onStatusChange: (item: SellRequestItem, status: string) => void;
  onOfferPrice: (item: SellRequestItem, price: string, note?: string) => void;
  onRejectWithNote: (item: SellRequestItem, note: string) => void;
  saving: boolean;
}

const ItemCard = memo(function ItemCard({
  item,
  onStatusChange,
  onOfferPrice,
  onRejectWithNote,
  saving,
}: ItemCardProps) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(
    item.offeredPrice?.toString() || "",
  );
  const [noteInput, setNoteInput] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const isc = itemStatusConfig[item.itemStatus] || {
    label: item.itemStatus,
    color: "text-zinc-700",
    bg: "bg-zinc-100",
  };

  const handleSavePrice = () => {
    onOfferPrice(item, priceInput, noteInput);
    setEditingPrice(false);
    setNoteInput("");
  };

  const handleReject = () => {
    if (!rejectNote.trim()) return;
    onRejectWithNote(item, rejectNote);
    setRejecting(false);
    setRejectNote("");
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-5 hover:border-zinc-300 transition-all">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Images */}
        <div className="flex gap-2 flex-shrink-0">
          {item.images.slice(0, 3).map((img, i) => (
            <div
              key={i}
              onClick={() => setViewingImage(img)}
              className="w-20 h-20 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-100 relative group cursor-pointer"
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                loading="eager"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
            </div>
          ))}
          {item.images.length > 3 && (
            <div className="w-20 h-20 bg-zinc-50 border border-zinc-100 rounded-lg flex items-center justify-center text-zinc-400 text-xs font-bold">
              +{item.images.length - 3}
            </div>
          )}
          {item.images.length === 0 && (
            <div className="w-20 h-20 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-300 text-[10px] font-bold uppercase tracking-tighter">
              No Img
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0">
              <h4 className="font-black text-base text-black truncate uppercase tracking-tight">
                {item.productName}
              </h4>
              <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-wide">
                {item.brandName} · {item.categoryName} · {item.condition}
              </p>
            </div>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border flex-shrink-0 ${isc.bg} ${isc.color}`}
            >
              {isc.label}
            </span>
          </div>

          {item.description && (
            <p className="text-zinc-500 text-xs mb-4 italic leading-relaxed font-medium">
              "{item.description}"
            </p>
          )}

          {/* Pricing */}
          <div className="flex flex-wrap items-center gap-8 mb-6 bg-zinc-50 p-3 rounded-lg border border-zinc-100">
            <div>
              <p
                className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${
                  item.offeredPrice == null &&
                  new Date(item.updatedAt).getTime() -
                    new Date(item.createdAt).getTime() >
                    5000
                    ? "text-orange-500 animate-pulse"
                    : "text-zinc-400"
                }`}
              >
                {item.offeredPrice == null &&
                new Date(item.updatedAt).getTime() -
                  new Date(item.createdAt).getTime() >
                  5000
                  ? "KHÁCH ĐANG DEAL LẠI"
                  : "KHÁCH MONG MUỐN"}
              </p>
              <p className="font-black text-base text-black">
                {formatPrice(item.expectedPrice)}
              </p>
            </div>
            {editingPrice ? (
              <div className="flex flex-col gap-2 w-full mt-2">
                <input
                  type="number"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="Nhập giá deal..."
                  className="input-field py-1.5 text-xs font-bold"
                  autoFocus
                />
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Ghi chú cho khách (không bắt buộc)..."
                  className="input-field py-1.5 text-xs"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSavePrice}
                    disabled={saving}
                    className="bg-black text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded hover:bg-zinc-800 transition-colors"
                  >
                    {saving ? "..." : "Lưu"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingPrice(false);
                      setPriceInput(item.offeredPrice?.toString() || "");
                      setNoteInput("");
                    }}
                    className="text-[10px] font-bold text-zinc-400 hover:text-black uppercase tracking-widest"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                  GIÁ ĐỀ XUẤT
                </p>
                <div className="flex items-center gap-3">
                  <p
                    className={`font-black text-base ${item.offeredPrice ? "text-brand-red" : "text-zinc-400"}`}
                  >
                    {item.offeredPrice
                      ? formatPrice(item.offeredPrice)
                      : "Chưa deal"}
                  </p>
                  {item.itemStatus === "PENDING" && (
                    <button
                      onClick={() => setEditingPrice(true)}
                      className="text-[10px] font-black text-brand-red hover:underline uppercase tracking-widest"
                    >
                      {item.offeredPrice ? "Sửa" : "Deal giá"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Rejection note */}
          {item.itemStatus === "REJECTED" && item.rejectionNote && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-lg mb-6 text-xs text-red-700">
              <p className="text-[9px] font-bold text-red-500 mb-1 uppercase tracking-widest">
                LÝ DO TỪ CHỐI
              </p>
              <p className="font-medium">{item.rejectionNote}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {item.itemStatus === "PENDING" && (
              <>
                <button
                  onClick={() => onStatusChange(item, "APPROVED")}
                  disabled={saving}
                  className="bg-green-600 text-white px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-green-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  {saving ? "..." : "✓ Chấp nhận"}
                </button>
                <button
                  onClick={() => setRejecting(true)}
                  disabled={saving}
                  className="bg-red-600 text-white px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  ✕ Từ chối
                </button>
              </>
            )}

            {item.itemStatus === "APPROVED" && (
              <button
                onClick={() => onStatusChange(item, "RECEIVED")}
                disabled={saving}
                className="bg-purple-600 text-white px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-purple-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {saving ? "..." : "📦 Đã nhận hàng"}
              </button>
            )}

            {item.itemStatus === "RECEIVED" && (
              <button
                onClick={() => onStatusChange(item, "COMPLETED")}
                disabled={saving}
                className="bg-black text-white px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-zinc-800 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {saving ? "..." : "✓ Hoàn tất"}
              </button>
            )}
          </div>

          {/* Deal History */}
          {item.dealHistory && item.dealHistory.length > 0 && (
            <div className="mt-6 border-t border-zinc-100 pt-4">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
                Lịch sử thương lượng
              </p>
              <div className="space-y-3">
                {item.dealHistory.map((historyItem, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col p-3 rounded-lg text-xs ${historyItem.actor === "ADMIN" ? "bg-blue-50 border border-blue-100 ml-8" : "bg-zinc-100 border border-zinc-200 mr-8"}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold">
                        {historyItem.actor === "ADMIN"
                          ? "Shop đề xuất"
                          : "Khách mong muốn"}
                      </span>
                      <span className="text-zinc-400 text-[10px]">
                        {formatDate(historyItem.timestamp)}
                      </span>
                    </div>
                    <span className="font-black text-base text-black">
                      {formatPrice(historyItem.price)}
                    </span>
                    {historyItem.note && (
                      <p className="text-zinc-600 mt-1 italic">
                        "{historyItem.note}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject modal inline */}
      {rejecting && (
        <div className="mt-5 p-4 bg-red-50 border border-red-100 rounded-xl animate-in fade-in slide-in-from-top-2">
          <p className="text-[10px] font-bold text-red-500 mb-2 uppercase tracking-widest">
            LÝ DO TỪ CHỐI
          </p>
          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="VD: Sản phẩm không đúng mô tả, tình trạng không đạt yêu cầu..."
            className="input-field text-sm mb-4 bg-white"
            rows={2}
          />
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={!rejectNote.trim() || saving}
              className="bg-red-600 text-white px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all"
            >
              {saving ? "..." : "Xác nhận từ chối"}
            </button>
            <button
              onClick={() => {
                setRejecting(false);
                setRejectNote("");
              }}
              className="text-[10px] font-bold text-zinc-400 hover:text-black uppercase tracking-widest"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Lightbox / Fullscreen Image Viewer */}
      {viewingImage &&
        createPortal(
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 md:top-8 md:right-8 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-[210]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            
            {/* Vùng bấm xung quanh để thoát */}
            <div 
              className="absolute inset-0 z-[205]" 
              onClick={() => setViewingImage(null)}
            />
            
            {/* Hình ảnh */}
            <img
              src={viewingImage}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain relative z-[210] rounded shadow-2xl"
            />
          </div>,
          document.body
        )}
    </div>
  );
});
