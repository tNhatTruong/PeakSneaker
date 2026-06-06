import { useState } from "react";
import { X, Minus, Plus, ShoppingBag, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import toast from "react-hot-toast";

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { cart, itemCount, loading, updateQuantity, removeItem } = useCart();
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const handleUpdateQuantity = async (itemId: number, newQty: number) => {
    if (newQty < 1) return;
    try {
      await updateQuantity(itemId, newQty);
    } catch (err) {
      toast.error("Không thể cập nhật số lượng.");
    }
  };

  const handleRemove = async (itemId: number) => {
    try {
      await removeItem(itemId);
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng.");
    } catch (err) {
      toast.error("Không thể xóa sản phẩm.");
    } finally {
      setItemToDelete(null);
    }
  };

  const sortedItems = cart?.items ? [...cart.items].sort((a, b) => b.id - a.id) : [];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      )}
      
      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
          <h2 className="text-xl font-bold flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2" /> Giỏ Hàng ({itemCount})
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && !cart ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <ShoppingBag className="w-16 h-16 text-zinc-200" />
              <div>
                <p className="text-lg font-semibold text-zinc-900">Giỏ hàng trống</p>
                <p className="text-sm text-zinc-500 mt-1">Chưa có sản phẩm nào trong giỏ hàng của bạn.</p>
              </div>
              <button onClick={onClose} className="mt-4 px-6 py-2 bg-black text-white text-sm font-semibold rounded hover:bg-zinc-800 transition-colors">
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedItems.map((item) => (
                <div key={item.id} className="relative flex gap-4">
                  {itemToDelete === item.id && (
                    <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center border border-zinc-200 rounded-md">
                      <p className="text-sm font-semibold text-zinc-900 mb-3">Xóa sản phẩm này?</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setItemToDelete(null)}
                          className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors"
                        >
                          Hủy
                        </button>
                        <button 
                          onClick={() => handleRemove(item.id)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="w-24 h-24 bg-zinc-100 rounded-md overflow-hidden flex-shrink-0">
                    <img src={item.productThumbnail || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200"} alt={item.productName} className="w-full h-full object-cover mix-blend-multiply" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-zinc-900 line-clamp-1">{item.productName}</h3>
                        <button 
                          onClick={() => setItemToDelete(item.id)}
                          className="text-zinc-400 hover:text-red-500 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-zinc-500 mt-1">Size {item.size} / {item.color}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-zinc-200 rounded">
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-2 py-1 text-zinc-500 hover:text-black disabled:opacity-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-zinc-500 hover:text-black"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="font-bold">{item.price.toLocaleString('vi-VN')} đ</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart && cart.items.length > 0 && (
          <div className="p-6 border-t border-zinc-100 bg-zinc-50">
            <div className="flex justify-between items-center mb-4 text-zinc-900">
              <span className="font-medium">Tổng cộng</span>
              <span className="text-xl font-bold">{(cart.totalPrice || 0).toLocaleString('vi-VN')} đ</span>
            </div>
            <p className="text-xs text-zinc-500 mb-6">Thuế và phí vận chuyển sẽ được tính lúc thanh toán.</p>
            <Link 
              to="/checkout" 
              onClick={onClose}
              className="block w-full py-4 text-center text-sm font-bold text-white bg-black hover:bg-zinc-800 rounded-md uppercase tracking-widest transition-colors"
            >
              Tiến hành Thanh toán
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
