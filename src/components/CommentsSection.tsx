"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getProductReviews,
  createReview,
  replyReview,
  deleteReview,
  type Review,
} from "@/lib/api/reviews-notifications";

// Module-level guard to prevent double-fetch in React 18 Strict Mode
const _fetching = new Set<string>();

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

interface CommentFormProps {
  productId: string;
  productName: string;
  onCommentAdded: (comment: Review) => void;
}

function CommentForm({ productId, productName, onCommentAdded }: CommentFormProps) {
  const { isAuthenticated } = useAuth();
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const review = await createReview({ productId, comment: comment.trim() });
      onCommentAdded(review);
      setComment("");
    } catch (err: any) {
      setError(err.message || "Gửi bình luận thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white border border-zinc-200 p-6 text-center">
        <p className="text-zinc-500">
          Vui lòng{" "}
          <a href="/auth/login" className="text-black font-semibold hover:text-brand-red">
            đăng nhập
          </a>{" "}
          để bình luận.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 p-4 md:p-6">
      <h3 className="text-xl font-bold uppercase tracking-tight mb-2">
        Bình luận về sản phẩm
      </h3>
      <p className="text-sm text-zinc-500 mb-6">{productName}</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ ý kiến của bạn về sản phẩm này..."
          className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black resize-y min-h-[100px]"
          maxLength={1000}
          required
        />
        <p className="text-xs text-zinc-400 mt-1 text-right">{comment.length}/1000</p>
      </div>

      <button
        type="submit"
        disabled={!comment.trim() || submitting}
        className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Đang gửi..." : "Gửi bình luận"}
      </button>
    </form>
  );
}

interface ReplyFormProps {
  onSubmit: (reply: string) => Promise<void>;
  onCancel: () => void;
}

function ReplyForm({ onSubmit, onCancel }: ReplyFormProps) {
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSubmitting(true);
    await onSubmit(reply.trim());
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 bg-zinc-50 border border-zinc-200 p-4 rounded-lg">
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Nhập phản hồi..."
        className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black resize-none min-h-[80px]"
        maxLength={1000}
        autoFocus
        required
      />
      <div className="flex gap-2 mt-2">
        <button
          type="submit"
          disabled={!reply.trim() || submitting}
          className="px-4 py-1.5 bg-black text-white text-xs font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Đang gửi..." : "Gửi phản hồi"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 border border-zinc-300 text-zinc-600 text-xs font-medium rounded-lg hover:bg-zinc-100 transition-colors"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}

interface CommentCardProps {
  comment: Review;
  isAdmin: boolean;
  onReply: (reviewId: string, reply: string) => Promise<void>;
  onDelete: (reviewId: string) => Promise<void>;
  onDeleted: () => void;
}

function CommentCard({ comment, isAdmin, onReply, onDelete, onDeleted }: CommentCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    await onDelete(comment.id);
    onDeleted();
  };

  return (
    <div className="bg-white border border-zinc-200 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-200 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-zinc-600">
              {comment.user.firstName?.charAt(0) || "U"}
            </span>
          </div>
          <div>
            <p className="font-semibold">
              {comment.user.firstName} {comment.user.lastName}
            </p>
            <p className="text-xs text-zinc-500">{formatDate(comment.createdAt)}</p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-2 shrink-0">
            {!showReplyForm && (
              <button
                onClick={() => setShowReplyForm(true)}
                className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors"
                title="Phản hồi"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            )}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Xóa bình luận"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                <span className="text-xs text-red-600 font-medium">Xóa?</span>
                <button
                  onClick={handleDelete}
                  className="text-xs text-red-600 font-bold hover:underline"
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-zinc-500 hover:underline ml-1"
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {comment.comment && (
        <p className="text-zinc-600 text-sm leading-relaxed mt-4">{comment.comment}</p>
      )}

      {comment.adminReply && (
        <div className="mt-4 bg-brand-red/5 border-l-2 border-brand-red pl-4 py-3 rounded-r-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-brand-red/20 rounded-full flex items-center justify-center">
              <span className="text-[10px] font-bold text-brand-red">A</span>
            </div>
            <span className="text-xs font-bold text-brand-red uppercase tracking-wide">Quản trị viên</span>
            {comment.adminReplyAt && (
              <span className="text-xs text-zinc-400">{formatDate(comment.adminReplyAt)}</span>
            )}
          </div>
          <p className="text-sm text-zinc-700 leading-relaxed">{comment.adminReply}</p>
        </div>
      )}

      {showReplyForm && (
        <ReplyForm
          onSubmit={async (reply) => { await onReply(comment.id, reply); setShowReplyForm(false); }}
          onCancel={() => setShowReplyForm(false)}
        />
      )}
    </div>
  );
}

interface CommentsSectionProps {
  productId: string;
  productName: string;
}

export function CommentsSection({ productId, productName }: CommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === "ADMIN";

  const fetchComments = () => {
    if (_fetching.has(productId)) return;
    _fetching.add(productId);
    setLoading(true);
    getProductReviews(productId)
      .then((data) => {
        const seen = new Set<string>();
        setComments(data.filter((c) => {
          if (seen.has(c.id)) return false;
          seen.add(c.id);
          return true;
        }));
      })
      .catch(() => setComments([]))
      .finally(() => {
        _fetching.delete(productId);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchComments();
  }, [productId]);

  const handleCommentAdded = (comment: Review) => {
    setComments((prev) => [comment, ...prev]);
  };

  const handleReply = async (reviewId: string, reply: string) => {
    const updated = await replyReview(reviewId, reply);
    setComments((prev) =>
      prev.map((c) => (c.id === reviewId ? { ...c, ...updated } : c))
    );
  };

  const handleDelete = async (reviewId: string) => {
    await deleteReview(reviewId);
    setComments((prev) => prev.filter((c) => c.id !== reviewId));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-zinc-100 animate-pulse rounded" />
        <div className="h-32 bg-zinc-100 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CommentForm
        productId={productId}
        productName={productName}
        onCommentAdded={handleCommentAdded}
      />

      <div>
        <h3 className="text-xl font-bold uppercase tracking-tight mb-4">
          Bình luận ({comments.length})
        </h3>

        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                isAdmin={isAdmin}
                onReply={handleReply}
                onDelete={handleDelete}
                onDeleted={() => {}}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500 bg-white border border-zinc-200 rounded-xl">
            <p>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
          </div>
        )}
      </div>
    </div>
  );
}
