import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/common/Layout";
import HomePage from "./pages/customer/HomePage";

import ShopPage from "./pages/customer/ShopPage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import OrderHistoryPage from "./pages/customer/OrderHistoryPage";
import BrandsPage from "./pages/customer/BrandsPage";

// Hinh's Customer Imports
import LoginPage from "./pages/customer/LoginPage";
import RegisterPage from "./pages/customer/RegisterPage";
import ForgotPasswordPage from "./pages/customer/ForgotPasswordPage";
import ProfilePage from "./pages/customer/ProfilePage";
import ProductDetailPage from "./pages/customer/ProductDetailPage";
import VouchersPage from "./pages/customer/VouchersPage";

// Admin Imports
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminCustomersPage from "./pages/admin/AdminCustomersPage";
import AdminBrandsPage from "./pages/admin/AdminBrandsPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminInventoryPage from "./pages/admin/AdminInventoryPage";
import AdminVouchersPage from "./pages/admin/AdminVouchersPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Các trang dành cho Khách hàng */}
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="product/:id" element={<ProductDetailPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrderHistoryPage />} />
          <Route path="brands" element={<BrandsPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="vouchers" element={<VouchersPage />} />
        </Route>

        {/* Các trang dành cho Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="brands" element={<AdminBrandsPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="inventory" element={<AdminInventoryPage />} />
          <Route path="vouchers" element={<AdminVouchersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
