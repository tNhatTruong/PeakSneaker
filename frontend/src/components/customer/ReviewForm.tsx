import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import StarRating from "./StarRating";
import { ReviewService, type ReviewResponse } from "../../services/reviewService";
import toast from "react-hot-toast";
import { Loader2, LogIn, PackageCheck } from "lucide-react";

interface ReviewFormProps {
  productId: number;
  onReviewSubmitted: () => void;
}

export default function ReviewForm({ productId, onReviewSubmitted }: ReviewFormProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [canReview, setCanReview] = useState(false);
  const [existingReview, setExistingReview] = useState<ReviewResponse | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    if (!isLoggedIn) {
      setIsInitializing(false);
      return;
    }
    checkReviewStatus();
  }, [productId, isLoggedIn]);

  const checkReviewStatus = async () => {
    try {
      // 1. Kiểm tra quyền đánh giá (đã mua & đơn hàng đã giao DELIVERED hoặc COMPLETED)
      const resCanReview = await ReviewService.checkCanReview(productId);
      setCanReview(resCanReview);

      // 2. Lấy đánh giá cũ nếu có
      const resMyReview = await ReviewService.getMyReview(productId);
      if (resMyReview) {
        const reviewData = resMyReview;
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
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để gửi đánh giá.");
      navigate("/login", { state: { from: location } });
      return;
    }

    if (rating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá.");
      return;
    }

    try {
      setLoading(true);
      await ReviewService.addOrUpdateReview({
        productId,
        rating,
        comment,
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
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  // Trường hợp 1: Người dùng chưa đăng nhập
  if (!isLoggedIn) {
    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 sm:p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-zinc-700">
          <LogIn className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-black uppercase text-zinc-950">
            Yêu cầu đăng nhập tài khoản
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
            Bạn cần đăng nhập tài khoản đã mua sản phẩm để hệ thống xác thực đơn hàng và cho phép viết đánh giá.
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={onReviewSubmitted}
            className="px-5 py-2.5 bg-white border border-zinc-300 text-zinc-700 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-zinc-50 transition"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => navigate("/login", { state: { from: location } })}
            className="px-5 py-2.5 bg-zinc-950 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-zinc-800 transition inline-flex items-center gap-1.5 shadow-sm"
          >
            <LogIn className="h-4 w-4" /> Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  // Trường hợp 2: Đã đăng nhập nhưng chưa mua hoặc đơn hàng chưa nhận (chưa DELIVERED / COMPLETED)
  if (!canReview && !existingReview) {
    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 sm:p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <PackageCheck className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-black uppercase text-zinc-950">
            Chưa đủ điều kiện đánh giá
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
            Bạn chỉ có thể đánh giá sản phẩm sau khi đã đặt mua thành công và đơn hàng chuyển sang trạng thái{" "}
            <span className="font-bold text-zinc-900">Đã nhận hàng (DELIVERED)</span> hoặc{" "}
            <span className="font-bold text-zinc-900">Hoàn tất (COMPLETED)</span>.
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={onReviewSubmitted}
            className="px-5 py-2.5 bg-white border border-zinc-300 text-zinc-700 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-zinc-50 transition"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="px-5 py-2.5 bg-zinc-950 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-zinc-800 transition shadow-sm"
          >
            Xem lịch sử đơn hàng
          </button>
        </div>
      </div>
    );
  }

  // Trường hợp 3: Đã đăng nhập và đủ điều kiện đánh giá (hoặc chỉnh sửa đánh giá cũ)
  return (
    <div className="text-left">
      <h3 className="text-lg sm:text-xl font-black uppercase tracking-wide text-zinc-950 mb-6">
        {existingReview ? "Chỉnh sửa đánh giá của bạn" : "Viết đánh giá sản phẩm"}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
            Mức độ hài lòng <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <StarRating rating={rating} onRatingChange={setRating} size="lg" />
            <span className="text-xs font-bold text-zinc-700">
              {rating === 5 && "Tuyệt vời (5/5)"}
              {rating === 4 && "Rất tốt (4/5)"}
              {rating === 3 && "Hài lòng (3/5)"}
              {rating === 2 && "Chưa hài lòng (2/5)"}
              {rating === 1 && "Rất tệ (1/5)"}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
            Trải nghiệm & Cảm nhận thực tế
          </label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ về độ êm, form giày, chất lượng gia công, đóng gói hoặc giao hàng..."
            className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none text-xs sm:text-sm text-zinc-800"
          />
        </div>

        <div className="flex gap-3 justify-end pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={onReviewSubmitted}
            className="px-5 py-2.5 bg-zinc-100 text-zinc-700 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="px-6 py-2.5 bg-zinc-950 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 transition-colors flex items-center justify-center shadow-sm"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {existingReview ? "Lưu thay đổi" : "Gửi đánh giá"}
          </button>
        </div>
      </form>
    </div>
  );
}
