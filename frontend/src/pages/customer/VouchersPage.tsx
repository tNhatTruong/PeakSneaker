import { Ticket, Copy, CheckCircle2, Award, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function VouchersPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedVoucher, setExpandedVoucher] = useState<string | null>(null);

  const categories = [
    { id: "all", name: "Tất cả ưu đãi" },
    { id: "for_you", name: "Dành cho bạn" },
    { id: "sale", name: "Đang giảm giá" },
    { id: "shipping", name: "Phí vận chuyển" },
  ];

  const allVouchers = [
    { code: "NEWBIE500", title: "Giảm 500K cho thành viên mới", desc: "Áp dụng cho đơn hàng đầu tiên trên 2.000.000đ", exp: "30-06-2026", type: "system", category: "for_you" },
    { code: "PEAKSUMMER", title: "Flash Sale Hè 20%", desc: "Giảm tối đa 1.000.000đ cho tất cả giày Nike", exp: "15-06-2026", type: "event", category: "sale" },
    { code: "FREESHIP", title: "Miễn phí vận chuyển", desc: "Tối đa 50K cho đơn hàng bất kỳ", exp: "31-12-2026", type: "shipping", category: "shipping" },
    { 
      code: "JORDAN10", 
      title: "Giảm 10% dòng Jordan", 
      desc: "Áp dụng cho tất cả các phiên bản Air Jordan", 
      exp: "31-07-2026", 
      type: "system", 
      category: "sale",
      products: [
        { name: "Air Jordan 1 Retro", price: "5,490,000đ", img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=150" },
        { name: "Air Jordan 4 OG", price: "6,200,000đ", img: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=150" },
        { name: "Air Jordan 3 SE", price: "4,990,000đ", img: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=150" },
        { name: "Air Jordan 1 Low", price: "3,200,000đ", img: "https://images.unsplash.com/photo-1552346154-21d32810baa3?w=150" },
        { name: "Air Jordan 5 Retro", price: "6,500,000đ", img: "https://images.unsplash.com/photo-1550399105-c4db5fb85c18?w=150" }
      ]
    },
    { code: "BIRTHDAY", title: "Quà tặng Sinh nhật 30%", desc: "Dành riêng cho khách hàng có sinh nhật trong tháng", exp: "Cuối tháng", type: "event", category: "for_you" },
    { code: "VIPPEAK", title: "Đặc quyền VIP giảm 1Tr", desc: "Áp dụng cho đơn hàng từ 5.000.000đ dành cho hạng VIP", exp: "Không thời hạn", type: "system", category: "for_you" },
  ];

  const vouchers = activeCategory === "all" ? allVouchers : allVouchers.filter(v => v.category === activeCategory);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-zinc-50 min-h-screen pb-16">
      {/* Hero Banner */}
      <div className="bg-black text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4">Voucher Khuyến Mãi</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">Khám phá các ưu đãi độc quyền dành riêng cho bạn tại PeakSneaker.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Membership & Save Voucher Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 md:p-8 mb-12 -mt-16 relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 flex-shrink-0">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">Hạng thành viên</p>
              <h3 className="text-xl font-black text-zinc-900 uppercase">Khách hàng Vàng</h3>
              <p className="text-xs text-zinc-500 mt-1">Còn 2,500 điểm nữa để lên hạng VIP</p>
            </div>
          </div>
          
          <div className="w-full md:w-1/2">
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="text" 
                placeholder="Nhập mã khuyến mãi để lưu ví..." 
                className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white text-sm uppercase"
              />
              <button className="px-6 py-3 bg-black text-white font-bold text-sm uppercase rounded-lg hover:bg-zinc-800 transition-colors flex items-center">
                Lưu Mã <ArrowRight className="w-4 h-4 ml-2 hidden sm:block" />
              </button>
            </form>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto pb-4 mb-8 space-x-2 md:justify-center scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                activeCategory === cat.id 
                  ? 'bg-black text-white' 
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:border-black hover:text-black'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Vouchers Grid */}
        <div className="grid gap-6 md:grid-cols-2 items-start">
          {vouchers.map((v, i) => (
            <div key={i} className="flex flex-col bg-white rounded-xl shadow-sm border border-zinc-200 hover:shadow-md transition-shadow min-w-0 overflow-hidden">
              
              <div className="flex relative overflow-hidden h-full">
                {/* Left Ticket Stub */}
                <div className={`w-1/3 p-3 sm:p-6 flex flex-col items-center justify-center text-center border-r-2 border-dashed border-zinc-200
                  ${v.type === 'shipping' ? 'bg-blue-50 text-blue-900' : v.type === 'event' ? 'bg-red-50 text-red-900' : 'bg-zinc-900 text-white'}
                `}>
                  <Ticket className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2" />
                  <span className="font-black text-lg sm:text-xl leading-none">{v.type === 'shipping' ? 'FREE' : v.type === 'event' ? '20%' : '500K'}</span>
                </div>
                
                {/* Right Content */}
                <div className="w-2/3 p-3 sm:p-6 flex flex-col justify-between bg-white z-10">
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-zinc-900 mb-1 leading-tight">{v.title}</h3>
                    <p className="text-xs sm:text-sm text-zinc-500 mb-3 sm:mb-4 line-clamp-2">{v.desc}</p>
                  </div>
                  
                  <div className="mt-auto pt-3 sm:pt-4 border-t border-zinc-100 flex flex-col gap-2">
                    <div className="text-[10px] sm:text-xs font-medium text-zinc-400">HSD: {v.exp}</div>
                    <button 
                      onClick={() => handleCopy(v.code)}
                      className={`w-full flex items-center justify-center px-3 py-2 text-[10px] sm:text-xs font-bold uppercase rounded-md transition-colors ${copied === v.code ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'}`}
                    >
                      {copied === v.code ? <><CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 flex-shrink-0" /> Đã chép</> : <><Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 flex-shrink-0" /> Mã: {v.code}</>}
                    </button>
                  </div>
                </div>

                {/* Ticket Cutouts */}
                <div className="absolute -top-3 left-1/3 -translate-x-1/2 w-6 h-6 bg-zinc-50 rounded-full z-20 pointer-events-none"></div>
                <div className="absolute -bottom-3 left-1/3 -translate-x-1/2 w-6 h-6 bg-zinc-50 rounded-full z-20 pointer-events-none"></div>
              </div>

              {/* Applicable Products Section */}
              {v.products && (
                <div className="border-t border-zinc-100 bg-zinc-50 rounded-b-xl">
                  <button 
                    onClick={() => setExpandedVoucher(expandedVoucher === v.code ? null : v.code)}
                    className="w-full py-3 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors rounded-b-xl"
                  >
                    {expandedVoucher === v.code ? 'Thu gọn sản phẩm' : 'Sản phẩm áp dụng'}
                    {expandedVoucher === v.code ? <ChevronUp className="w-4 h-4 ml-1"/> : <ChevronDown className="w-4 h-4 ml-1"/>}
                  </button>
                  
                  {expandedVoucher === v.code && (
                    <div className="p-3 sm:p-4 flex gap-2 sm:gap-3 overflow-x-auto snap-x scrollbar-hide border-t border-zinc-200 bg-white rounded-b-xl w-full">
                      {v.products.map((p, idx) => (
                        <div key={idx} className="flex-none w-[100px] sm:w-[120px] snap-center bg-white border border-zinc-200 rounded-lg p-2 text-center group cursor-pointer hover:border-black transition-colors">
                          <div className="aspect-square bg-zinc-100 rounded-md mb-2 overflow-hidden">
                            <img src={p.img} alt={p.name} className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform" />
                          </div>
                          <h4 className="text-[9px] sm:text-[10px] font-bold text-zinc-900 truncate">{p.name}</h4>
                          <p className="text-[9px] sm:text-[10px] text-zinc-500 font-medium">{p.price}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
