import { Heart, Loader2, ShoppingBag, Zap } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { ProductService } from "../../services/productService";
import { WishlistService } from "../../services/wishlistService";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  category?: string;
  basePrice?: number;
  discountPercent?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  totalStock?: number;
  totalSold?: number;
}

export default function ProductCard({
  id,
  name,
  price,
  imageUrl,
  category,
  basePrice,
  discountPercent = 0,
  isNew = false,
  isFeatured = false,
  totalStock,
  totalSold,
}: ProductCardProps) {
  const [busyAction, setBusyAction] = useState<"cart" | "buy" | "wishlist" | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const productId = Number(id);

  // Badge determinations according to hierarchy
  const isSoldOut = totalStock != null && totalStock === 0;
  const isLowStock = !isSoldOut && totalStock != null && totalStock > 0 && totalStock <= 5;
  const isSale = !isSoldOut && discountPercent != null && discountPercent > 0;
  const isNewArrival = !isSoldOut && !isSale && isNew;
  const isBestSeller = !isSoldOut && !isSale && !isNewArrival && isFeatured;

  const effectivePrice = isSale && (!price || price >= (basePrice || 0)) && (basePrice || 0) > 0
    ? Math.round((basePrice || 0) * (1 - discountPercent / 100))
    : price;
  const formattedPrice = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(effectivePrice);
  const displayImage = imageUrl || "https://placehold.co/600x600/f4f4f5/71717a?text=No+Image";

  const requireLogin = () => {
    if (isAuthenticated) return true;
    toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
    navigate("/login", { state: { from: `/products/${id}` } });
    return false;
  };

  const handleCartIntent = async (intent: "cart" | "buy") => {
    if (!requireLogin()) return;
    setBusyAction(intent);
    try {
      const detail = await ProductService.getProductById(productId);
      const variants = detail.variants.filter((variant) => variant.stock > 0);
      if (variants.length !== 1) {
        toast("Hãy chọn màu sắc và kích cỡ trước khi tiếp tục");
        navigate(`/products/${id}?intent=${intent}`);
        return;
      }
      await addToCart(variants[0].id, 1);
      toast.success("Đã thêm sản phẩm vào giỏ hàng");
      if (intent === "buy") navigate("/checkout");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể thêm sản phẩm vào giỏ hàng");
    } finally {
      setBusyAction(null);
    }
  };

  const handleWishlist = async () => {
    if (!requireLogin()) return;
    setBusyAction("wishlist");
    try {
      if (wishlisted) {
        await WishlistService.removeFromWishlist(productId);
        setWishlisted(false);
        toast.success("Đã bỏ khỏi danh sách yêu thích");
      } else {
        await WishlistService.addToWishlist(productId);
        setWishlisted(true);
        toast.success("Đã thêm vào danh sách yêu thích");
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "Không thể cập nhật danh sách yêu thích";
      if (message.toLowerCase().includes("tồn tại")) setWishlisted(true);
      toast.error(message);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <article className="group relative">
      <div className="relative mb-4 aspect-square overflow-hidden bg-zinc-100">
        {/* Badges Container */}
        <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1">
          {isSoldOut ? (
            <span className="inline-flex items-center bg-zinc-950/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md backdrop-blur-sm border border-white/20">
              Hết hàng
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center bg-amber-600 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md">
              Sắp hết hàng
            </span>
          ) : isSale ? (
            <span className="inline-flex items-center bg-red-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
              Sale -{discountPercent}%
            </span>
          ) : isNewArrival ? (
            <span className="inline-flex items-center border border-zinc-300 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-900 shadow-sm">
              Mới về
            </span>
          ) : isBestSeller ? (
            <span className="inline-flex items-center bg-zinc-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              Bán chạy
            </span>
          ) : null}
        </div>

        <Link to={`/products/${id}`} aria-label={`Xem ${name}`} className="block h-full w-full">
          <img
            src={displayImage}
            alt={name}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isSoldOut ? "opacity-75 grayscale-[20%]" : ""
            }`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = "https://placehold.co/600x600/f4f4f5/71717a?text=No+Image";
            }}
          />
        </Link>

        <button
          type="button"
          onClick={handleWishlist}
          disabled={busyAction !== null}
          aria-label={wishlisted ? "Bỏ khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/90 text-zinc-900 opacity-100 shadow-sm backdrop-blur transition hover:bg-zinc-900 hover:text-white disabled:opacity-50 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          {busyAction === "wishlist" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={`h-4 w-4 ${wishlisted ? "fill-current text-red-500" : ""}`} />}
        </button>

        {isSoldOut ? (
          <div className="absolute inset-x-3 bottom-3 translate-y-0 opacity-100 transition duration-300 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
            <Link
              to={`/products/${id}`}
              className="inline-flex h-11 w-full items-center justify-center gap-2 bg-zinc-900 px-3 text-xs font-black uppercase tracking-wider text-white shadow-lg transition hover:bg-zinc-800"
            >
              Xem chi tiết
            </Link>
          </div>
        ) : (
          <div className="absolute inset-x-3 bottom-3 grid translate-y-0 grid-cols-2 gap-2 opacity-100 transition duration-300 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
            <button type="button" onClick={() => handleCartIntent("cart")} disabled={busyAction !== null}
              className="inline-flex h-11 items-center justify-center gap-2 bg-white px-3 text-xs font-black uppercase tracking-wide text-zinc-900 shadow-lg transition hover:bg-zinc-100 disabled:opacity-60">
              {busyAction === "cart" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />} Thêm giỏ
            </button>
            <button type="button" onClick={() => handleCartIntent("buy")} disabled={busyAction !== null}
              className="inline-flex h-11 items-center justify-center gap-2 bg-zinc-900 px-3 text-xs font-black uppercase tracking-wide text-white shadow-lg transition hover:bg-red-600 disabled:opacity-60">
              {busyAction === "buy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} Mua ngay
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2 text-xs">
          <p className="font-semibold uppercase tracking-wider text-zinc-500 truncate">{category || "PeakSneaker"}</p>
          {totalSold != null && totalSold > 0 ? (
            <span className="shrink-0 text-[11px] font-semibold text-zinc-600">
              Đã bán {totalSold}
            </span>
          ) : isNew ? (
            <span className="shrink-0 text-[11px] font-semibold text-emerald-600">
              Mới về
            </span>
          ) : null}
        </div>
        <Link to={`/products/${id}`} className="block text-sm font-bold leading-tight text-zinc-900 hover:underline line-clamp-1">{name}</Link>
        {isSale && basePrice && basePrice > effectivePrice ? (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-black text-red-600">{formattedPrice}</span>
            <span className="text-xs text-zinc-400 line-through">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(basePrice)}
            </span>
          </div>
        ) : (
          <p className="text-sm font-medium text-zinc-900">{formattedPrice}</p>
        )}
      </div>
    </article>
  );
}
