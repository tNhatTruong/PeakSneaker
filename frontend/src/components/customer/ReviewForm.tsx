import { useState, useEffect } from "react";
import StarRating from "./StarRating";
import { ReviewService, type ReviewResponse } from "../../services/reviewService";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface ReviewFormProps {
  productId: number;
  onReviewSubmitted: () => void;
}

export default function ReviewForm({ productId, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [canReview, setCanReview] = useState(false);
  const [existingReview, setExistingReview] = useState<ReviewResponse | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    checkReviewStatus();
  }, [productId]);

  const checkReviewStatus = async () => {
    try {
      // 1. Kiểm tra quyền đánh giá
      const resCanReview = await ReviewService.checkCanReview(productId);
      // @ts-ignore
      setCanReview(resCanReview?.data || false);

      // 2. Lấy đánh giá cũ nếu có
      const resMyReview = await ReviewService.getMyReview(productId);
      // @ts-ignore
      if (resMyReview?.data) {
        // @ts-ignore
        const reviewData = resMyReview.data as ReviewResponse;
        setExistingReview(reviewData);
        setRating(reviewData.rating);
        setComment(reviewData.comment || "");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá.");
      return;
    }

    try {
      setLoading(true);
      await ReviewService.addOrUpdateReview({
        productId,
        rating,
        comment
      });
      toast.success(existingReview ? "Cập nhật đánh giá thành công!" : "Gửi đánh giá thành công!");
      checkReviewStatus();
      onReviewSubmitted();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Đã có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  if (isInitializing) {
    return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-zinc-400" /></div>;
  }

  // Nếu chưa mua hoặc chưa nhận hàng
  if (!canReview && !existingReview) {
    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-8 text-center">
        <h3 className="text-lg font-bold uppercase text-zinc-900 mb-2">Đánh giá sản phẩm</h3>
        <p className="text-zinc-500 text-sm">
          Bạn chỉ có thể đánh giá sau khi đã mua và nhận hàng thành công.
        </p>
      </div>
    );
  }

  // Nếu đã đánh giá và đã bị khóa sửa (isEdited = true)
  if (existingReview && existingReview.isEdited) {
    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-8 text-center">
        <h3 className="text-lg font-bold uppercase text-zinc-900 mb-2">Đánh giá của bạn</h3>
        <p className="text-zinc-500 text-sm">
          Bạn đã đánh giá sản phẩm này. Cảm ơn phản hồi của bạn!
        </p>
      </div>
    );
  }

  return (
    <div className="text-left">
      <h3 className="text-xl font-black uppercase tracking-wide text-zinc-900 mb-6">
        {existingReview ? "Chỉnh sửa đánh giá" : "Viết đánh giá của bạn"}
      </h3>
      
      {existingReview && !existingReview.isEdited && (
        <div className="mb-6 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100">
          Lưu ý: Bạn chỉ được phép chỉnh sửa đánh giá <b>1 lần duy nhất</b>.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-2">Chất lượng sản phẩm</label>
          <StarRating rating={rating} onRatingChange={setRating} size="lg" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-2">Trải nghiệm của bạn</label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Hãy chia sẻ những điều bạn thích về sản phẩm này..."
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none text-sm"
          />
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <button
            type="button"
            onClick={onReviewSubmitted}
            className="px-6 py-2.5 bg-zinc-100 text-zinc-700 text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Đóng
          </button>
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="px-6 py-2.5 bg-black text-white text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-zinc-800 disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors flex items-center justify-center"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {existingReview ? "Lưu thay đổi" : "Gửi đánh giá"}
          </button>
        </div>
      </form>
    </div>
  );
}
