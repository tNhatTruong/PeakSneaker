import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const cartItems = [
    { id: 1, name: "Air Jordan 1 Retro", price: "5,490,000", size: "42", color: "Black", qty: 1, image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=200" },
    { id: 2, name: "Nike Air Force 1", price: "2,990,000", size: "40", color: "White", qty: 2, image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=200" },
  ];

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
            <ShoppingBag className="w-5 h-5 mr-2" /> Giỏ Hàng (3)
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cartItems.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="w-24 h-24 bg-zinc-100 rounded-md overflow-hidden flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-zinc-900">{item.name}</h3>
                    <button className="text-zinc-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                  <p className="text-sm text-zinc-500 mt-1">Size {item.size} / {item.color}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border border-zinc-200 rounded">
                    <button className="px-2 py-1 text-zinc-500 hover:text-black"><Minus className="w-3 h-3" /></button>
                    <span className="px-2 text-sm font-medium">{item.qty}</span>
                    <button className="px-2 py-1 text-zinc-500 hover:text-black"><Plus className="w-3 h-3" /></button>
                  </div>
                  <p className="font-bold">{item.price} ₫</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-100 bg-zinc-50">
          <div className="flex justify-between items-center mb-4 text-zinc-900">
            <span className="font-medium">Tổng cộng</span>
            <span className="text-xl font-bold">11,470,000 ₫</span>
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
      </div>
    </>
  )
}
