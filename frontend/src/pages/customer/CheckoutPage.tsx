import { useState } from "react";
import { CreditCard, Banknote, MapPin, Package, ShieldCheck } from "lucide-react";

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState("vnpay");

  // Mock Cart Items
  const cartItems = [
    { id: "1", name: "Jordan 1 Retro High OG", size: "42", color: "Đỏ/Đen", price: 5490000, quantity: 1, imageUrl: "https://images.unsplash.com/photo-1605340537586-0a5a228fdd64?auto=format&fit=crop&q=80&w=150" },
    { id: "2", name: "Nike Air Force 1 '07", size: "41", color: "Trắng", price: 2990000, quantity: 1, imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=150" },
  ];

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingFee = 50000;
  const total = subtotal + shippingFee;

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="bg-zinc-50 min-h-screen py-10">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-zinc-900 mb-8">
          Thanh Toán
        </h1>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left Column: Form & Payment */}
          <div className="flex-1 space-y-8">
            
            {/* Shipping Details */}
            <div className="bg-white p-6 border border-zinc-200">
              <h2 className="text-xl font-bold uppercase tracking-wider text-zinc-900 mb-6 flex items-center">
                <MapPin className="mr-2 h-5 w-5" /> Thông tin giao hàng
              </h2>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Họ & Tên</label>
                    <input type="text" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 focus:ring-0 outline-none transition-colors" placeholder="Nguyễn Văn A" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Số điện thoại</label>
                    <input type="text" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 focus:ring-0 outline-none transition-colors" placeholder="0909 123 456" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Địa chỉ Email</label>
                  <input type="email" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 focus:ring-0 outline-none transition-colors" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Địa chỉ chi tiết</label>
                  <input type="text" className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 focus:ring-0 outline-none transition-colors" placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Ghi chú (Tùy chọn)</label>
                  <textarea rows={3} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 focus:ring-0 outline-none transition-colors" placeholder="Ghi chú thêm cho người giao hàng..."></textarea>
                </div>
              </form>
            </div>

            {/* Payment Method */}
            <div className="bg-white p-6 border border-zinc-200">
              <h2 className="text-xl font-bold uppercase tracking-wider text-zinc-900 mb-6 flex items-center">
                <CreditCard className="mr-2 h-5 w-5" /> Phương thức thanh toán
              </h2>
              <div className="space-y-4">
                
                {/* VNPAY Option */}
                <label className={`block cursor-pointer border ${paymentMethod === 'vnpay' ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200'} p-4 transition-all relative overflow-hidden group`}>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      name="payment" 
                      value="vnpay" 
                      checked={paymentMethod === 'vnpay'} 
                      onChange={() => setPaymentMethod('vnpay')}
                      className="form-radio h-5 w-5 text-zinc-900 border-zinc-300 focus:ring-zinc-900"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-900">Thanh toán trực tuyến (VNPAY)</span>
                        {/* Fake VNPAY Logo Badge */}
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm tracking-wider">VNPAY</span>
                      </div>
                      <p className="text-sm text-zinc-500 mt-1">Chuyển hướng đến cổng thanh toán an toàn VNPAY. Hỗ trợ thẻ ATM, Visa, MasterCard và QR Code.</p>
                    </div>
                  </div>
                  {paymentMethod === 'vnpay' && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                  )}
                </label>

                {/* COD Option */}
                <label className={`block cursor-pointer border ${paymentMethod === 'cod' ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200'} p-4 transition-all relative overflow-hidden`}>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      name="payment" 
                      value="cod" 
                      checked={paymentMethod === 'cod'} 
                      onChange={() => setPaymentMethod('cod')}
                      className="form-radio h-5 w-5 text-zinc-900 border-zinc-300 focus:ring-zinc-900"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-900">Thanh toán khi nhận hàng (COD)</span>
                        <Banknote className="h-5 w-5 text-zinc-400" />
                      </div>
                      <p className="text-sm text-zinc-500 mt-1">Thanh toán bằng tiền mặt trực tiếp khi người giao hàng đưa sản phẩm tới tay bạn.</p>
                    </div>
                  </div>
                </label>

              </div>
            </div>

          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white p-6 border border-zinc-200 sticky top-24">
              <h2 className="text-xl font-bold uppercase tracking-wider text-zinc-900 mb-6 flex items-center">
                <Package className="mr-2 h-5 w-5" /> Tóm tắt đơn hàng
              </h2>
              
              {/* Items List */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-zinc-100 flex-shrink-0">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-zinc-900 line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">Size: {item.size} | Màu: {item.color}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs font-semibold text-zinc-500">x{item.quantity}</span>
                        <span className="text-sm font-bold text-zinc-900">{formatPrice(item.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <hr className="border-zinc-200 my-6" />

              {/* Coupon Form */}
              <div className="flex gap-2 mb-6">
                <input type="text" placeholder="Mã giảm giá..." className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-900 focus:ring-0 outline-none text-sm" />
                <button className="bg-zinc-900 text-white px-4 py-2 text-sm font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors">Áp dụng</button>
              </div>

              {/* Totals */}
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between text-zinc-600">
                  <span>Tạm tính</span>
                  <span className="font-medium text-zinc-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Phí vận chuyển</span>
                  <span className="font-medium text-zinc-900">{formatPrice(shippingFee)}</span>
                </div>
                {/* Giả sử có giảm giá thì hiển thị ở đây */}
              </div>

              <hr className="border-zinc-900 my-4 border-t-2" />
              
              <div className="flex justify-between items-end mb-8">
                <span className="font-bold uppercase tracking-wider text-zinc-900">Tổng cộng</span>
                <span className="text-2xl font-black text-zinc-900">{formatPrice(total)}</span>
              </div>

              {/* Submit Button */}
              <button className="w-full bg-zinc-900 text-white py-4 font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors flex justify-center items-center">
                {paymentMethod === 'vnpay' ? 'Thanh toán qua VNPAY' : 'Hoàn tất đặt hàng'}
              </button>

              <div className="mt-4 flex items-center justify-center text-zinc-400 text-xs gap-1">
                <ShieldCheck className="h-4 w-4" /> <span>Thanh toán bảo mật và được mã hóa</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
