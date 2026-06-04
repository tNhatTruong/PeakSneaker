import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/common/Layout";
import HomePage from "./pages/customer/HomePage";

import ShopPage from "./pages/customer/ShopPage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import OrderHistoryPage from "./pages/customer/OrderHistoryPage";
import BrandsPage from "./pages/customer/BrandsPage";

// Admin Imports
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminCustomersPage from "./pages/admin/AdminCustomersPage";
import AdminBrandsPage from "./pages/admin/AdminBrandsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Các trang dành cho Khách hàng */}
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="product/:id" element={<div className="p-20 text-center text-2xl font-bold">Trang Chi Tiết Sản Phẩm (Sẽ làm tiếp)</div>} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrderHistoryPage />} />
          <Route path="brands" element={<BrandsPage />} />
        </Route>

        {/* Các trang dành cho Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="brands" element={<AdminBrandsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
