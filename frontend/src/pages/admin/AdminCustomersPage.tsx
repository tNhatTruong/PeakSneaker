import {
  Search,
  Ban,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Download,
  ShoppingBag,
  MapPin,
  Award,
  Send,
  Package,
  Eye,
  ExternalLink,
} from "lucide-react";
import { isAxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  AdminUserService,
  type AdminUserQueryParams,
  type UserResponse,
  type CustomerDetailResponse,
} from "../../services/admin/adminUserService";
import {
  AdminOrderService,
  type OrderResponse,
} from "../../services/admin/adminOrderService";
import {
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
} from "../../utils/adminOrderPresentation";
import AdminOrderDetailPanel from "../../components/admin/orders/AdminOrderDetailPanel";
import toast from "react-hot-toast";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminFilterHeader from "../../components/admin/AdminFilterHeader";
import { AdminDetailEmptyState, AdminDetailPanel } from "../../components/admin/AdminDetailPanel";
import AdminPagination from "../../components/admin/AdminPagination";

const PAGE_SIZE = 10;

const formatVND = (val?: number) => {
  return (val || 0).toLocaleString("vi-VN") + " đ";
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!isAxiosError<{ message?: string }>(error)) return fallback;
  return error.response?.data?.message || fallback;
};

export default function AdminCustomersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailTab, setDetailTab] = useState<"overview" | "orders" | "addresses">("overview");

  // Order Detail Modal states
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<OrderResponse | null>(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);
  const [dispatchingShipment, setDispatchingShipment] = useState(false);

  // Filter states
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("Tất cả");
  const [selectedTier, setSelectedTier] = useState<string>("Tất cả");
  const [selectedLocation, setSelectedLocation] = useState<string>("Tất cả");
  const [selectedPurchased, setSelectedPurchased] = useState<string>("Tất cả");

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Status confirm modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<UserResponse | null>(null);

  // Open & view order detail
  const handleOpenOrderDetail = async (orderId: number) => {
    setIsOrderDetailModalOpen(true);
    setLoadingOrderDetail(true);
    try {
      const fullOrder = await AdminOrderService.getOrderById(orderId);
      setSelectedOrderForDetail(fullOrder);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể tải chi tiết đơn hàng."));
      setIsOrderDetailModalOpen(false);
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  const handleCloseOrderDetail = () => {
    setIsOrderDetailModalOpen(false);
    setSelectedOrderForDetail(null);
  };

  // Keyboard shortcut for closing order detail modal
  useEffect(() => {
    if (!isOrderDetailModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseOrderDetail();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOrderDetailModalOpen]);

  const handleDispatchShipment = async () => {
    if (!selectedOrderForDetail) return;
    setDispatchingShipment(true);
    try {
      await AdminOrderService.dispatchShipment(selectedOrderForDetail.id);
      const updatedOrder = await AdminOrderService.getOrderById(selectedOrderForDetail.id);
      setSelectedOrderForDetail(updatedOrder);
      toast.success("Tạo vận đơn GHN thành công.");
      if (selectedCustomerId) {
        void fetchCustomerDetail(selectedCustomerId);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể tạo vận đơn GHN."));
    } finally {
      setDispatchingShipment(false);
    }
  };

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: AdminUserQueryParams = {
        page,
        size: PAGE_SIZE,
        role: "USER" // Strictly customers only
      };

      if (debouncedQuery.trim()) params.query = debouncedQuery.trim();
      if (selectedStatus === "Hoạt động") params.isActive = true;
      else if (selectedStatus === "Bị khóa") params.isActive = false;

      const res = await AdminUserService.getUsers(params);
      if (res && res.items) {
        let filtered = res.items;
        // Filter by tier client-side if selected
        if (selectedTier !== "Tất cả") {
          filtered = filtered.filter(u => u.customerTier === selectedTier);
        }
        // Filter by purchased if selected
        if (selectedPurchased === "Đã mua hàng") {
          filtered = filtered.filter(u => (u.orderCount || 0) > 0);
        } else if (selectedPurchased === "Chưa mua") {
          filtered = filtered.filter(u => (u.orderCount || 0) === 0);
        }
        setUsers(filtered);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);

        // Auto select first customer if none selected
        if (filtered.length > 0 && selectedCustomerId === null) {
          setSelectedCustomerId(filtered[0].id);
        }
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Không thể tải danh sách khách hàng."));
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, page, selectedCustomerId, selectedPurchased, selectedStatus, selectedTier]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  // Fetch detailed customer info when selected
  const fetchCustomerDetail = useCallback(async (customerId: number) => {
    setLoadingDetail(true);
    try {
      const detail = await AdminUserService.getCustomerDetail(customerId);
      setCustomerDetail(detail);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể tải chi tiết khách hàng."));
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerDetail(null);
      return;
    }
    void fetchCustomerDetail(selectedCustomerId);
  }, [selectedCustomerId, fetchCustomerDetail]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("Tất cả");
    setSelectedTier("Tất cả");
    setSelectedLocation("Tất cả");
    setSelectedPurchased("Tất cả");
    setPage(0);
    toast.success("Đã đặt lại bộ lọc.");
  };

  const handleToggleStatus = async () => {
    if (!targetUser) return;
    const toastId = toast.loading("Đang cập nhật trạng thái...");
    try {
      await AdminUserService.updateUserStatus(targetUser.id, !targetUser.isActive);
      toast.success(targetUser.isActive ? "Đã khóa tài khoản khách hàng." : "Đã mở khóa tài khoản.", { id: toastId });
      setIsConfirmModalOpen(false);
      setTargetUser(null);
      fetchUsers();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Cập nhật thất bại."), { id: toastId });
    }
  };

  const handleExportCSV = () => {
    if (users.length === 0) {
      toast.error("Không có dữ liệu khách hàng để xuất.");
      return;
    }
    const headers = ["ID", "Họ tên", "Email", "Số điện thoại", "Số đơn", "Tổng chi tiêu", "Hạng", "Trạng thái"];
    const rows = users.map(u => [
      u.id,
      `"${u.fullName || u.email}"`,
      `"${u.email}"`,
      `"${u.phone || ''}"`,
      u.orderCount || 0,
      u.totalSpent || 0,
      u.customerTier || 'REGULAR',
      u.isActive ? "Hoạt động" : "Bị khóa"
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PeakSneaker_KhachHang_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất danh sách khách hàng thành công!");
  };

  const activeFilterCount = (selectedStatus !== "Tất cả" ? 1 : 0) +
    (selectedTier !== "Tất cả" ? 1 : 0) +
    (selectedLocation !== "Tất cả" ? 1 : 0) +
    (selectedPurchased !== "Tất cả" ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Header chuẩn không KPI */}
      <AdminPageHeader
        title="Khách hàng"
        description="Quản lý hồ sơ người tiêu dùng, lịch sử đặt hàng và theo dõi hành vi mua sắm."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => void fetchUsers()}
              disabled={loading}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500"
            >
              <Download className="h-4 w-4" /> Xuất báo cáo
            </button>
          </div>
        }
      />

      {/* Bộ lọc thông minh */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <AdminFilterHeader
          isOpen={isFilterExpanded}
          onToggle={() => setIsFilterExpanded(!isFilterExpanded)}
          activeCount={activeFilterCount}
          onReset={handleClearFilters}
        />

        {isFilterExpanded && (
          <div className="border-t border-slate-100 p-4 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên khách hàng, email hoặc số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Trạng thái</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => { setSelectedStatus(e.target.value); setPage(0); }}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Tất cả">Tất cả trạng thái</option>
                  <option value="Hoạt động">Đang hoạt động</option>
                  <option value="Bị khóa">Đang bị khóa</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nhóm khách hàng</label>
                <select
                  value={selectedTier}
                  onChange={(e) => { setSelectedTier(e.target.value); setPage(0); }}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Tất cả">Tất cả nhóm</option>
                  <option value="VIP">Khách hàng VIP</option>
                  <option value="LOYAL">Khách thân thiết</option>
                  <option value="REGULAR">Khách tiêu chuẩn</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lịch sử mua</label>
                <select
                  value={selectedPurchased}
                  onChange={(e) => { setSelectedPurchased(e.target.value); setPage(0); }}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Tất cả">Tất cả lịch sử</option>
                  <option value="Đã mua hàng">Đã phát sinh đơn</option>
                  <option value="Chưa mua">Chưa có đơn hàng</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Khu vực</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => { setSelectedLocation(e.target.value); setPage(0); }}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Tất cả">Tất cả khu vực</option>
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Cần Thơ">Cần Thơ</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Bảng danh sách khách hàng (Cột trái) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700">
              Danh sách khách hàng ({totalElements})
            </p>
            <span className="text-[11px] text-slate-400 font-medium">Nhấn vào dòng để xem chi tiết</span>
          </div>

          <div className="overflow-x-auto min-h-[350px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3">Khách hàng</th>
                  <th className="py-3 px-3 hidden sm:table-cell">Số điện thoại</th>
                  <th className="py-3 px-3 text-center">Đơn hàng</th>
                  <th className="py-3 px-3 text-right">Tổng chi tiêu</th>
                  <th className="py-3 px-3 text-center">Trạng thái</th>
                  <th className="py-3 px-3 w-12 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Đang tải dữ liệu khách hàng...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      Không tìm thấy khách hàng nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  users.map((user, idx) => {
                    const isSelected = selectedCustomerId === user.id;
                    const initial = user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();
                    return (
                      <tr
                        key={user.id}
                        onClick={() => setSelectedCustomerId(user.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-50/70 font-medium" : "hover:bg-slate-50/80"
                        }`}
                      >
                        <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {page * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex shrink-0 items-center justify-center font-bold text-xs shadow-sm">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 truncate">
                                  {user.fullName || "Khách vãng lai"}
                                </span>
                                {user.customerTier === "VIP" && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-700">
                                    VIP
                                  </span>
                                )}
                                {user.customerTier === "LOYAL" && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-700">
                                    Thân thiết
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 hidden sm:table-cell text-slate-600 font-mono text-[11px]">
                          {user.phone || <span className="text-slate-300 italic">Chưa có</span>}
                        </td>
                        <td
                          className="py-3 px-3 text-center font-bold text-slate-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomerId(user.id);
                            setDetailTab("orders");
                          }}
                          title="Nhấn để xem danh sách đơn hàng của khách này"
                        >
                          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-700 transition cursor-pointer">
                            {user.orderCount || 0}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatVND(user.totalSpent)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {user.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Bị khóa
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setTargetUser(user);
                              setIsConfirmModalOpen(true);
                            }}
                            className={`p-1.5 rounded-lg border text-xs transition ${
                              user.isActive
                                ? "border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200"
                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                          >
                            {user.isActive ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-slate-100 bg-white">
            <AdminPagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={PAGE_SIZE}
              visibleCount={users.length}
              itemLabel="khách hàng"
              onPageChange={setPage}
            />
          </div>
        </div>

        {/* Panel Chi tiết Khách hàng (Cột phải) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-4">
          <AdminDetailPanel ariaLabel="Chi tiết khách hàng">
            {loadingDetail ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                Đang nạp hồ sơ khách hàng...
              </div>
            ) : !customerDetail ? (
              <AdminDetailEmptyState
                icon={<ShoppingBag className="w-8 h-8 text-blue-600" />}
                title="Chọn một khách hàng"
                description="Nhấn vào khách hàng trong danh sách bên trái để xem hồ sơ, địa chỉ và lịch sử đơn hàng."
              />
            ) : (
              <div className="p-4 space-y-4">
                {/* Header Profile Card */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-slate-950 text-white flex shrink-0 items-center justify-center font-bold text-base shadow-sm">
                    {customerDetail.fullName ? customerDetail.fullName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{customerDetail.fullName}</h4>
                      {customerDetail.customerTier === "VIP" && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-700">
                          VIP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{customerDetail.email}</p>
                    <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                      SĐT: {customerDetail.phone || "Chưa cập nhật"}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {customerDetail.location}
                    </p>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailTab("orders")}
                    className={`inline-flex items-center justify-center gap-1.5 h-8 rounded-lg px-3 text-xs font-bold shadow-sm transition ${
                      detailTab === "orders"
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Xem đơn ({customerDetail.orderCount})
                  </button>
                  <button
                    onClick={() => toast.success(`Đã gửi voucher ưu đãi tới email ${customerDetail.email}!`)}
                    className="inline-flex items-center justify-center gap-1.5 h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Send className="w-3.5 h-3.5 text-blue-600" /> Gửi ưu đãi
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                  <button
                    onClick={() => setDetailTab("overview")}
                    className={`py-2 px-3 text-xs font-bold border-b-2 transition ${
                      detailTab === "overview"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Tổng quan
                  </button>
                  <button
                    onClick={() => setDetailTab("orders")}
                    className={`py-2 px-3 text-xs font-bold border-b-2 transition ${
                      detailTab === "orders"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Đơn hàng ({customerDetail.recentOrders?.length || 0})
                  </button>
                  <button
                    onClick={() => setDetailTab("addresses")}
                    className={`py-2 px-3 text-xs font-bold border-b-2 transition ${
                      detailTab === "addresses"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Địa chỉ ({customerDetail.addresses?.length || 0})
                  </button>
                </div>

                {/* Tab content */}
                {detailTab === "overview" && (
                  <div className="space-y-3">
                    {/* Thống kê nhanh */}
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Thống kê mua sắm</h5>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[11px] text-slate-400">Đơn hàng</p>
                          <p className="text-base font-extrabold text-slate-900 mt-0.5">{customerDetail.orderCount}</p>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[11px] text-slate-400">Tổng chi tiêu</p>
                          <p className="text-base font-extrabold text-blue-600 mt-0.5">{formatVND(customerDetail.totalSpent)}</p>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[11px] text-slate-400">Đánh giá trung bình</p>
                          <p className="text-base font-extrabold text-amber-500 mt-0.5">{customerDetail.averageRating} ⭐</p>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[11px] text-slate-400">Yêu thích</p>
                          <p className="text-base font-extrabold text-rose-500 mt-0.5">{customerDetail.wishlistCount} SP</p>
                        </div>
                      </div>
                    </div>

                    {/* VIP Reward suggestion card */}
                    {customerDetail.totalSpent >= 20000000 ? (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-purple-900">
                          <Award className="w-4 h-4 text-purple-600" />
                          Đặc quyền Khách hàng VIP
                        </div>
                        <p className="text-[11px] text-purple-700">
                          Khách hàng này đã chi tiêu hơn 20.000.000 đ, đủ điều kiện nhận voucher VIP giảm 15% cho đơn tiếp theo.
                        </p>
                        <button
                          onClick={() => toast.success("Đã kích hoạt ưu đãi VIP cho khách hàng!")}
                          className="mt-1 h-7 px-3 rounded-lg bg-purple-700 text-white font-bold text-[11px] hover:bg-purple-800 transition"
                        >
                          Cấp ưu đãi VIP
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600">
                        <p className="font-semibold text-slate-800">Tiến độ nâng hạng VIP:</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Cần chi tiêu thêm {formatVND(Math.max(0, 20000000 - customerDetail.totalSpent))} để thăng hạng VIP.
                        </p>
                      </div>
                    )}

                    {/* Thông tin tài khoản */}
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Thông tin tài khoản</h5>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-400">Ngày tham gia:</span>
                          <span className="font-medium text-slate-700">
                            {new Date(customerDetail.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-400">Trạng thái:</span>
                          <span className="font-bold text-emerald-600">
                            {customerDetail.isActive ? "Đang hoạt động" : "Bị khóa"}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-400">Xác thực email:</span>
                          <span className="font-medium text-slate-700">
                            {customerDetail.isVerified ? "Đã xác thực OTP" : "Chưa xác thực"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Orders */}
                {detailTab === "orders" && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Đơn đã mua ({customerDetail.recentOrders?.length || 0})
                      </span>
                      <Link
                        to={`/admin/orders?query=${encodeURIComponent(customerDetail.email)}`}
                        className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                        title="Mở toàn bộ đơn hàng trong workspace Quản lý Đơn hàng"
                      >
                        Quản lý ở trang Đơn <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    {customerDetail.recentOrders?.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs">Khách hàng chưa có đơn hàng nào.</p>
                      </div>
                    ) : (
                      customerDetail.recentOrders.map((ord) => {
                        const statusMeta = ORDER_STATUS_META[ord.status as keyof typeof ORDER_STATUS_META] || {
                          label: ord.status,
                          badgeClassName: "border-slate-200 bg-slate-50 text-slate-700",
                        };
                        const paymentMeta = PAYMENT_STATUS_META[ord.paymentStatus as keyof typeof PAYMENT_STATUS_META] || {
                          label: ord.paymentStatus || "Chưa xác định",
                          badgeClassName: "border-slate-200 bg-slate-50 text-slate-600",
                        };

                        return (
                          <div
                            key={ord.id}
                            onClick={() => void handleOpenOrderDetail(ord.id)}
                            className="group relative p-3 rounded-xl border border-slate-200/90 bg-white hover:border-blue-500 hover:shadow-md hover:bg-blue-50/20 transition-all cursor-pointer space-y-2"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                void handleOpenOrderDetail(ord.id);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono font-bold text-blue-600 group-hover:text-blue-700 flex items-center gap-1.5 text-xs">
                                <Package className="w-3.5 h-3.5 text-blue-500" />
                                {ord.orderCode}
                              </span>
                              <span className="font-extrabold text-slate-900 text-xs">
                                {formatVND(ord.finalAmount)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-1.5 text-[11px] text-slate-500">
                              <span>{new Date(ord.createdAt).toLocaleDateString("vi-VN")}</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.badgeClassName}`}>
                                  {statusMeta.label}
                                </span>
                              </div>
                            </div>

                            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">
                                {ord.paymentMethod} • <span className={paymentMeta.badgeClassName.includes("emerald") ? "text-emerald-600 font-semibold" : "text-slate-500"}>{paymentMeta.label}</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/admin/orders?orderId=${ord.id}`);
                                  }}
                                  title="Mở đơn trong Quản lý Đơn hàng"
                                  className="text-slate-400 hover:text-blue-600 transition p-1 hover:bg-slate-100 rounded"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                                <span className="inline-flex items-center gap-1 font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                                  <Eye className="w-3 h-3" /> Xem chi tiết →
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Tab Addresses */}
                {detailTab === "addresses" && (
                  <div className="space-y-2">
                    {customerDetail.addresses?.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">Chưa có sổ địa chỉ nào được lưu.</p>
                    ) : (
                      customerDetail.addresses.map((addr) => (
                        <div key={addr.id} className="p-2.5 rounded-xl border border-slate-200/80 bg-white text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{addr.recipientName}</span>
                            {addr.isDefault && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 font-mono text-[11px]">{addr.phone}</p>
                          <p className="text-slate-600 text-[11px]">
                            {addr.streetDetail}, {addr.wardName}, {addr.districtName}, {addr.provinceName}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </AdminDetailPanel>
        </div>
      </div>

      {/* Confirmation Modal for Ban/Unban */}
      {isConfirmModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {targetUser.isActive ? "Khóa tài khoản khách hàng?" : "Mở khóa tài khoản khách hàng?"}
            </h3>
            <p className="text-xs text-slate-500">
              Bạn có chắc chắn muốn {targetUser.isActive ? "tạm khóa" : "kích hoạt lại"} tài khoản của{" "}
              <strong>{targetUser.fullName || targetUser.email}</strong> không?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleToggleStatus}
                className={`h-9 px-4 rounded-xl text-xs font-bold text-white transition ${
                  targetUser.isActive ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem chi tiết Đơn hàng của Khách */}
      {isOrderDetailModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
            onMouseDown={(e) => {
              if (e.currentTarget === e.target) handleCloseOrderDetail();
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Chi tiết đơn hàng"
          >
            <div className="w-full max-w-2xl h-[85vh] max-h-[850px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
              <AdminOrderDetailPanel
                order={selectedOrderForDetail}
                loading={loadingOrderDetail}
                onClose={handleCloseOrderDetail}
                onManage={() => {
                  if (selectedOrderForDetail) {
                    navigate(`/admin/orders?orderId=${selectedOrderForDetail.id}`);
                  }
                }}
                onDispatchShipment={handleDispatchShipment}
                dispatchingShipment={dispatchingShipment}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
