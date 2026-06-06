import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import BackToTopButton from "./BackToTopButton";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col font-sans bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BackToTopButton />
    </div>
  );
}
