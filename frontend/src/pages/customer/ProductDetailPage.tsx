import { Star, Truck, ShieldCheck, Ruler } from "lucide-react";
import { useState } from "react";

export default function ProductDetailPage() {
  const [selectedSize, setSelectedSize] = useState("42");
  const [selectedColor, setSelectedColor] = useState("Trắng/Đen");

  const sizes = ["39", "40", "41", "42", "43", "44"];
  const colors = ["Trắng/Đen", "Xanh/Trắng", "Đỏ/Đen"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
        
        {/* Product Gallery */}
        <div className="flex flex-col-reverse lg:flex-row gap-4">
          {/* Thumbnails */}
          <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible">
            {[1,2,3,4].map(i => (
              <button key={i} className="w-20 h-20 flex-shrink-0 bg-zinc-100 rounded-md border-2 border-transparent hover:border-black focus:border-black overflow-hidden transition-all">
                <img src={`https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=150`} alt="" className="w-full h-full object-cover mix-blend-multiply" />
              </button>
            ))}
          </div>
          {/* Main Image */}
          <div className="flex-1 bg-zinc-50 rounded-xl aspect-square lg:aspect-auto lg:h-[600px] flex items-center justify-center p-8 overflow-hidden relative">
             <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
               Best Seller
             </div>
             <img src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800" alt="Main product" className="w-full max-h-full object-contain mix-blend-multiply hover:scale-105 transition-transform duration-500" />
          </div>
        </div>

        {/* Product Info */}
        <div className="mt-10 lg:mt-0">
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight uppercase">Air Jordan 1 Retro High OG</h1>
          
          <div className="mt-4 flex items-center gap-4">
            <p className="text-2xl font-bold text-zinc-900">5,490,000 ₫</p>
            <div className="flex items-center text-sm">
              <div className="flex text-yellow-400"><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /></div>
              <span className="ml-2 text-zinc-500 underline cursor-pointer hover:text-black">124 Đánh giá</span>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <p className="text-zinc-600 leading-relaxed">
              Air Jordan 1 Retro High OG mang đậm dấu ấn lịch sử với thiết kế cổ điển không bao giờ lỗi thời. Chất liệu da cao cấp cùng đệm Air độc quyền mang lại sự thoải mái tuyệt đối cho đôi chân của bạn.
            </p>

            {/* Colors */}
            <div>
              <h3 className="text-sm font-medium text-zinc-900 mb-3">Màu sắc: <span className="font-bold">{selectedColor}</span></h3>
              <div className="flex items-center space-x-3">
                {colors.map(color => (
                  <button 
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-full border-2 ${selectedColor === color ? 'border-black ring-2 ring-black ring-offset-2' : 'border-zinc-200'}
                      ${color === 'Trắng/Đen' ? 'bg-zinc-800' : color === 'Xanh/Trắng' ? 'bg-blue-600' : 'bg-red-600'}
                    `}
                  />
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-zinc-900">Kích thước (EU)</h3>
                <button className="text-sm text-zinc-500 flex items-center hover:text-black underline"><Ruler className="w-4 h-4 mr-1"/> Hướng dẫn chọn size</button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {sizes.map(size => (
                  <button 
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 text-sm font-medium border rounded-md transition-all
                      ${selectedSize === size ? 'border-black bg-black text-white shadow-md' : 'border-zinc-200 bg-white text-zinc-900 hover:border-black'}
                    `}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6 border-t border-zinc-100">
              <button className="flex-1 bg-black text-white py-4 rounded-md font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors shadow-lg hover:shadow-xl">
                Thêm Vào Giỏ
              </button>
              <button className="flex-1 bg-white border-2 border-black text-black py-4 rounded-md font-bold uppercase tracking-widest hover:bg-zinc-50 transition-colors">
                Mua Ngay
              </button>
            </div>

            {/* Policies */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              <div className="flex items-start">
                <Truck className="w-5 h-5 text-zinc-400 mr-3 flex-shrink-0" />
                <p className="text-sm text-zinc-600">Miễn phí giao hàng cho đơn từ 2.000.000 ₫</p>
              </div>
              <div className="flex items-start">
                <ShieldCheck className="w-5 h-5 text-zinc-400 mr-3 flex-shrink-0" />
                <p className="text-sm text-zinc-600">Đổi trả miễn phí trong vòng 30 ngày</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
