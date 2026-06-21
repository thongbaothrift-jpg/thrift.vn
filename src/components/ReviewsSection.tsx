"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getProductReviews, createReview, type Review } from "@/lib/api/reviews-notifications";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

interface ReviewFormProps {
  productId: string;
  productName: string;
  productImage?: string;
  onReviewAdded: (review: Review) => void;
}

export function ReviewForm({ productId, productName, productImage, onReviewAdded }: ReviewFormProps) {
  const { isAuthenticated } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !title || !content) return;

    setSubmitting(true);
    setError("");

    try {
      const review = await createReview({ productId, rating, title, comment: content });
      onReviewAdded(review);
      setRating(0);
      setTitle("");
      setContent("");
      setImages([]);
    } catch (err: any) {
      setError(err.message || "Gửi đánh giá thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white border border-zinc-200 p-6 text-center">
        <p className="text-zinc-500 mb-4">Vui lòng <a href="/auth/login" className="text-black font-semibold hover:text-brand-red">đăng nhập</a> để viết đánh giá.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 p-6">
      <h3 className="text-xl font-bold uppercase tracking-tight mb-6">Viết đánh giá</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm mb-4">{error}</div>
      )}

      {productName && (
        <div className="flex items-center gap-3 p-4 bg-zinc-50 mb-6">
          {productImage && (
            <div className="w-12 h-16 bg-zinc-200 relative overflow-hidden flex-shrink-0">
              <Image src={productImage} alt={productName} fill className="object-cover" sizes="48px" />
            </div>
          )}
          <div>
            <p className="text-sm text-zinc-500">Đánh giá sản phẩm:</p>
            <p className="font-semibold">{productName}</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <label className="block font-label text-zinc-700 mb-2">Xếp hạng của bạn *</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= (hoverRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-zinc-300"
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-zinc-500 mt-2">
            {rating === 5 && "Tuyệt vời!"}
            {rating === 4 && "Rất tốt"}
            {rating === 3 && "Bình thường"}
            {rating === 2 && "Không hài lòng"}
            {rating === 1 && "Rất tệ"}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="block font-label text-zinc-700 mb-2">Tiêu đề đánh giá *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tóm tắt trải nghiệm của bạn"
          className="input-field"
          maxLength={100}
          required
        />
        <p className="text-xs text-zinc-400 mt-1 text-right">{title.length}/100</p>
      </div>

      <div className="mb-4">
        <label className="block font-label text-zinc-700 mb-2">Nội dung đánh giá *</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Chia sẻ chi tiết trải nghiệm của bạn với sản phẩm này..."
          className="input-field min-h-[120px] resize-y"
          maxLength={1000}
          required
        />
        <p className="text-xs text-zinc-400 mt-1 text-right">{content.length}/1000</p>
      </div>

      <button
        type="submit"
        disabled={rating === 0 || !title || !content || submitting}
        className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Đang gửi..." : "Gửi đánh giá"}
      </button>
    </form>
  );
}

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const [helpful, setHelpful] = useState(false);

  return (
    <div className="bg-white border border-zinc-200 p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-200 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-zinc-600">
              {review.user.firstName?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{review.user.firstName} {review.user.lastName}</span>
            </div>
            <p className="text-xs text-zinc-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= (review.rating ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-zinc-300"
              }`}
            />
          ))}
        </div>
      </div>
      {review.title && <h4 className="font-semibold mb-2">{review.title}</h4>}
      {review.comment && <p className="text-zinc-600 text-sm leading-relaxed mb-4">{review.comment}</p>}
    </div>
  );
}

interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingCounts: Record<number, number>;
  onFilterRating?: (rating: number | null) => void;
  activeFilter?: number | null;
}

export function ReviewSummary({ averageRating, totalReviews, ratingCounts, onFilterRating, activeFilter }: ReviewSummaryProps) {
  return (
    <div className="bg-white border border-zinc-200 p-6">
      <div className="flex flex-col md:flex-row md:items-center gap-8">
        <div className="text-center md:border-r border-zinc-200 md:pr-8">
          <div className="text-5xl font-black">{averageRating.toFixed(1)}</div>
          <div className="flex gap-0.5 justify-center my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${star <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-zinc-300"}`}
              />
            ))}
          </div>
          <p className="text-sm text-zinc-500">{totalReviews} đánh giá</p>
        </div>
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingCounts[rating] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <button
                key={rating}
                onClick={() => onFilterRating?.(activeFilter === rating ? null : rating)}
                className={`flex items-center gap-3 w-full group ${activeFilter === rating ? "" : "hover:bg-zinc-50"}`}
              >
                <span className="text-sm w-6">{rating}</span>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                </div>
                <span className="text-sm text-zinc-500 w-10 text-right">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface ReviewsSectionProps {
  productId: string;
  productName: string;
  productImage?: string;
}

export function ReviewsSection({ productId, productName, productImage }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");

  useEffect(() => {
    setLoading(true);
    getProductReviews(productId)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [productId]);

  const handleReviewAdded = (review: Review) => {
    setReviews((prev) => [review, ...prev]);
  };

  const filteredReviews = activeFilter
    ? reviews.filter((r) => r.rating === activeFilter)
    : reviews;

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === "highest") return (b.rating ?? 0) - (a.rating ?? 0);
    if (sortBy === "lowest") return (a.rating ?? 0) - (b.rating ?? 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const ratingCounts = reviews.reduce((acc, r) => {
    const rating = r.rating ?? 0;
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-zinc-100 animate-pulse rounded" />
        <div className="h-64 bg-zinc-100 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReviewSummary
        averageRating={avgRating}
        totalReviews={reviews.length}
        ratingCounts={ratingCounts}
        onFilterRating={setActiveFilter}
        activeFilter={activeFilter}
      />
      <ReviewForm
        productId={productId}
        productName={productName}
        productImage={productImage}
        onReviewAdded={handleReviewAdded}
      />
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold uppercase tracking-tight">
            Đánh giá ({filteredReviews.length})
          </h3>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="input-field py-2 text-sm w-auto"
          >
            <option value="newest">Mới nhất</option>
            <option value="highest">Cao nhất</option>
            <option value="lowest">Thấp nhất</option>
          </select>
        </div>
        <div className="space-y-4">
          {sortedReviews.length > 0 ? (
            sortedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          ) : (
            <div className="text-center py-12 text-zinc-500">
              <p>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
