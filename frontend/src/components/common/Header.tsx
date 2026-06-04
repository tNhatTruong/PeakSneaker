import { ShoppingBag, Search, Menu, User } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-zinc-900">
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo */}
          <div className="flex-1 md:flex-none text-center md:text-left">
            <Link to="/" className="text-2xl font-extrabold tracking-tighter text-zinc-900 uppercase">
              PeakSneaker
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex flex-1 justify-center space-x-8">
            <Link to="/" className="text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors uppercase tracking-wide">Trang chủ</Link>
            <Link to="/shop?category=new" className="text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors uppercase tracking-wide">Mới Nhất</Link>
            <Link to="/shop?gender=men" className="text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors uppercase tracking-wide">Nam</Link>
            <Link to="/shop?gender=women" className="text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors uppercase tracking-wide">Nữ</Link>
            <Link to="/shop?category=accessories" className="text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors uppercase tracking-wide">Phụ Kiện</Link>
            <Link to="/brands" className="text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors uppercase tracking-wide">Thương Hiệu</Link>
            <Link to="/shop?sale=true" className="text-sm font-semibold text-red-600 hover:text-red-500 transition-colors uppercase tracking-wide">Khuyến Mãi</Link>
          </nav>

          {/* Right Icons */}
          <div className="flex items-center space-x-4 md:space-x-6">
            <button className="p-2 text-zinc-900 hover:text-zinc-600 transition-colors hidden md:block">
              <Search className="h-5 w-5" />
            </button>
            <Link to="/orders" className="p-2 text-zinc-900 hover:text-zinc-600 transition-colors" title="Lịch sử đơn hàng">
              <User className="h-5 w-5" />
            </Link>
            <Link to="/checkout" className="relative p-2 text-zinc-900 hover:text-zinc-600 transition-colors" title="Thanh toán / Giỏ hàng">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                0
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
