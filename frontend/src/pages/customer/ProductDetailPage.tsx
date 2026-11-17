import {
  AlertCircle,
  Bell,
  Star,
  Truck,
  Ruler,
  Loader2,
  X,
  Heart,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ShoppingBag,
  Zap,
  Minus,
  Plus,
  RotateCcw,
  CheckCircle2,
  Search,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { ProductService, type ProductDetailResponse, type ProductResponse } from "../../services/productService";
import { ReviewService, type ReviewStatsResponse } from "../../services/reviewService";
import { WishlistService } from "../../services/wishlistService";
import { useCart } from "../../context/CartContext";
import toast from "react-hot-toast";
import ReviewList from "../../components/customer/ReviewList";
import ProductCard from "../../components/customer/ProductCard";
import sizeGuideImg from "../../assets/images/Size-guide.jpg";
import PageBackButton from "../../components/common/PageBackButton";

const SIZE_COLLATOR = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

const formatVND = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

const formatGenderVi = (gender?: string | null) => {
  if (!gender) return "Mọi đối tượng";
  switch (gender.toUpperCase()) {
    case "MEN":
      return "Nam";
    case "WOMEN":
      return "Nữ";
    case "UNISEX":
      return "Unisex";
    case "KIDS":
      return "Trẻ em";
    default:
      return gender;
  }
};

const ATTRIBUTE_LABELS: Record<string, string> = {
  material: "Chất liệu",
  sole: "Đế giày",
  design: "Thiết kế",
  usage: "Phù hợp",
  origin: "Xuất xứ",
  style_code: "Mã kiểu dáng",
  colorway: "Phối màu",
  release_date: "Ngày phát hành",
  technology: "Công nghệ",
  weight: "Trọng lượng",
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [reviewStats, setReviewStats] = useState<ReviewStatsResponse | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<ProductResponse[]>([]);

  // Selection states
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [thumbIndex, setThumbIndex] = useState(0);

  // Modals & Tabs
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "care" | "returns">("description");
  const [copiedLink, setCopiedLink] = useState(false);

  const parsedAttributes = useMemo(() => {
    if (!product?.attributes) return null;
    try {
      return JSON.parse(product.attributes) as Record<string, string>;
    } catch {
      return null;
    }
  }, [product?.attributes]);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await ProductService.getProductById(Number(id));
        setProduct(data);
        setQuantity(1);

        // Auto-select first available color and size
        if (data.variants && data.variants.length > 0) {
          const firstVariant = data.variants[0];
          setSelectedColor(firstVariant.color);
          setSelectedSize(firstVariant.size);
        }

        // Fetch review stats
        try {
          const statsRes = await ReviewService.getProductReviewStats(Number(id));
          setReviewStats(statsRes);
        } catch (e) {
          console.error("Failed to fetch review stats", e);
        }

        // Fetch related products (by brand or fallback to featured)
        try {
          if (data.brand?.id) {
            const relatedRes = await ProductService.filterProducts({
              brandId: data.brand.id,
              page: 0,
              size: 4,
            });
            const filtered = (relatedRes.items || []).filter((p) => p.id !== Number(id)).slice(0, 4);
            setRelatedProducts(filtered);
          } else {
            const featured = await ProductService.getFeaturedProducts(4);
            setRelatedProducts(featured.filter((p) => p.id !== Number(id)).slice(0, 4));
          }
        } catch {
          // Non-blocking
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Không thể tải thông tin sản phẩm.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  // Wishlist check
  useEffect(() => {
    if (!id || !localStorage.getItem("token")) return;
    let isMounted = true;
    WishlistService.checkInWishlist(Number(id))
      .then((res) => {
        if (isMounted) setWishlisted(res);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleToggleWishlist = async () => {
    if (!id) return;
    if (!localStorage.getItem("token")) {
      toast.error("Vui lòng đăng nhập để lưu vào danh sách yêu thích");
      navigate("/login", { state: { from: location } });
      return;
    }
    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await WishlistService.removeFromWishlist(Number(id));
        setWishlisted(false);
        toast.success("Đã bỏ khỏi danh sách yêu thích");
      } else {
        await WishlistService.addToWishlist(Number(id));
        setWishlisted(true);
        toast.success("Đã thêm vào danh sách yêu thích");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Không thể cập nhật danh sách yêu thích");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success("Đã sao chép liên kết sản phẩm!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Derived states
  const availableColors = useMemo(() => {
    if (!product) return [];
    return Array.from(new Set(product.variants.map((v) => v.color)));
  }, [product]);

  const availableSizesForColor = useMemo(() => {
    if (!product || !selectedColor) return [];
    return product.variants
      .filter((v) => v.color === selectedColor)
      .map((v) => v.size)
      .sort(SIZE_COLLATOR.compare);
  }, [product, selectedColor]);

  const currentVariant = useMemo(() => {
    if (!product) return null;
    return product.variants.find((v) => v.color === selectedColor && v.size === selectedSize);
  }, [product, selectedColor, selectedSize]);

  // Derived prices calculation (supporting Sale discount and price adjustments)
  const currentVariantOriginalPrice = useMemo(() => {
    if (currentVariant?.originalPrice != null) return currentVariant.originalPrice;
    const base = product?.basePrice || 0;
    const adjustment = currentVariant?.priceMultiplier || 0;
    return base + adjustment;
  }, [currentVariant, product]);

  const currentVariantDiscountedPrice = useMemo(() => {
    const discount = product?.discountPercent || 0;
    if (discount <= 0) {
      return currentVariantOriginalPrice;
    }
    // If backend provided a finalPrice strictly lower than originalPrice, honor it
    if (currentVariant?.finalPrice != null && currentVariant.finalPrice < currentVariantOriginalPrice) {
      return currentVariant.finalPrice;
    }
    // Fallback: calculate using discount percent
    const factor = 1 - discount / 100;
    return Math.round(currentVariantOriginalPrice * factor);
  }, [currentVariant, product, currentVariantOriginalPrice]);

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    if (product) {
      const sizesForNewColor = product.variants
        .filter((v) => v.color === color)
        .map((v) => v.size)
        .sort(SIZE_COLLATOR.compare);
      if (!sizesForNewColor.includes(selectedSize)) {
        setSelectedSize(sizesForNewColor[0] || "");
      }
    }
  };

  const handleAddToCart = async () => {
    if (!currentVariant) return;
    if (currentVariant.stock <= 0) {
      toast.error("Biến thể này hiện đã hết hàng!");
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(currentVariant.id, quantity);
      toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng.");
        navigate("/login", { state: { from: location } });
      } else {
        toast.error(err.response?.data?.message || "Đã xảy ra lỗi khi thêm vào giỏ hàng.");
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    if (!currentVariant || !product) return;
    if (currentVariant.stock <= 0) {
      toast.error("Biến thể này hiện đã hết hàng!");
      return;
    }

    navigate("/checkout", {
      state: {
        buyNowVariantId: currentVariant.id,
        buyNowQuantity: quantity,
        buyNowItem: {
          id: currentVariant.id,
          productName: product.name,
          productThumbnail:
            product.images.find((img) => img.isPrimary)?.imageUrl || product.images[0]?.imageUrl || "",
          size: currentVariant.size,
          color: currentVariant.color,
          price: currentVariantDiscountedPrice,
          quantity: quantity,
        },
      },
    });
  };

  // Image navigation
  const allImages = product?.images || [];
  const defaultImage = allImages.find((img) => img.isPrimary) || allImages[0];
  const activeImage = allImages.find((img) => img.id === selectedImageId) || defaultImage;
  const displayImage = activeImage?.imageUrl || "https://placehold.co/800x800?text=PeakSneaker";
  const currentImageIndex = allImages.findIndex((img) => img.id === activeImage?.id);

  const handlePrevImage = () => {
    if (allImages.length <= 1) return;
    const prevIndex = (currentImageIndex - 1 + allImages.length) % allImages.length;
    setSelectedImageId(allImages[prevIndex]?.id ?? null);
  };

  const handleNextImage = () => {
    if (allImages.length <= 1) return;
    const nextIndex = (currentImageIndex + 1) % allImages.length;
    setSelectedImageId(allImages[nextIndex]?.id ?? null);
  };

  const productHighlights = [
    {
      label: "Chất liệu",
      value: parsedAttributes?.material || "Canvas cao cấp dệt mật độ cao kết hợp da bảo vệ",
    },
    {
      label: "Đế giày",
      value: parsedAttributes?.sole || "Cao su lưu hóa bền bỉ, rãnh ma sát chống trơn trượt",
    },
    {
      label: "Thiết kế",
      value:
        parsedAttributes?.design ||
        (product?.silhouette?.name
          ? `Cổ cao cổ điển, inspired by ${product.silhouette.name}`
          : "Cổ điển thanh lịch, tôn dáng và phom chân thể thao"),
    },
    {
      label: "Phù hợp",
      value: parsedAttributes?.usage || "Đi học, đi chơi, dạo phố và phối đồ Streetwear thời thượng",
    },
  ];

  const totalStock = product?.variants
    ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    : 0;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-900" />
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-zinc-500">
          Đang tải thông tin sản phẩm...
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-white px-4 text-center">
        <div className="rounded-full bg-red-50 p-4 text-red-500">
          <X className="h-8 w-8" />
        </div>
        <p className="text-xl font-bold uppercase tracking-wide text-zinc-900">
          {error || "Sản phẩm không tồn tại hoặc đã ngừng kinh doanh"}
        </p>
        <Link
          to="/shop"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-zinc-800"
        >
          <ChevronLeft className="h-4 w-4" /> Quay lại Cửa hàng
        </Link>
      </div>
    );
  }

  const isAllOutOfStock = totalStock === 0;
  const isLowTotalStock = !isAllOutOfStock && totalStock > 0 && totalStock <= 5;
  const displayPrice = currentVariant
    ? currentVariantDiscountedPrice
    : (product.price && product.price < product.basePrice
        ? product.price
        : (product.discountPercent && product.discountPercent > 0
            ? Math.round(product.basePrice * (1 - product.discountPercent / 100))
            : product.basePrice));
  const displayOriginalPrice = currentVariant ? currentVariantOriginalPrice : product.basePrice;
  const hasDiscount = Boolean(product.discountPercent && product.discountPercent > 0 && displayOriginalPrice > displayPrice);
  const isOutOfStock = isAllOutOfStock || !currentVariant || currentVariant.stock <= 0;
  const totalSold = product.totalSold ?? 0;

  return (
    <div className="min-h-screen bg-white pb-24 font-sans text-zinc-900">
      {/* Top Breadcrumbs & Back Bar matching mockup */}
      <div className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <PageBackButton fallbackTo="/shop" label="Quay lại" />

            <nav className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <Link to="/" className="hover:text-zinc-950 transition">
                Trang chủ
              </Link>
              <span className="text-zinc-300 font-bold">&gt;</span>

              {product.brand && (
                <>
                  <Link to={`/shop?brand=${product.brand.slug}`} className="hover:text-zinc-950 transition">
                    {product.brand.name}
                  </Link>
                  <span className="text-zinc-300 font-bold">&gt;</span>
                </>
              )}

              {product.silhouette && (
                <>
                  <Link
                    to={`/shop?brand=${product.brand?.slug}&silhouette=${product.silhouette.slug}`}
                    className="hover:text-zinc-950 transition"
                  >
                    {product.silhouette.name}
                  </Link>
                  <span className="text-zinc-300 font-bold">&gt;</span>
                </>
              )}

              <span className="font-medium text-zinc-800 line-clamp-1">{product.name}</span>
            </nav>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            title="Chia sẻ sản phẩm"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:border-zinc-950 hover:text-zinc-950 active:scale-95"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
            <span>{copiedLink ? "Đã chép" : "Chia sẻ"}</span>
          </button>
        </div>
      </div>

      {/* Main Showcase Grid */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          
          {/* LEFT: Sneaker Gallery & Guarantees (6 cols on lg) */}
          <div className="lg:col-span-6">
            <div className="flex gap-4">
              {/* Vertical Thumbnail Rail with Up/Down buttons */}
              {allImages.length > 1 && (
                <div className="flex flex-col items-center flex-shrink-0 w-16 sm:w-20">
                  <button
                    type="button"
                    onClick={() => setThumbIndex((p) => Math.max(0, p - 1))}
                    disabled={thumbIndex === 0}
                    className="flex h-7 w-full items-center justify-center text-zinc-400 hover:text-zinc-900 disabled:opacity-20 transition mb-1"
                    aria-label="Ảnh trước"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>

                  <div className="flex flex-col gap-2.5">
                    {allImages.slice(thumbIndex, thumbIndex + 4).map((img, idx) => {
                      const isSelected = activeImage?.id === img.id;
                      return (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => setSelectedImageId(img.id)}
                          className={`group relative h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-lg border-2 bg-white p-1.5 transition-all ${
                            isSelected
                              ? "border-zinc-950 shadow-sm ring-1 ring-zinc-950"
                              : "border-zinc-200 hover:border-zinc-400"
                          }`}
                          aria-label={`Xem ảnh ${idx + 1}`}
                        >
                          <img
                            src={img.imageUrl}
                            alt=""
                            className="h-full w-full object-contain mix-blend-multiply transition duration-200 group-hover:scale-105"
                          />
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setThumbIndex((p) => Math.min(Math.max(0, allImages.length - 4), p + 1))
                    }
                    disabled={thumbIndex >= Math.max(0, allImages.length - 4)}
                    className="flex h-7 w-full items-center justify-center text-zinc-400 hover:text-zinc-900 disabled:opacity-20 transition mt-1"
                    aria-label="Ảnh tiếp theo"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Main Product Image Container */}
              <div className="relative aspect-square flex-1 overflow-hidden rounded-2xl border border-zinc-200/90 bg-gradient-to-b from-[#fafafa] to-[#f4f4f4] p-6 sm:p-10 flex items-center justify-center">
                {/* Floating Wishlist Heart Button at Top-Right (matching mockup) */}
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  disabled={wishlistLoading}
                  aria-label={wishlisted ? "Bỏ khỏi yêu thích" : "Lưu vào yêu thích"}
                  className={`absolute top-4 right-4 z-20 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-zinc-200/80 bg-white shadow-sm transition hover:scale-105 active:scale-95 ${
                    wishlisted ? "text-red-500 bg-red-50/60" : "text-zinc-600 hover:text-red-500"
                  }`}
                >
                  {wishlistLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  ) : (
                    <Heart className={`h-5 w-5 ${wishlisted ? "fill-current text-red-500" : ""}`} />
                  )}
                </button>

                {/* Floating Zoom / Lightbox Pill at Bottom-Right (matching mockup) */}
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="absolute bottom-4 right-4 z-20 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-zinc-950 active:scale-95"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Phóng to</span>
                </button>

                {/* Product Image Stage */}
                <div
                  className="relative h-full w-full flex items-center justify-center cursor-zoom-in"
                  onClick={() => setIsLightboxOpen(true)}
                >
                  <img
                    src={displayImage}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-300 hover:scale-110 drop-shadow-sm select-none"
                  />
                </div>
              </div>
            </div>

            {/* Guarantees Bar directly below the image (matching mockup) */}
            <div className="mt-4 rounded-xl border border-zinc-200/80 bg-white py-3 px-4 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-zinc-700 shadow-sm">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-zinc-800">Chính hãng 100%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5 text-zinc-600" />
                <span>Đổi trả trong 30 ngày</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-zinc-600" />
                <span>Miễn phí giao hàng đơn từ 2.000.000đ</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Buy Box (6 cols on lg) */}
          <div className="lg:col-span-6 flex flex-col justify-start">
            {/* Brand & Gender Header */}
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {product.brand && (
                <Link
                  to={`/shop?brand=${product.brand.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-zinc-700 hover:text-zinc-950 hover:underline transition"
                >
                  {product.brand.name}
                  <span className="font-normal text-zinc-400">&gt;</span>
                </Link>
              )}
              {product.gender && (
                <Link
                  to={`/shop?gender=${product.gender}`}
                  className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-zinc-700 transition hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
                >
                  Giày {formatGenderVi(product.gender)}
                </Link>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Rating & Sold Bar */}
            <div className="mt-2.5 flex items-center gap-2 text-xs sm:text-sm text-zinc-600">
              {reviewStats && reviewStats.totalReviews > 0 ? (
                <>
                  <span className="font-bold text-zinc-900">
                    {reviewStats.averageRating.toFixed(1)}
                  </span>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= Math.round(reviewStats.averageRating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-zinc-200"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-zinc-500 hover:text-zinc-900 hover:underline"
                  >
                    ({reviewStats.totalReviews} đánh giá)
                  </button>
                </>
              ) : (
                <>
                  <div className="flex text-zinc-300">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 text-zinc-300" />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-zinc-500 hover:text-zinc-900 hover:underline text-xs"
                  >
                    Chưa có đánh giá
                  </button>
                </>
              )}

              <span className="text-zinc-300">|</span>
              <span className="text-zinc-600 font-medium">
                {totalSold > 0 ? `Đã bán ${totalSold}` : "Sản phẩm mới"}
              </span>
            </div>

            {/* Price Row (matching mockup red font + discount pill) */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-red-600 tracking-tight">
                {formatVND(displayPrice)}
              </span>

              {hasDiscount ? (
                <>
                  <span className="text-sm sm:text-base font-normal text-zinc-400 line-through">
                    {formatVND(displayOriginalPrice)}
                  </span>
                  <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                    -{product.discountPercent}%
                  </span>
                </>
              ) : null}
            </div>

            {/* Out of Stock Notice Banner */}
            {isAllOutOfStock && (
              <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-900">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="font-black uppercase tracking-wider text-red-700">Sản phẩm hiện đang tạm hết hàng</p>
                  <p className="mt-1 text-zinc-600 leading-relaxed">
                    Tất cả các kích cỡ và phiên bản của sản phẩm này đã được bán hết trong kho. Bạn có thể lưu vào Danh sách Yêu thích để nhận thông báo ngay khi có hàng trở lại.
                  </p>
                </div>
              </div>
            )}

            {/* Low Stock Urgency Notice */}
            {isLowTotalStock && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 border border-amber-200">
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <span>⚡ Chỉ còn {totalStock} sản phẩm cuối cùng trong kho!</span>
              </div>
            )}

            {/* Short Description Intro */}
            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-zinc-600">
              {parsedAttributes?.short_description ? (
                parsedAttributes.short_description
              ) : (
                <>
                  {product.name} là mẫu sneaker {product.brand?.name || "cao cấp"}{" "}
                  {product.gender
                    ? `thiết kế dành riêng cho ${formatGenderVi(product.gender)}`
                    : "phù hợp cho mọi đối tượng"}
                  , phù hợp sử dụng hàng ngày. Sản phẩm có nhiều lựa chọn kích cỡ và được PeakSneaker kiểm tra thông tin trước khi đóng bán.
                </>
              )}
            </p>

            {/* Color Selection */}
            {availableColors.length > 0 && (
              <div className="mt-5">
                <div className="text-xs font-bold text-zinc-800 mb-2">
                  <span>Màu sắc: </span>
                  <span className="font-extrabold text-zinc-950">{selectedColor}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color) => {
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorChange(color)}
                        className={`rounded-md px-4 py-2 text-xs font-bold transition-all ${
                          isSelected
                            ? "border-2 border-zinc-950 bg-white text-zinc-950 shadow-sm"
                            : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Matrix */}
            {availableSizesForColor.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-800">
                    Kích thước (EU)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-950 underline transition"
                  >
                    <Ruler className="h-3 w-3" /> Hướng dẫn chọn size
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {availableSizesForColor.map((size) => {
                    const variant = product.variants.find(
                      (v) => v.color === selectedColor && v.size === size
                    );
                    const outOfStock = !variant || variant.stock <= 0;
                    const isSelected = selectedSize === size && !outOfStock;

                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => !outOfStock && setSelectedSize(size)}
                        disabled={outOfStock}
                        className={`py-2.5 rounded-md text-xs font-bold transition-all ${
                          outOfStock
                            ? "border border-zinc-200 bg-zinc-50 text-zinc-300 cursor-not-allowed line-through"
                            : isSelected
                            ? "bg-zinc-950 text-white shadow-sm"
                            : "border border-zinc-200 bg-white text-zinc-800 hover:border-zinc-950"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Stepper */}
            {!isOutOfStock && (
              <div className="mt-5 flex items-center gap-4">
                <span className="text-xs font-bold text-zinc-800 w-16">Số lượng</span>
                <div className="flex items-center rounded-lg border border-zinc-200 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-30"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center font-mono font-bold text-sm text-zinc-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(currentVariant?.stock || 99, q + 1))}
                    disabled={quantity >= (currentVariant?.stock || 99)}
                    className="flex h-8 w-8 items-center justify-center rounded text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-30"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Primary Action Buttons */}
            {isAllOutOfStock ? (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  disabled={wishlistLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-950 bg-white py-3.5 px-4 text-xs font-extrabold uppercase tracking-wider text-zinc-950 transition duration-150 hover:bg-zinc-50 active:scale-[0.99]"
                >
                  <Heart className={`h-4 w-4 ${wishlisted ? "fill-current text-red-500" : ""}`} />
                  {wishlisted ? "Đã lưu yêu thích" : "Lưu vào Yêu thích"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success("Đã ghi nhận! PeakSneaker sẽ gửi thông báo đến bạn khi có hàng trở lại.");
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-950 py-3.5 px-4 text-xs font-extrabold uppercase tracking-wider text-white transition duration-150 hover:bg-zinc-800 active:scale-[0.99]"
                >
                  <Bell className="h-4 w-4" />
                  Báo khi có hàng
                </button>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addingToCart || isOutOfStock}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 py-3.5 px-4 text-xs font-extrabold uppercase tracking-wider text-white transition duration-150 hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-50"
                >
                  {addingToCart ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" />
                      {isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={addingToCart || isOutOfStock}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 py-3.5 px-4 text-xs font-extrabold uppercase tracking-wider text-white transition duration-150 hover:bg-red-700 active:scale-[0.99] disabled:opacity-50"
                >
                  <Zap className="h-4 w-4 fill-current" />
                  {isOutOfStock ? "Tạm hết hàng" : "Mua ngay"}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Tabbed Product Details Bar (matching mockup tabs) */}
        <section className="mt-14 border-t border-zinc-200 pt-8">
          <div className="border-b border-zinc-200">
            <div className="flex gap-4 sm:gap-8 overflow-x-auto scrollbar-hide">
              <button
                type="button"
                onClick={() => setActiveTab("description")}
                className={`py-3 text-xs sm:text-sm font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                  activeTab === "description"
                    ? "border-zinc-950 text-zinc-950"
                    : "border-transparent text-zinc-400 hover:text-zinc-700"
                }`}
              >
                Mô tả
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("specs")}
                className={`py-3 text-xs sm:text-sm font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                  activeTab === "specs"
                    ? "border-zinc-950 text-zinc-950"
                    : "border-transparent text-zinc-400 hover:text-zinc-700"
                }`}
              >
                Chi tiết sản phẩm
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("care")}
                className={`py-3 text-xs sm:text-sm font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                  activeTab === "care"
                    ? "border-zinc-950 text-zinc-950"
                    : "border-transparent text-zinc-400 hover:text-zinc-700"
                }`}
              >
                Hướng dẫn bảo quản
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("returns")}
                className={`py-3 text-xs sm:text-sm font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                  activeTab === "returns"
                    ? "border-zinc-950 text-zinc-950"
                    : "border-transparent text-zinc-400 hover:text-zinc-700"
                }`}
              >
                Chính sách đổi trả
              </button>
            </div>
          </div>

          <div className="py-6">
            {/* Tab 1: Mô tả (matching mockup paragraph + bullets) */}
            {activeTab === "description" && (
              <div className="max-w-4xl text-sm leading-relaxed text-zinc-700">
                <p className="leading-relaxed">
                  {product.description ||
                    `Lấy cảm hứng từ văn hóa đường phố và phong cách sống hiện đại, đôi ${product.name} sở hữu thiết kế nổi bật với các chi tiết đặc trưng. Chất liệu cao cấp, đế cao su bền bỉ và form dáng cổ điển mang đến sự thoải mái và phong cách cho mọi tín đồ sneaker.`}
                </p>

                <div className="mt-5 space-y-2 text-sm text-zinc-800">
                  {productHighlights.map((hl) => (
                    <div key={hl.label} className="flex items-start gap-2">
                      <span className="font-bold text-zinc-900">• {hl.label}:</span>
                      <span>{hl.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Chi tiết sản phẩm */}
            {activeTab === "specs" && (
              <div className="max-w-3xl">
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                  <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-zinc-100">
                      {product.brand && (
                        <tr>
                          <td className="bg-zinc-50/70 py-3 px-5 font-bold text-zinc-700 w-1/3">
                            Thương hiệu
                          </td>
                          <td className="py-3 px-5 text-zinc-900">{product.brand.name}</td>
                        </tr>
                      )}
                      {product.silhouette && (
                        <tr>
                          <td className="bg-zinc-50/70 py-3 px-5 font-bold text-zinc-700 w-1/3">
                            Dòng sản phẩm
                          </td>
                          <td className="py-3 px-5 text-zinc-900">{product.silhouette.name}</td>
                        </tr>
                      )}
                      {product.gender && (
                        <tr>
                          <td className="bg-zinc-50/70 py-3 px-5 font-bold text-zinc-700 w-1/3">
                            Giới tính
                          </td>
                          <td className="py-3 px-5 text-zinc-900">
                            <Link
                              to={`/shop?gender=${product.gender}`}
                              className="font-medium text-zinc-900 underline underline-offset-4 hover:text-red-600 transition"
                            >
                              {formatGenderVi(product.gender)}
                            </Link>
                          </td>
                        </tr>
                      )}
                      {currentVariant?.sku && (
                        <tr>
                          <td className="bg-zinc-50/70 py-3 px-5 font-bold text-zinc-700 w-1/3">
                            Mã sản phẩm (SKU)
                          </td>
                          <td className="py-3 px-5 font-mono text-zinc-900">{currentVariant.sku}</td>
                        </tr>
                      )}
                      {parsedAttributes &&
                        Object.entries(parsedAttributes)
                          .filter(([key]) => !["care_instructions", "return_policy", "short_description"].includes(key))
                          .map(([key, value]) => (
                            <tr key={key}>
                              <td className="bg-zinc-50/70 py-3 px-5 font-bold text-zinc-700 w-1/3">
                                {ATTRIBUTE_LABELS[key] || key.replace(/_/g, " ")}
                              </td>
                              <td className="py-3 px-5 text-zinc-900">{value}</td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Hướng dẫn bảo quản */}
            {activeTab === "care" && (
              <div className="max-w-3xl text-sm leading-relaxed text-zinc-700 space-y-3">
                <p className="font-bold text-zinc-900">Bảo quản giày sneaker đúng cách:</p>
                {parsedAttributes?.care_instructions ? (
                  <p className="whitespace-pre-line text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    {parsedAttributes.care_instructions}
                  </p>
                ) : (
                  <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 text-xs sm:text-sm">
                    <li>Vệ sinh định kỳ bằng bọt làm sạch chuyên dụng (Jason Markk, Crep Protect).</li>
                    <li>Không giặt máy hoặc ngâm trực tiếp trong nước xà phòng có chất tẩy mạnh.</li>
                    <li>Phơi giày ở nơi khô thoáng, tránh ánh nắng mặt trời trực tiếp hoặc sấy nhiệt độ cao.</li>
                    <li>Sử dụng cây giữ form giày (shoe trees) hoặc giấy báo để giữ dáng chuẩn.</li>
                    <li>Cất trong hộp giày hai lớp khi không sử dụng để tránh ẩm mốc và bụi bẩn.</li>
                  </ul>
                )}
              </div>
            )}

            {/* Tab 4: Chính sách đổi trả */}
            {activeTab === "returns" && (
              <div className="max-w-3xl text-sm leading-relaxed text-zinc-700 space-y-3">
                <p className="font-bold text-zinc-900">Quy định đổi trả trong 30 ngày:</p>
                {parsedAttributes?.return_policy ? (
                  <p className="whitespace-pre-line text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    {parsedAttributes.return_policy}
                  </p>
                ) : (
                  <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 text-xs sm:text-sm">
                    <li>Hỗ trợ đổi size miễn phí trong vòng 30 ngày kể từ ngày nhận hàng thành công.</li>
                    <li>Sản phẩm đổi trả phải còn nguyên tem mác, hóa đơn và hộp giày gốc không móp méo.</li>
                    <li>Được mở hộp đồng kiểm tra cùng nhân viên giao hàng trước khi thanh toán.</li>
                    <li>Miễn phí 100% phí ship 2 chiều nếu phát hiện lỗi từ nhà sản xuất hoặc giao sai mẫu.</li>
                    <li>Hỗ trợ tạo yêu cầu đổi trả online tại trang Chi tiết đơn hàng hoặc Hotline 1900 8888.</li>
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Dedicated Customer Reviews Section (matching mockup layout) */}
        <section className="mt-12 border-t border-zinc-200 pt-10">
          <ReviewList productId={product.id} />
        </section>

        {/* Recommended Sneakers Carousel/Grid */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 border-t border-zinc-200 pt-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Gợi ý dành cho bạn</p>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-950 mt-1">
                  Có thể bạn cũng thích
                </h3>
              </div>
              <Link
                to={`/shop?brand=${product.brand?.slug || ""}`}
                className="text-xs font-bold uppercase tracking-wider text-zinc-800 hover:text-zinc-600 flex items-center gap-1 transition"
              >
                Xem tất cả <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
              {relatedProducts.map((relProduct) => (
                <ProductCard
                  key={relProduct.id}
                  id={relProduct.id.toString()}
                  name={relProduct.name}
                  price={relProduct.price || relProduct.basePrice}
                  basePrice={relProduct.basePrice}
                  discountPercent={relProduct.discountPercent}
                  totalStock={relProduct.totalStock}
                  isNew={relProduct.isNew}
                  isFeatured={relProduct.isFeatured}
                  imageUrl={relProduct.defaultImageUrl}
                  category={relProduct.brand?.name}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Modal 1: Lightbox Fullscreen Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white hover:text-black transition"
            aria-label="Đóng"
          >
            <X className="h-6 w-6" />
          </button>

          {allImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white hover:text-black transition"
                aria-label="Ảnh trước"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white hover:text-black transition"
                aria-label="Ảnh tiếp theo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div className="relative max-h-[85vh] max-w-[85vw] flex items-center justify-center">
            <img
              src={displayImage}
              alt={product.name}
              className="max-h-[80vh] max-w-[80vw] object-contain rounded-xl select-none"
            />
          </div>

          {allImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-xs font-mono font-bold text-white">
              {currentImageIndex + 1} / {allImages.length}
            </div>
          )}
        </div>
      )}

      {/* Modal 2: Size Guide Modal */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black uppercase text-zinc-950">
                  Bảng Quy Đổi Kích Cỡ Giày Chuẩn
                </h3>
                <p className="text-xs text-zinc-500">
                  Cách đo chiều dài bàn chân và chọn size phù hợp
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <img
              src={sizeGuideImg}
              alt="Bảng quy đổi kích cỡ"
              className="w-full rounded-xl object-contain border border-zinc-100"
            />

            <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-xs text-zinc-600 space-y-1">
              <p className="font-bold text-zinc-900">• Lời khuyên chọn size từ PeakSneaker:</p>
              <p>Nếu bạn có bàn chân bè hoặc mu bàn chân dày, nên cân nhắc tăng thêm 0.5 - 1 size để có trải nghiệm êm ái nhất.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}