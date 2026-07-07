import { Ticket, Copy, CheckCircle2, Award, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { VoucherService, type VoucherResponse } from "../../services/voucherService";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

export default function VouchersPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: "all", name: "Tất cả ưu đãi" },
    { id: "PERCENTAGE", name: "Giảm theo %" },
    { id: "FIXED", name: "Giảm tiền mặt" },
  ];

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setLoading(true);
        const response: any = await VoucherService.getVouchers(0, 100);
        if (response.data && response.data.items) {
          setVouchers(response.data.items);
        }
      } catch (error) {
        console.error("Lỗi khi tải voucher:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, []);

  const displayedVouchers = activeCategory === "all" 
    ? vouchers 
    : vouchers.filter(v => v.discountType === activeCategory);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
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
              <p className="text-xs text-zinc-500 mt-1">Sử dụng mã để tiết kiệm nhiều hơn</p>
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

        {/* Loading / Empty State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-zinc-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-500">Đang tải danh sách ưu đãi...</p>
          </div>
        ) : displayedVouchers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-zinc-200 border-dashed">
            <Ticket className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500">Không có voucher nào trong danh mục này.</p>
          </div>
        ) : (
          /* Vouchers Grid */
          <div className="grid gap-6 md:grid-cols-2 items-start">
            {displayedVouchers.map((v) => (
              <div key={v.id} className="flex flex-col bg-white rounded-xl shadow-sm border border-zinc-200 hover:shadow-md transition-shadow min-w-0 overflow-hidden">
                
                <div className="flex relative overflow-hidden h-full">
                  {/* Left Ticket Stub */}
                  <div className={`w-1/3 p-3 sm:p-6 flex flex-col items-center justify-center text-center border-r-2 border-dashed border-zinc-200
                    ${v.discountType === 'PERCENTAGE' ? 'bg-red-50 text-red-900' : 'bg-zinc-900 text-white'}
                  `}>
                    <Ticket className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2" />
                    <span className="font-black text-lg sm:text-xl leading-none">
                      {v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : `${(v.discountValue / 1000)}K`}
                    </span>
                  </div>
                  
                  {/* Right Content */}
                  <div className="w-2/3 p-3 sm:p-6 flex flex-col justify-between bg-white z-10">
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-zinc-900 mb-1 leading-tight uppercase">
                        Giảm {v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : formatCurrency(v.discountValue)}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-500 mb-3 sm:mb-4 line-clamp-2">
                        Đơn tối thiểu {formatCurrency(v.minOrderAmount)}
                        {v.maxDiscountAmount > 0 && ` - Giảm tối đa ${formatCurrency(v.maxDiscountAmount)}`}
                      </p>
                    </div>
                    
                    <div className="mt-auto pt-3 sm:pt-4 border-t border-zinc-100 flex flex-col gap-2">
                      <div className="text-[10px] sm:text-xs font-medium text-zinc-400">
                        HSD: {formatDate(v.expireAt)} 
                        {v.usageLimit && <span className="ml-2">({v.usedCount}/{v.usageLimit} đã dùng)</span>}
                      </div>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
