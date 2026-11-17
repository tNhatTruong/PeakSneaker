import { ArrowRight, Loader2, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import PageBackButton from "../../components/common/PageBackButton";
import { CartService, type CartItemResponse, type CartResponse } from "../../services/cartService";

const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export default function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      setCart(await CartService.getCart());
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error("Vui lòng đăng nhập để xem giỏ hàng");
        navigate("/login");
      } else toast.error("Không thể tải giỏ hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchCart(); }, []);

  const updateQuantity = async (item: CartItemResponse, quantity: number) => {
    if (quantity < 1) return;
    setUpdatingId(item.id);
    try {
      await CartService.updateCartItem(item.id, quantity);
      await fetchCart();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể cập nhật số lượng");
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (itemId: number) => {
    setUpdatingId(itemId);
    try {
      await CartService.removeCartItem(itemId);
      await fetchCart();
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch {
      toast.error("Không thể xóa sản phẩm");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return (
    <div className="grid min-h-[65vh] place-items-center bg-zinc-50">
      <div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin" /><p className="mt-3 text-sm text-zinc-500">Đang tải giỏ hàng...</p></div>
    </div>
  );

  const items = cart?.items || [];
  const subtotal = cart?.totalPrice || 0;

  return (
    <main className="min-h-[calc(100dvh-72px)] bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <PageBackButton fallbackTo="/shop" label="Tiếp tục mua sắm" />
        <header className="mt-8 flex flex-col gap-4 border-b border-zinc-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-[-0.04em] sm:text-4xl">Giỏ hàng</h1>
            <p className="mt-2 text-sm text-zinc-500">{cart?.totalQuantity || 0} sản phẩm đang chờ bạn hoàn tất đơn hàng.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-600"><ShieldCheck className="h-5 w-5" /> Thanh toán an toàn</div>
        </header>

        {items.length === 0 ? (
          <section className="mt-10 border border-dashed border-zinc-300 bg-white px-6 py-20 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-zinc-300" />
            <h2 className="mt-5 text-2xl font-black uppercase">Giỏ hàng đang trống</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">Khám phá các sản phẩm mới và chọn đúng màu sắc, kích cỡ dành cho bạn.</p>
            <Link to="/shop" className="mt-7 inline-flex h-12 items-center gap-2 bg-zinc-950 px-6 text-sm font-black uppercase tracking-wide text-white hover:bg-red-600">Khám phá sản phẩm <ArrowRight className="h-4 w-4" /></Link>
          </section>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="space-y-4" aria-label="Sản phẩm trong giỏ hàng">
              {items.map((item) => (
                <article key={item.id} className="grid gap-5 border border-zinc-200 bg-white p-4 sm:grid-cols-[120px_minmax(0,1fr)] sm:p-5 md:grid-cols-[140px_minmax(0,1fr)_auto]">
                  <Link to={`/products/${item.productId}`} className="aspect-square overflow-hidden bg-zinc-100">
                    {item.productThumbnail ? <img src={item.productThumbnail} alt={item.productName} className="h-full w-full object-contain transition-transform hover:scale-105" /> : <ShoppingBag className="m-auto h-full w-10 text-zinc-300" />}
                  </Link>
                  <div className="flex min-w-0 flex-col justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">SKU: {item.sku || `#${item.variantId}`}</p>
                      <Link to={`/products/${item.productId}`} className="mt-1 block text-lg font-black leading-tight hover:underline">{item.productName}</Link>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-zinc-600">
                        <span className="border border-zinc-200 px-3 py-1.5">Màu: {item.color}</span><span className="border border-zinc-200 px-3 py-1.5">Size: {item.size}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-10 items-center border border-zinc-300">
                        <button type="button" onClick={() => updateQuantity(item, item.quantity - 1)} disabled={item.quantity <= 1 || updatingId === item.id} className="grid h-full w-10 place-items-center hover:bg-zinc-100 disabled:opacity-30"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="grid h-full min-w-10 place-items-center border-x border-zinc-300 text-sm font-bold">{updatingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item, item.quantity + 1)} disabled={updatingId === item.id} className="grid h-full w-10 place-items-center hover:bg-zinc-100 disabled:opacity-30"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <button type="button" onClick={() => removeItem(item.id)} disabled={updatingId === item.id} className="inline-flex h-10 items-center gap-2 px-3 text-xs font-bold text-zinc-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /> Xóa</button>
                    </div>
                  </div>
                  <div className="text-left sm:col-start-2 md:col-auto md:text-right"><p className="text-lg font-black">{formatPrice(item.subtotal || item.totalPrice || item.price * item.quantity)}</p><p className="mt-1 text-xs text-zinc-400">{formatPrice(item.price)} / sản phẩm</p></div>
                </article>
              ))}
            </section>

            <aside className="h-fit border border-zinc-200 bg-white p-6 lg:sticky lg:top-24">
              <h2 className="text-2xl font-black uppercase">Tóm tắt đơn hàng</h2>
              <div className="mt-6 space-y-4 border-y border-zinc-200 py-5 text-sm">
                <div className="flex justify-between text-zinc-600"><span>Tạm tính ({cart?.totalQuantity} sản phẩm)</span><strong className="text-zinc-950">{formatPrice(subtotal)}</strong></div>
                <div className="flex justify-between text-zinc-600"><span>Phí vận chuyển</span><span>Tính ở bước tiếp theo</span></div>
              </div>
              <div className="flex items-end justify-between py-5"><span className="font-black uppercase">Tạm tính</span><span className="text-2xl font-black">{formatPrice(subtotal)}</span></div>
              <button type="button" onClick={() => navigate("/checkout")} className="flex h-14 w-full items-center justify-center gap-2 bg-zinc-950 px-5 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-600">Tiến hành thanh toán <ArrowRight className="h-4 w-4" /></button>
              <div className="mt-6 grid gap-3 border-t border-zinc-200 pt-5 text-xs text-zinc-500">
                <p className="flex items-center gap-2"><PackageCheck className="h-4 w-4 text-zinc-900" /> Kiểm tra tồn kho trước khi xác nhận</p>
                <p className="flex items-center gap-2"><Truck className="h-4 w-4 text-zinc-900" /> Theo dõi vận chuyển sau khi đặt hàng</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
