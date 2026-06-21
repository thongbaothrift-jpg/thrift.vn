"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/api";
import { getStoredToken } from "@/lib/api/auth";

type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  isDepositRequired: boolean;
  depositAmount: number | null;
  total: number;
  shippingName: string;
  shippingEmail: string | null;
  createdAt: string;
};

type BankConfig = {
  bankId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
};

export default function PaymentQRPage() {
  const { orderId } = useParams();

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [bankConfig, setBankConfig] = useState<BankConfig | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const fetchDetails = async () => {
      try {
        const orderRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/orders/public/${orderId}`,
        );
        if (!orderRes.ok) {
          if (orderRes.status === 401 || orderRes.status === 403)
            throw new Error("Vui lòng đăng nhập để xem đơn hàng");
          throw new Error("Không tìm thấy đơn hàng");
        }
        const orderData = await orderRes.json();
        setOrder(orderData);
        if (orderData.paymentStatus === "SUCCESS") {
          setConfirmed(true);
        }

        const bankRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/settings/bank`,
        );
        if (!bankRes.ok) throw new Error("Không thể tải thông tin thanh toán");
        const bankData = await bankRes.json();
        setBankConfig(bankData);
      } catch (err: any) {
        setFetchError(err.message || "Đã xảy ra lỗi");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [orderId]);

  const handleConfirm = async () => {
    if (!orderId) return;
    setConfirming(true);
    setConfirmError("");

    try {
      const token = getStoredToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}/confirm-vietqr`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Xác nhận thất bại. Vui lòng thử lại.");
      }

      setConfirmed(true);
    } catch (err: any) {
      setConfirmError(err.message || "Đã xảy ra lỗi khi xác nhận.");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-8 py-20 text-center min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (fetchError || !order || !bankConfig) {
    return (
      <div className="max-w-[1440px] mx-auto px-8 py-20 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4 uppercase">Lỗi thanh toán</h1>
        <p className="text-zinc-500 mb-8">
          {fetchError || "Không thể tải thông tin thanh toán"}
        </p>
        <Link href="/shop" className="btn-primary px-8">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  if (order.status === "CANCELLED" || order.status === "PAYMENT_EXPIRED") {
    return (
      <div className="max-w-[1440px] mx-auto px-8 py-20 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4 uppercase">
          {order.status === "PAYMENT_EXPIRED"
            ? "Thanh toán đã hết hạn"
            : "Đơn hàng đã bị hủy"}
        </h1>
        <p className="text-zinc-500 mb-8">
          {order.status === "PAYMENT_EXPIRED"
            ? "Liên kết thanh toán đã hết hạn. Vui lòng tạo đơn hàng mới."
            : "Đơn hàng này đã bị hủy nên không thể thanh toán."}
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/shop" className="btn-primary px-8">
            Tiếp tục mua sắm
          </Link>
          <Link href="/account" className="btn-ghost px-8">
            Tài khoản
          </Link>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="max-w-[1440px] mx-auto px-8 py-24 text-center animate-fade-in">
        <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-10 border-2 border-green-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="text-5xl font-black uppercase tracking-tighter mb-6">
          Thanh toán thành công!
        </h1>

        <p className="text-zinc-500 text-lg mb-4">
          Cảm ơn bạn đã thanh toán qua chuyển khoản ngân hàng.
        </p>
        <p className="text-sm font-bold text-zinc-900 mb-10">
          Mã đơn hàng:{" "}
          <span className="text-brand-red">
            ORD-{orderId?.toString().slice(0, 8).toUpperCase()}
          </span>
        </p>

        <div className="max-w-md mx-auto bg-zinc-50 p-6 border border-zinc-100 mb-12 text-left space-y-3 text-sm text-zinc-600">
          <p>Email xác nhận đã được gửi đến bạn.</p>
          <p>Nhân viên THRIFT.VN sẽ gọi điện xác nhận trong vòng 24h tới.</p>
          <p>
            Đơn hàng sẽ được đóng gói và vận chuyển sau khi xác nhận thanh toán.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href={`/account/orders/${orderId}`}
            className="btn-primary px-10 py-4"
          >
            Xem đơn hàng
          </Link>
          <Link href="/shop" className="btn-ghost px-10 py-4">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  const displayAmount = order.isDepositRequired
    ? (order.depositAmount ?? order.total)
    : order.total;
  const isDeposit = order.isDepositRequired;
  const transferContent =
    (order as any).paymentContent ||
    `THRIFTED_${order.id.slice(0, 8).toUpperCase()}`;
  const qrUrl = `https://img.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNumber}-compact2.png?amount=${displayAmount}&addInfo=${transferContent}&accountName=${encodeURIComponent(bankConfig.accountName)}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 md:py-20 min-h-[80vh] flex flex-col items-center justify-center animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4 text-brand-red">
          {isDeposit ? "Thanh toán tiền cọc" : "Thanh toán đơn hàng"}
        </h1>
        <div className="max-w-lg mx-auto space-y-2">
          {isDeposit ? (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded mb-4">
              <p className="text-amber-800 text-sm font-medium">
                Đây là đơn hàng đầu tiên của bạn. Vui lòng chuyển khoản đặt cọc{" "}
                <strong>10% ({formatPrice(displayAmount)})</strong> để chúng tôi
                xác nhận đơn hàng COD.
              </p>
            </div>
          ) : (
            <p className="text-zinc-500">
              Vui lòng quét mã QR bên dưới hoặc chuyển khoản theo thông tin để
              hoàn tất đơn hàng.
            </p>
          )}
        </div>
      </div>

      <div className="w-full bg-white border border-zinc-200 flex flex-col md:flex-row overflow-hidden shadow-xl rounded-lg">
        {/* QR Code Section */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col items-center justify-center bg-zinc-50 border-b md:border-b-0 md:border-r border-zinc-200">
          <div className="w-64 h-64 bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm relative p-2 mb-6">
            <img
              src={qrUrl}
              alt="VietQR Payment"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-sm font-bold text-zinc-900 mb-1">
            Mã đơn: ORD-{order.id.slice(0, 8).toUpperCase()}
          </p>
          <div className="text-center">
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">
              {isDeposit ? "Số tiền cọc (10%)" : "Tổng tiền"}
            </p>
            <p className="text-3xl font-black text-brand-red">
              {formatPrice(displayAmount)}
            </p>
            {isDeposit && (
              <p className="text-[10px] text-zinc-400 mt-1 italic line-through">
                Tổng đơn: {formatPrice(order.total)}
              </p>
            )}
          </div>
        </div>

        {/* Bank Details Section */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-white flex flex-col justify-center space-y-6">
          <h2 className="font-bold uppercase tracking-widest text-sm mb-2 border-b border-zinc-100 pb-4">
            Thông tin chuyển khoản
          </h2>

          <div className="space-y-1">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">
              Ngân hàng
            </p>
            <p className="font-bold text-zinc-900">{bankConfig.bankName}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">
              Số tài khoản
            </p>
            <div className="flex items-center justify-between bg-zinc-50 px-3 py-2 border border-zinc-100 rounded">
              <p className="text-lg font-black tracking-widest text-zinc-900">
                {bankConfig.accountNumber}
              </p>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(bankConfig.accountNumber)
                }
                className="text-xs font-bold text-brand-red uppercase hover:bg-red-50 px-2 py-1 rounded transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">
              Chủ tài khoản
            </p>
            <p className="font-bold text-zinc-900">{bankConfig.accountName}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">
              Nội dung chuyển khoản
            </p>
            <div className="flex items-center justify-between bg-zinc-50 px-3 py-2 border border-zinc-100 rounded">
              <p className="font-bold text-zinc-900">{transferContent}</p>
              <button
                onClick={() => navigator.clipboard.writeText(transferContent)}
                className="text-xs font-bold text-brand-red uppercase hover:bg-red-50 px-2 py-1 rounded transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 w-full max-w-md text-center space-y-4">
        <p className="text-sm text-zinc-500">
          {isDeposit
            ? "Sau khi nhận được tiền cọc, chúng tôi sẽ ngay lập tức chuẩn bị và giao hàng cho bạn. Số tiền còn lại bạn sẽ thanh toán cho shipper khi nhận hàng."
            : "Sau khi chuyển khoản thành công, đơn hàng của bạn sẽ được nhân viên kiểm tra và xác nhận trong vòng 1-2 giờ làm việc."}
        </p>

        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="btn-primary w-full py-4 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {confirming ? (
            <span className="flex items-center justify-center gap-3">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ĐANG XÁC NHẬN...
            </span>
          ) : (
            "TÔI ĐÃ CHUYỂN KHOẢN XONG"
          )}
        </button>

        {confirmError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">
            {confirmError}
          </div>
        )}
      </div>
    </div>
  );
}
