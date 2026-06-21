"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, { title: string; desc: string }> = {
  "00": {
    title: "Thanh toán thành công!",
    desc: "Cảm ơn bạn đã thanh toán qua VNPay.",
  },
  "01": {
    title: "Giao dịch bị từ chối",
    desc: "Giao dịch bị từ chối. Vui lòng thử lại hoặc sử dụng phương thức thanh toán khác.",
  },
  "02": {
    title: "Lỗi ngân hàng",
    desc: "Giao dịch không thành công do lỗi ngân hàng. Vui lòng thử lại sau.",
  },
  "03": {
    title: "Giao dịch không hợp lệ",
    desc: "Giao dịch không thành công. Vui lòng thử lại.",
  },
  "09": {
    title: "Thẻ chưa đăng ký",
    desc: "Thẻ chưa đăng ký dịch vụ Internet Banking. Vui lòng liên hệ ngân hàng.",
  },
  "10": {
    title: "Thẻ không hợp lệ",
    desc: "Thẻ không hợp lệ. Vui lòng kiểm tra và thử lại.",
  },
  "11": {
    title: "Thẻ hết hạn",
    desc: "Thẻ đã hết hạn. Vui lòng sử dụng thẻ khác.",
  },
  "12": {
    title: "Sai thông tin thẻ",
    desc: "Sai thông tin thẻ. Vui lòng kiểm tra và thử lại.",
  },
  "13": {
    title: "Sai mật khẩu OTP",
    desc: "Sai mật khẩu OTP. Vui lòng thử lại.",
  },
  "24": {
    title: "Bạn đã hủy thanh toán",
    desc: "Bạn đã hủy thanh toán. Bạn có thể thử lại bất kỳ lúc nào.",
  },
  "51": {
    title: "Tài khoản không đủ tiền",
    desc: "Tài khoản không đủ số dư. Vui lòng nạp thêm tiền và thử lại.",
  },
  "65": {
    title: "Vượt hạn mức giao dịch",
    desc: "Tài khoản đã vượt hạn mức giao dịch trong ngày. Vui lòng thử lại sau.",
  },
  "75": {
    title: "Ngân hàng bảo trì",
    desc: "Ngân hàng đang bảo trì. Vui lòng thử lại sau.",
  },
  "79": {
    title: "Nhập sai OTP quá số lần",
    desc: "Bạn đã nhập sai mật khẩu OTP quá số lần cho phép. Vui lòng thử lại sau.",
  },
  "97": {
    title: "Lỗi xác thực",
    desc: "Lỗi xác thực chữ ký. Vui lòng liên hệ hỗ trợ.",
  },
  "99": {
    title: "Lỗi thanh toán",
    desc: "Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.",
  },
  notfound: {
    title: "Không tìm thấy đơn hàng",
    desc: "Không tìm thấy đơn hàng. Vui lòng liên hệ hỗ trợ.",
  },
  cancelled: {
    title: "Bạn đã hủy thanh toán",
    desc: "Bạn đã hủy thanh toán. Bạn có thể thử lại bất kỳ lúc nào.",
  },
  expired: {
    title: "Thanh toán đã hết hạn",
    desc: "Liên kết thanh toán đã hết hạn (15 phút). Vui lòng tạo thanh toán mới.",
  },
};

function FailedContent() {
  const params = useSearchParams();
  const code = params.get("code");
  const orderId = params.get("orderId");

  const info = code ? (ERROR_MESSAGES[code] ?? ERROR_MESSAGES["99"]) : ERROR_MESSAGES["99"];
  const isCancelled = code === "24" || code === "cancelled";

  return (
    <div className="max-w-[1440px] mx-auto px-8 py-24 text-center">
      <div
        className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-10 border-2 ${
          isCancelled ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"
        }`}
      >
        {isCancelled ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        )}
      </div>

      <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">{info.title}</h1>
      <p className="text-zinc-500 text-lg mb-8 max-w-md mx-auto">{info.desc}</p>

      {orderId && (
        <p className="text-sm font-bold text-zinc-700 mb-8">
          Mã đơn hàng: <span className="text-zinc-900">ORD-{orderId.slice(0, 8).toUpperCase()}</span>
        </p>
      )}

      <p className="text-xs text-zinc-400 mb-12">
        Nếu bạn đã thanh toán nhưng gặp lỗi, vui lòng chờ 1-2 phút rồi kiểm tra trong{" "}
        <Link href="/account/orders" className="underline hover:no-underline">đơn hàng của tôi</Link> hoặc liên hệ hotline: <strong>1900 1234</strong>
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/checkout" className="btn-primary px-10 py-4">Quay lại thanh toán</Link>
        <Link href="/shop" className="btn-ghost px-10 py-4">Tiếp tục mua sắm</Link>
      </div>
    </div>
  );
}

export default function VNPayFailedPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[1440px] mx-auto px-8 py-24 text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <FailedContent />
    </Suspense>
  );
}
