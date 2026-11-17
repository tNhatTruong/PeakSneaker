import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/admin/AdminLayout";
import Layout from "./components/common/Layout";
import ScrollToTop from "./components/common/ScrollToTop";

const HomePage = lazy(() => import("./pages/customer/HomePage"));
const ShopPage = lazy(() => import("./pages/customer/ShopPage"));
const CheckoutPage = lazy(() => import("./pages/customer/CheckoutPage"));
const OrderHistoryPage = lazy(() => import("./pages/customer/OrderHistoryPage"));
const OrderDetailPage = lazy(() => import("./pages/customer/OrderDetailPage"));
const OrderReturnPage = lazy(() => import("./pages/customer/OrderReturnPage"));
const BrandsPage = lazy(() => import("./pages/customer/BrandsPage"));
const LoginPage = lazy(() => import("./pages/customer/LoginPage"));
const RegisterPage = lazy(() => import("./pages/customer/RegisterPage"));
const OtpVerifyPage = lazy(() => import("./pages/customer/OtpVerifyPage"));
const ForgotPasswordPage = lazy(() => import("./pages/customer/ForgotPasswordPage"));
const ProfilePage = lazy(() => import("./pages/customer/ProfilePage"));
const ProductDetailPage = lazy(() => import("./pages/customer/ProductDetailPage"));
const VouchersPage = lazy(() => import("./pages/customer/VouchersPage"));
const WishlistPage = lazy(() => import("./pages/customer/WishlistPage"));
const CartPage = lazy(() => import("./pages/customer/CartPage"));
const ContactPage = lazy(() => import("./pages/customer/ContactPage"));
const VnpayReturnPage = lazy(() =>
  import("./pages/customer/VnpayReturnPage").then((module) => ({ default: module.VnpayReturnPage })),
);
const OrderSuccessPage = lazy(() =>
  import("./pages/customer/OrderSuccessPage").then((module) => ({ default: module.OrderSuccessPage })),
);

const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminReturnsPage = lazy(() => import("./pages/admin/AdminReturnsPage"));
const AdminCustomersPage = lazy(() => import("./pages/admin/AdminCustomersPage"));
const AdminBrandsPage = lazy(() => import("./pages/admin/AdminBrandsPage"));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminInventoryPage = lazy(() => import("./pages/admin/AdminInventoryPage"));
const AdminBatchesPage = lazy(() => import("./pages/admin/AdminBatchesPage"));
const AdminAuditLogsPage = lazy(() => import("./pages/admin/AdminAuditLogsPage"));
const AdminForecastPage = lazy(() => import("./pages/admin/AdminForecastPage"));
const AdminPromotionsPage = lazy(() => import("./pages/admin/AdminPromotionsPage"));
const AdminCategoriesPage = lazy(() => import("./pages/admin/AdminCategoriesPage"));
const AdminStaffPage = lazy(() => import("./pages/admin/AdminStaffPage"));

const PageFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500" role="status">
    Đang tải nội dung...
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="shop" element={<ShopPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="orders" element={<OrderHistoryPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="orders/:id/return" element={<OrderReturnPage />} />
            <Route path="brands" element={<BrandsPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="verify-otp" element={<OtpVerifyPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="vouchers" element={<VouchersPage />} />
            <Route path="vnpay-return" element={<VnpayReturnPage />} />
            <Route path="order-success" element={<OrderSuccessPage />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="returns" element={<AdminReturnsPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="staff" element={<AdminStaffPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="brands" element={<AdminBrandsPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="inventory" element={<AdminInventoryPage />} />
            <Route path="batches" element={<AdminBatchesPage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="forecast" element={<AdminForecastPage />} />
            <Route path="vouchers" element={<AdminPromotionsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
