import { ArrowRight, Heart, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import PageBackButton from "../../components/common/PageBackButton";
import { WishlistService, type WishlistItem } from "../../services/wishlistService";

const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    WishlistService.getWishlist()
      .then((data) => setItems(data || []))
      .catch((error) => {
        if (error.response?.status === 401) {
          toast.error("Vui lòng đăng nhập để xem danh sách yêu thích");
          navigate("/login");
        } else toast.error("Không thể tải danh sách yêu thích");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const removeItem = async (productId: number) => {
    setRemovingId(productId);
    try {
      await WishlistService.removeFromWishlist(productId);
      setItems((current) => current.filter((item) => item.productId !== productId));
      toast.success("Đã bỏ khỏi danh sách yêu thích");
    } catch {
      toast.error("Không thể cập nhật danh sách yêu thích");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) return (
    <div className="grid min-h-[65vh] place-items-center bg-zinc-50">
      <div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /><p className="mt-3 text-sm text-zinc-500">Đang tải danh sách yêu thích...</p></div>
    </div>
  );

  return (
    <main className="min-h-[calc(100dvh-72px)] bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <PageBackButton fallbackTo="/shop" label="Quay lại cửa hàng" />
        <header className="mt-8 border-b border-zinc-200 pb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><h1 className="text-3xl font-black uppercase tracking-[-0.04em] sm:text-4xl">Danh sách yêu thích</h1><p className="mt-2 text-sm text-zinc-500">{items.length} sản phẩm bạn đã lưu để xem lại.</p></div>
            <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide hover:text-red-600">Tiếp tục khám phá <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </header>

        {items.length === 0 ? (
          <section className="mt-10 border border-dashed border-zinc-300 bg-white px-6 py-20 text-center">
            <Heart className="mx-auto h-12 w-12 text-zinc-300" />
            <h2 className="mt-5 text-2xl font-black uppercase">Chưa có sản phẩm được lưu</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">Nhấn biểu tượng trái tim trên ProductCard để xây dựng bộ sưu tập dành riêng cho bạn.</p>
            <Link to="/shop" className="mt-7 inline-flex h-12 items-center gap-2 bg-zinc-950 px-6 text-sm font-black uppercase tracking-wide text-white hover:bg-red-600">Khám phá ngay <ArrowRight className="h-4 w-4" /></Link>
          </section>
        ) : (
          <section className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Sản phẩm yêu thích">
            {items.map((item, index) => (
              <article key={item.id} className="group relative">
                <div className="relative aspect-square overflow-hidden bg-white">
                  <span className="absolute left-3 top-3 z-10 bg-zinc-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">Saved {String(index + 1).padStart(2, "0")}</span>
                  {(item.discountPercent ?? 0) > 0 && (
                    <span className="absolute left-3 top-9 z-10 bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                      -{item.discountPercent}%
                    </span>
                  )}
                  <Link to={`/products/${item.productId}`} className="block h-full w-full">
                    {item.primaryImageUrl ? <img src={item.primaryImageUrl} alt={item.productName} className="h-full w-full object-contain p-5 transition-transform duration-500 group-hover:scale-105" /> : <ShoppingBag className="m-auto h-full w-12 text-zinc-300" />}
                  </Link>
                  <button type="button" onClick={() => removeItem(item.productId)} disabled={removingId === item.productId}
                    className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-red-600 hover:text-white disabled:opacity-50" title="Bỏ khỏi danh sách yêu thích">
                    {removingId === item.productId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                  <Link to={`/products/${item.productId}`} className="absolute inset-x-3 bottom-3 flex h-11 translate-y-0 items-center justify-center gap-2 bg-zinc-950 text-xs font-black uppercase tracking-wide text-white opacity-100 transition duration-300 hover:bg-red-600 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">Xem & chọn kích cỡ <ArrowRight className="h-4 w-4" /></Link>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{item.brandName || "PeakSneaker"}</p>
                  <Link to={`/products/${item.productId}`} className="mt-1 block font-black leading-tight hover:underline">{item.productName}</Link>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-sm font-black text-red-600">
                      {formatPrice(item.price ?? item.basePrice)}
                    </span>
                    {(item.discountPercent ?? 0) > 0 && (
                      <span className="text-xs font-semibold text-zinc-400 line-through">
                        {formatPrice(item.basePrice)}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
