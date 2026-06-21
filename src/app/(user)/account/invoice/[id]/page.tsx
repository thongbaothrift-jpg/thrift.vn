"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getStoredToken } from "@/lib/api/auth";

const formatPrice = (price: number) =>
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

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chưa thanh toán",
  SUCCESS: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
  REFUNDED: "Đã hoàn tiền",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng (COD)",
  VNPAY: "VNPay",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
  CARD: "Thẻ",
};

export default function InvoicePage() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = getStoredToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/orders/public/${params.id}`,
          { headers },
        );
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setOrder(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchOrder();
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-8 py-12">
        <div className="h-8 w-48 bg-zinc-100 animate-pulse rounded mb-8" />
        <div className="h-96 bg-zinc-100 animate-pulse rounded max-w-[800px] mx-auto" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="max-w-[1440px] mx-auto px-8 py-12 text-center">
        <p className="text-zinc-500 mb-4">Không tìm thấy đơn hàng.</p>
        <Link href="/account" className="btn-ghost inline-block">
          Quay lại tài khoản
        </Link>
      </div>
    );
  }

  const invoiceNumber = `INV-${order.id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = formatDate(order.createdAt);
  const isDeposit = order.isDepositRequired && !order.depositPaid;
  const displayTotal = isDeposit ? order.depositAmount : order.total;
  return (
    <div className="max-w-[1440px] mx-auto px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center gap-2 text-sm text-zinc-500">
          <li>
            <Link
              href="/account"
              className="hover:text-black transition-colors"
            >
              Tài khoản
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link
              href={`/account/orders/${order.id}`}
              className="hover:text-black transition-colors"
            >
              Theo dõi đơn hàng
            </Link>
          </li>
          <li>/</li>
          <li className="text-black font-medium">Hóa đơn</li>
        </ol>
      </nav>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-end mb-8">
        <button className="btn-ghost flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 9l6 6 6-6"
            />
          </svg>
          Tải PDF
        </button>
        <button className="btn-ghost flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.5 8.5v9l-3 2.5M17.5 8.5v9l3 2.5M4 6.5h16"
            />
          </svg>
          In hóa đơn
        </button>
      </div>

      {/* Invoice */}
      <div className="bg-white border border-zinc-200 max-w-[800px] mx-auto">
        {/* Invoice Header */}
        <div className="p-8 border-b border-zinc-200">
          <div className="flex flex-col md:flex-row md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-brand-red mb-2">
                Hóa đơn
              </h1>
              <p className="text-4xl font-black tracking-tight">THRIFT.VN</p>
              <p className="text-zinc-500 text-sm mt-1">
                Hàng Hiệu Xá Thật Uy Tín
              </p>
            </div>
            <div className="text-right">
              <div className="mb-4">
                <span className="font-label text-zinc-500 text-[10px]">
                  SỐ HÓA ĐƠN
                </span>
                <p className="font-bold text-lg">{invoiceNumber}</p>
              </div>
              <div className="flex flex-wrap justify-end gap-4 text-sm">
                <div>
                  <span className="font-label text-zinc-500 text-[10px]">
                    NGÀY
                  </span>
                  <p>{invoiceDate}</p>
                </div>
                <div>
                  <span className="font-label text-zinc-500 text-[10px]">
                    MÃ ĐƠN
                  </span>
                  <p className="font-semibold">
                    {order.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-zinc-200 bg-zinc-50">
          <div>
            <span className="font-label text-zinc-500 text-[10px]">
              NGƯỜI BÁN
            </span>
            <div className="mt-2">
              <p className="font-bold">THRIFT.VN - Hàng Hiệu Ký Gửi</p>
              <p className="text-sm text-zinc-600">
                88 Lê Lai, Quận 1, TP. Hồ Chí Minh
              </p>
              <p className="text-sm text-zinc-600">028 1234 5678</p>
              <p className="text-sm text-zinc-600">contact@thrift.vn</p>
              <p className="text-sm text-zinc-500 mt-1">MST: 0123456789</p>
            </div>
          </div>
          <div>
            <span className="font-label text-zinc-500 text-[10px]">
              NGƯỜI MUA
            </span>
            <div className="mt-2">
              <p className="font-bold">{order.shippingName}</p>
              <p className="text-sm text-zinc-600">{order.shippingAddress}</p>
              <p className="text-sm text-zinc-600">ĐT: {order.shippingPhone}</p>
              {order.shippingEmail && (
                <p className="text-sm text-zinc-600">{order.shippingEmail}</p>
              )}
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="border-b border-zinc-200">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-black text-white text-xs font-label uppercase">
            <div className="col-span-5">Sản phẩm</div>
            <div className="col-span-2 text-center">SKU</div>
            <div className="col-span-1 text-center">SL</div>
            <div className="col-span-2 text-right">Đơn giá</div>
            <div className="col-span-2 text-right">Thành tiền</div>
          </div>
          {/* Table Rows */}
          {(order.items || []).map((item: any) => (
            <div
              key={item.productId}
              className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-100 text-sm items-center"
            >
              <div className="col-span-5">
                <p className="font-medium">
                  {item.productName || item.product?.name || "Sản phẩm"}
                </p>
                {item.size && (
                  <p className="text-xs text-zinc-500">Size: {item.size}</p>
                )}
              </div>
              <div className="col-span-2 text-center font-mono text-xs text-zinc-500">
                {item.product?.id?.slice(0, 12) || "-"}
              </div>
              <div className="col-span-1 text-center">{item.quantity}</div>
              <div className="col-span-2 text-right">
                {formatPrice(item.price)}
              </div>
              <div className="col-span-2 text-right font-semibold">
                {formatPrice(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="p-8">
          <div className="flex justify-end">
            <div className="w-full max-w-[300px] space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Tạm tính</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Phí vận chuyển</span>
                <span>{formatPrice(order.shippingFee)}</span>
              </div>
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(order.couponDiscount)}</span>
                </div>
              )}
              {isDeposit && order.depositAmount && (
                <div className="flex justify-between text-sm text-amber-600">
                  <span>Đã đặt cọc</span>
                  <span>-{formatPrice(order.depositAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-3 border-t-2 border-black">
                <span>TỔNG CỘNG</span>
                <span className="text-brand-red">
                  {formatPrice(displayTotal)}
                </span>
              </div>
              {isDeposit && (
                <div className="flex justify-between text-sm text-zinc-500">
                  <span>Còn lại (thanh toán khi nhận hàng)</span>
                  <span>
                    {formatPrice(order.total - (order.depositAmount || 0))}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 pt-8 border-t border-zinc-200">
            <div>
              <span className="font-label text-zinc-500 text-[10px]">
                PHƯƠNG THỨC THANH TOÁN
              </span>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-10 h-10 bg-zinc-100 rounded flex items-center justify-center">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <rect x="1" y="4" width="22" height="16" rx="2" />
                    <path d="M1 10h22" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">
                    {PAYMENT_METHOD_LABELS[order.paymentMethod] ||
                      order.paymentMethod}
                  </p>
                  <p className="text-sm text-green-600">
                    {PAYMENT_STATUS_LABELS[order.paymentStatus] ||
                      order.paymentStatus}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <span className="font-label text-zinc-500 text-[10px]">
                GHI CHÚ
              </span>
              <p className="text-sm text-zinc-600 mt-2">
                Sản phẩm đã qua kiểm định chất lượng. Bảo hành 6 tháng.
              </p>
              {isDeposit && (
                <p className="text-sm text-amber-600 mt-1">
                  Đơn hàng đặt cọc 10%. Số tiền còn lại thanh toán khi nhận hàng
                  (COD).
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-zinc-50 border-t border-zinc-200 text-center">
          <p className="text-sm text-zinc-500">
            Cảm ơn bạn đã mua sắm tại THRIFT.VN. Sản phẩm được bảo hành 6
            tháng.
          </p>
          <p className="text-sm text-zinc-400 mt-1">
            Hotline: 028 1234 5678 | contact@THRIFT.VN
          </p>
        </div>
      </div>

      {/* Back Link */}
      <div className="text-center mt-8">
        <Link
          href={`/account/orders/${order.id}`}
          className="text-zinc-500 hover:text-black transition-colors text-sm"
        >
          ← Quay lại theo dõi đơn hàng
        </Link>
      </div>
    </div>
  );
}
