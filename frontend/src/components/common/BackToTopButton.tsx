import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

// Các trang không hiển thị nút BackToTop
const EXCLUDED_PATHS = ["/checkout", "/profile", "/login", "/register", "/forgot-password"];

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const { pathname } = useLocation();

  // Kiểm tra xem trang hiện tại có nằm trong danh sách loại trừ không
  const isExcluded = EXCLUDED_PATHS.some((path) => pathname.startsWith(path));

  useEffect(() => {
    // Hàm xử lý sự kiện cuộn
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Chỉ thêm event listener nếu không phải trang bị loại trừ
    if (!isExcluded) {
      window.addEventListener("scroll", handleScroll);
      // Gọi thử 1 lần lúc mount để set state ban đầu
      handleScroll();
    } else {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isExcluded, pathname]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (isExcluded) return null;

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-all duration-300 hover:bg-zinc-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
      }`}
      aria-label="Back to top"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  );
}
