"use client";

import Link from "next/link";

interface ReturnRequestStatusProps {
  status: string;
  orderId: string;
  adminNote?: string | null;
  createdAt?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  PENDING: {
    label: "Đang chờ duyệt",
    color: "text-yellow-700",
    bg: "bg-yellow-100 border-yellow-200",
    desc: "Yêu cầu của bạn đang được xử lý. Chúng tôi sẽ phản hồi trong 1-2 ngày làm việc.",
  },
  APPROVED: {
    label: "Đã duyệt - Đang hoàn tiền",
    color: "text-blue-700",
    bg: "bg-blue-100 border-blue-200",
    desc: "Yêu cầu đã được duyệt. Chúng tôi sẽ hoàn tiền trong 3-5 ngày làm việc.",
  },
  REJECTED: {
    label: "Bị từ chối",
    color: "text-red-700",
    bg: "bg-red-100 border-red-200",
    desc: "Yêu cầu hoàn hàng không được chấp nhận.",
  },
  COMPLETED: {
    label: "Đã hoàn tiền",
    color: "text-green-700",
    bg: "bg-green-100 border-green-200",
    desc: "Tiền đã được hoàn thành công. Cảm ơn bạn đã tin tưởng Shop.",
  },
};

export function ReturnRequestStatus({ status, orderId, adminNote, createdAt }: ReturnRequestStatusProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    color: "text-zinc-700",
    bg: "bg-zinc-100 border-zinc-200",
    desc: "",
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <div className={`border rounded-xl p-4 ${config.bg}`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            status === "PENDING" ? "bg-yellow-200 text-yellow-700" :
            status === "APPROVED" ? "bg-blue-200 text-blue-700" :
            status === "REJECTED" ? "bg-red-200 text-red-700" :
            "bg-green-200 text-green-700"
          }`}>
            {status === "PENDING" && (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {status === "APPROVED" && (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {status === "REJECTED" && (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            )}
            {status === "COMPLETED" && (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <h3 className={`font-bold ${config.color}`}>{config.label}</h3>
            <p className={`text-sm mt-1 ${config.color} opacity-80`}>{config.desc}</p>
            {adminNote && status === "REJECTED" && (
              <div className="mt-2 p-2 bg-white/60 rounded-lg text-sm">
                <span className="font-semibold">Lý do từ chối: </span>
                <span>{adminNote}</span>
              </div>
            )}
            {createdAt && (
              <p className="text-xs mt-2 opacity-60">
                Đã gửi: {formatDate(createdAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      {status !== "COMPLETED" && (
        <Link
          href={`/account/orders/${orderId}`}
          className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-black transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Xem chi tiết đơn hàng
        </Link>
      )}
    </div>
  );
}
