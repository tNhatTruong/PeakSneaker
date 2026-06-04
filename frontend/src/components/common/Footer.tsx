import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-white py-16 border-t border-zinc-800">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Info */}
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-3xl font-extrabold tracking-tighter uppercase mb-4">
              PeakSneaker
            </h2>
            <p className="text-zinc-400 max-w-sm text-sm leading-relaxed">
              Nền tảng thương mại điện tử chuyên cung cấp giày Sneaker chính hãng. Nâng tầm phong cách thời thượng với những bộ sưu tập độc quyền.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-6">Trợ Giúp</h3>
            <ul className="space-y-4">
              <li><Link to="/faq" className="text-sm text-zinc-400 hover:text-white transition-colors">Trạng thái đơn hàng</Link></li>
              <li><Link to="/shipping" className="text-sm text-zinc-400 hover:text-white transition-colors">Giao hàng & Đổi trả</Link></li>
              <li><Link to="/contact" className="text-sm text-zinc-400 hover:text-white transition-colors">Liên hệ</Link></li>
            </ul>
          </div>

          {/* Social / About */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-6">Về Chúng Tôi</h3>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-sm text-zinc-400 hover:text-white transition-colors">Câu chuyện thương hiệu</Link></li>
              <li><Link to="/careers" className="text-sm text-zinc-400 hover:text-white transition-colors">Tuyển dụng</Link></li>
              <li><Link to="/terms" className="text-sm text-zinc-400 hover:text-white transition-colors">Điều khoản dịch vụ</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} PeakSneaker. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6 text-xs text-zinc-500">
            <Link to="/privacy" className="hover:text-white transition-colors">Chính sách bảo mật</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Điều khoản</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
