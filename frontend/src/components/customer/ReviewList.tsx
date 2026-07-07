import { useState, useEffect } from "react";
import StarRating from "./StarRating";
import { ReviewService, type ReviewResponse, type ReviewStatsResponse } from "../../services/reviewService";
import { Loader2, ChevronLeft, ChevronRight, User } from "lucide-react";

interface ReviewListProps {
  productId: number;
}

export default function ReviewList({ productId }: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [stats, setStats] = useState<ReviewStatsResponse | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchReviews(page);
  }, [productId, page]);

  const fetchStats = async () => {
    try {
      const res = await ReviewService.getProductReviewStats(productId);
      // @ts-ignore
      if (res?.data) {
        // @ts-ignore
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReviews = async (pageNum: number) => {
    try {
      setLoading(true);
      const res = await ReviewService.getProductReviews(productId, pageNum, 5);
      // @ts-ignore
      if (res?.data) {
        // @ts-ignore
        setReviews(res.data.content);
        // @ts-ignore
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl">
      {/* Stats Header */}
      {stats && stats.totalReviews > 0 && (
        <div className="flex flex-col md:flex-row items-center gap-6 p-6 md:p-8 bg-zinc-50 border border-zinc-200 rounded-xl mb-8">
          <div className="text-center md:text-left">
            <div className="text-5xl font-black tracking-tighter text-zinc-900 mb-2">
              {stats.averageRating.toFixed(1)} <span className="text-xl text-zinc-400 font-medium">/ 5</span>
            </div>
            <StarRating rating={Math.round(stats.averageRating)} readonly size="md" />
            <div className="text-sm text-zinc-500 font-medium mt-2">Dựa trên {stats.totalReviews} đánh giá</div>
          </div>
        </div>
      )}

      {/* Review List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-300" /></div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-xl border-dashed">
            Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên!
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-zinc-100 pb-6 last:border-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-zinc-500" />
                </div>
                <div>
                  <div className="font-bold text-sm text-zinc-900">{review.userName}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating rating={review.rating} readonly size="sm" />
                    <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">
                      {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                      {review.isEdited && " (Đã chỉnh sửa)"}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-zinc-600 text-sm leading-relaxed">{review.comment}</p>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-sm font-medium text-zinc-600 px-4">
            Trang {page + 1} / {totalPages}
          </span>
          
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="p-2 border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
