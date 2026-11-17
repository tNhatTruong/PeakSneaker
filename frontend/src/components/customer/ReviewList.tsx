import { useState, useEffect, useMemo } from "react";
import StarRating from "./StarRating";
import { ReviewService, type ReviewResponse, type ReviewStatsResponse } from "../../services/reviewService";
import { Loader2, ChevronLeft, ChevronRight, User, CheckCircle2, ThumbsUp, X, Star } from "lucide-react";
import ReviewForm from "./ReviewForm";

interface ReviewListProps {
  productId: number;
}

export default function ReviewList({ productId }: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [stats, setStats] = useState<ReviewStatsResponse | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [likedReviews, setLikedReviews] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchStats();
    fetchReviews(page);
  }, [productId, page]);

  const fetchStats = async () => {
    try {
      const res = await ReviewService.getProductReviewStats(productId);
      setStats(res);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReviews = async (pageNum: number) => {
    try {
      setLoading(true);
      const res = await ReviewService.getProductReviews(productId, pageNum, 5);
      setReviews(res.content);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (reviews.length > 0) {
      reviews.forEach((r) => {
        const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
        counts[star] = (counts[star] || 0) + 1;
      });
    } else if (stats && stats.totalReviews > 0) {
      const avg = Math.min(5, Math.max(1, Math.round(stats.averageRating))) as 1 | 2 | 3 | 4 | 5;
      counts[avg] = stats.totalReviews;
    }
    return counts;
  }, [reviews, stats]);

  const totalReviewsCount = stats?.totalReviews || reviews.length || 0;
  const avgRating = stats?.averageRating ? stats.averageRating : 5.0;

  const toggleLike = (reviewId: number) => {
    setLikedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  return (
    <div id="reviews-section" className="bg-white">
      {/* Header matching reference mockup */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-5 mb-8">
        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-950">
          Đánh giá sản phẩm
        </h3>
        <button
          type="button"
          onClick={() => setIsWriteModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white transition hover:bg-zinc-800 active:scale-95 shadow-sm"
        >
          Viết đánh giá
        </button>
      </div>

      {/* Main 2-Column Rating Showcase Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LEFT: Rating Breakdown Card (5 cols on lg) */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-black tracking-tight text-zinc-950">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-2xl font-bold text-zinc-400">/ 5</span>
            </div>

            {/* Stars row */}
            <div className="flex items-center text-amber-400 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(avgRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-zinc-200"
                  }`}
                />
              ))}
            </div>

            <p className="text-xs sm:text-sm font-medium text-zinc-500 mb-6">
              Dựa trên {totalReviewsCount} đánh giá
            </p>

            {/* 5-tier Distribution Bars */}
            <div className="space-y-3 border-t border-zinc-100 pt-5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingCounts[star as keyof typeof ratingCounts] || 0;
                const percentage =
                  totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;

                return (
                  <div key={star} className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 font-bold text-zinc-700 w-7">
                      {star} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </span>

                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <span className="w-6 text-right font-mono text-zinc-500 font-medium">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Individual Reviews List (7 cols on lg) */}
        <div className="lg:col-span-7">
          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-10 text-center">
              <p className="text-sm font-bold text-zinc-800">Chưa có đánh giá nào cho sản phẩm này</p>
              <p className="mt-1 text-xs text-zinc-500">
                Hãy là người đầu tiên trải nghiệm và chia sẻ cảm nhận của bạn!
              </p>
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(true)}
                className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-zinc-800"
              >
                Gửi đánh giá đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review, idx) => {
                const isLiked = likedReviews[review.id];
                const likeCount = isLiked ? 1 : 0;

                return (
                  <div
                    key={review.id}
                    className={`pb-6 ${
                      idx !== reviews.length - 1 ? "border-b border-zinc-100" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-zinc-900">
                              {review.userName}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Đã mua hàng
                            </span>
                          </div>

                          <div className="mt-1 flex items-center gap-2">
                            <StarRating rating={review.rating} readonly size="sm" />
                            <span className="text-xs text-zinc-400 font-medium">
                              {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3.5 text-sm leading-relaxed text-zinc-700">
                      {review.comment}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleLike(review.id)}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                          isLiked
                            ? "bg-zinc-100 text-zinc-900 font-bold"
                            : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                        }`}
                      >
                        <ThumbsUp className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`} />
                        <span>{likeCount}</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="text-xs font-bold text-zinc-700">
                    Trang {page + 1} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsWriteModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              <X className="h-5 w-5" />
            </button>

            <ReviewForm
              productId={productId}
              onReviewSubmitted={() => {
                setIsWriteModalOpen(false);
                fetchStats();
                fetchReviews(0);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}