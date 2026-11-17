import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import logoImg from "../../assets/logo.png";

export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-white border-t border-zinc-900 pt-16 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Cột 1: Thông tin thương hiệu & Địa chỉ (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-block transition-opacity hover:opacity-85">
              <img
                src={logoImg}
                alt="PeakSneaker"
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Hệ thống phân phối giày Sneaker và Phụ kiện chính hãng. Trải nghiệm mua sắm chuẩn mực với thông tin minh bạch và dịch vụ tận tâm.
            </p>

            <div className="space-y-2 pt-1 text-xs text-zinc-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-zinc-300 mt-0.5" />
                <span>Khu phố 6, Phường Linh Trung, TP. Thủ Đức, TP. HCM</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-zinc-300" />
                <a href="tel:1900888666" className="hover:text-white transition-colors">
                  1900 888 666 (08:30 - 21:30)
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-zinc-300" />
                <a href="mailto:support@peaksneaker.vn" className="hover:text-white transition-colors">
                  support@peaksneaker.vn
                </a>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95C18.05 21.45 22 17.19 22 12z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <svg className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43c1.7-1.4 2.14-3.56 2.14-5.42V8.75a8.16 8.16 0 0 0 4.77 1.52V6.82a4.85 4.85 0 0 1-1.18-.13z" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Cột 2: KHÁM PHÁ (2.5 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Khám Phá</h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/shop" className="text-xs text-zinc-400 hover:text-white transition-colors">
                  Tất cả sản phẩm
                </Link>
              </li>
              <li>
                <Link to="/brands" className="text-xs text-zinc-400 hover:text-white transition-colors">
                  Thương hiệu chính hãng
                </Link>
              </li>
              <li>
                <Link to="/vouchers" className="text-xs text-zinc-400 hover:text-white transition-colors">
                  Mã ưu đãi & Voucher
                </Link>
              </li>
              <li>
                <Link to="/shop?onSale=true" className="text-xs text-zinc-400 hover:text-white transition-colors">
                  Sản phẩm đang giảm giá
                </Link>
              </li>
              <li>
                <Link to="/shop?sortBy=totalSold&sortDirection=desc" className="text-xs text-zinc-400 hover:text-white transition-colors">
                  Sản phẩm bán chạy nhất
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: TÀI KHOẢN & ĐƠN HÀNG (2.5 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Hỗ Trợ & Đơn Hàng</h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/orders" className="text-xs text-zinc-400 hover:text-white transition-colors">
                  Tra cứu & Lịch sử đơn hàng
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-xs text-zinc-400 hover:text-white transition-colors">
                  Giỏ hàng của bạn
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="text-xs text-zinc-400 hover:text-white transition-colors">
                  Danh sách yêu thích
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-xs text-zinc-400 hover:text-white transition-colors">
                  Liên hệ & Hỗ trợ khách hàng
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: PHƯƠNG THỨC THANH TOÁN & ĐƠN VỊ VẬN CHUYỂN THỰC TẾ (3 cols) */}
          <div className="lg:col-span-3 space-y-5">
            {/* Phương thức thanh toán thực tế của web */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white mb-2.5">
                Phương Thức Thanh Toán
              </h3>
              <div className="flex flex-wrap items-center gap-2.5">
                {/* VNPay Logo */}
                <div className="h-9 w-24 overflow-hidden rounded shadow-sm border border-zinc-700/60 bg-white transition-transform hover:scale-105">
                  <img
                    src="/payments/vnpay.png"
                    alt="VNPAY"
                    className="h-full w-full object-contain"
                  />
                </div>

                {/* COD Badge */}
                <div className="h-9 w-24 overflow-hidden rounded shadow-sm border border-zinc-700/60 bg-zinc-900 transition-transform hover:scale-105">
                  <img
                    src="/payments/cod.png"
                    alt="COD (Tiền mặt)"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Đơn vị vận chuyển thực tế của web */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white mb-2.5">
                Đối Tác Vận Chuyển
              </h3>
              <div className="flex items-center gap-2.5">
                {/* GHN Logo */}
                <div className="h-9 w-28 overflow-hidden rounded shadow-sm border border-zinc-700/60 bg-white transition-transform hover:scale-105">
                  <img
                    src="/payments/ghn.png"
                    alt="Giao Hàng Nhanh (GHN)"
                    className="h-full w-full object-contain p-0.5"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Gọn gàng, đúng mockup, không trùng nút cuộn */}
        <div className="mt-12 border-t border-zinc-900 pt-8 text-xs text-zinc-500">
          <p>&copy; {new Date().getFullYear()} PeakSneaker. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
