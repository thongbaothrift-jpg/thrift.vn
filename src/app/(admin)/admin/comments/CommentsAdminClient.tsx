"use client";

import { useState } from "react";
import Link from "next/link";
import { replyReview, deleteReview, type Review } from "@/lib/api/reviews-notifications";

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

interface CommentsAdminClientProps {
  initialComments: Review[];
  onUpdate?: (comments: Review[]) => void;
}

export function CommentsAdminClient({ initialComments, onUpdate }: CommentsAdminClientProps) {
  const [comments, setComments] = useState<Review[]>(initialComments);
  const [filter, setFilter] = useState<"all" | "pending" | "replied">("all");
  const [search, setSearch] = useState("");
  const [selectedComment, setSelectedComment] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filtered = comments.filter((c) => {
    const matchFilter =
      filter === "all" ||
      (filter === "pending" && !c.adminReply) ||
      (filter === "replied" && !!c.adminReply);
    const matchSearch =
      !search ||
      c.comment?.toLowerCase().includes(search.toLowerCase()) ||
      c.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      c.user.lastName.toLowerCase().includes(search.toLowerCase()) ||
      c.product?.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleReply = async () => {
    if (!selectedComment || !replyText.trim()) return;
    setSubmitting(true);
    try {
      const updated = await replyReview(selectedComment.id, replyText.trim());
      setComments((prev) =>
        prev.map((c) => (c.id === selectedComment.id ? { ...c, ...updated } : c))
      );
      onUpdate?.(
        comments.map((c) => (c.id === selectedComment.id ? { ...c, ...updated } : c))
      );
      setSelectedComment({ ...selectedComment, ...updated });
      setReplyText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;
    try {
      await deleteReview(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setSelectedComment(null);
      onUpdate?.(comments.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        {([
          { label: "Tổng bình luận", value: comments.length, color: "" },
          { label: "Chưa phản hồi", value: comments.filter((c) => !c.adminReply).length, color: "text-orange-600" },
          { label: "Đã phản hồi", value: comments.filter((c) => c.adminReply).length, color: "text-green-600" },
        ] as const).map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-zinc-200 rounded-2xl p-5">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex gap-1 bg-white border border-zinc-200 rounded-xl p-1">
          {(["all", "pending", "replied"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === f ? "bg-black text-white" : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {f === "all" ? "Tất cả" : f === "pending" ? "Chưa phản hồi" : "Đã phản hồi"}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Tìm kiếm bình luận..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-black"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-[32px] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">Không có bình luận nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Sản phẩm</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Khách hàng</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Bình luận</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Ngày</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Trạng thái</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((comment) => (
                  <tr
                    key={comment.id}
                    className="border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedComment(comment)}
                  >
                    <td className="px-6 py-4">
                      {comment.product ? (
                        <Link
                          href={`/products/${comment.product.slug}`}
                          className="text-sm font-medium text-black hover:text-brand-red line-clamp-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {comment.product.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-zinc-200 rounded-full flex items-center justify-center">
                          <span className="text-[10px] font-semibold text-zinc-600">
                            {comment.user.firstName?.charAt(0) || "U"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{comment.user.firstName} {comment.user.lastName}</p>
                          <p className="text-xs text-zinc-400">{comment.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-sm text-zinc-600 line-clamp-2">{comment.comment || "(không có nội dung)"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-zinc-500">{formatDate(comment.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4">
                      {comment.adminReply ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Đã phản hồi
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                          Chưa phản hồi
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedComment(comment); }}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-xs font-medium rounded-lg transition-colors"
                      >
                        Xem / Phản hồi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedComment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => { setSelectedComment(null); setReplyText(""); }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
              <h2 className="text-lg font-bold">Chi tiết bình luận</h2>
              <button
                onClick={() => { setSelectedComment(null); setReplyText(""); }}
                className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Product info */}
              {selectedComment.product && (
                <div className="bg-zinc-50 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-1">Sản phẩm</p>
                  <Link href={`/products/${selectedComment.product.slug}`} className="text-sm font-medium text-black hover:text-brand-red">
                    {selectedComment.product.name}
                  </Link>
                </div>
              )}

              {/* User info */}
              <div>
                <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-1">Khách hàng</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-zinc-600">
                      {selectedComment.user.firstName?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{selectedComment.user.firstName} {selectedComment.user.lastName}</p>
                    <p className="text-xs text-zinc-400">{selectedComment.user.email}</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 mt-1">{formatDate(selectedComment.createdAt)}</p>
              </div>

              {/* Comment */}
              <div>
                <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-1">Bình luận</p>
                <p className="text-sm text-zinc-700 leading-relaxed">
                  {selectedComment.comment || "(không có nội dung)"}
                </p>
              </div>

              {/* Admin reply */}
              {selectedComment.adminReply && (
                <div className="bg-brand-red/5 border-l-2 border-brand-red pl-4 py-3 rounded-r-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-brand-red/20 rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-bold text-brand-red">A</span>
                    </div>
                    <span className="text-xs font-bold text-brand-red uppercase tracking-wide">Quản trị viên</span>
                    {selectedComment.adminReplyAt && (
                      <span className="text-xs text-zinc-400">{formatDate(selectedComment.adminReplyAt)}</span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-700 leading-relaxed">{selectedComment.adminReply}</p>
                </div>
              )}

              {/* Reply form */}
              <div>
                <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-2">
                  {selectedComment.adminReply ? "Sửa phản hồi" : "Phản hồi"}
                </p>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Nhập phản hồi..."
                  className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black resize-none min-h-[100px]"
                  maxLength={1000}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-zinc-400">{replyText.length}/1000</p>
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim() || submitting}
                    className="px-5 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? "Đang gửi..." : "Gửi phản hồi"}
                  </button>
                </div>
              </div>

              {/* Delete */}
              <div className="pt-2 border-t border-zinc-200">
                <button
                  onClick={() => handleDelete(selectedComment.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 text-sm font-medium rounded-xl transition-colors"
                >
                  Xóa bình luận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
