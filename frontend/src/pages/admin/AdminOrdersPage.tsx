import { useState, useEffect } from "react";
import { Search, Filter, Eye, MoreHorizontal, X, Check, Truck, Clock, XCircle, Calendar, RefreshCw } from "lucide-react";
import { AdminOrderService, type OrderResponse } from "../../services/admin/adminOrderService";
import toast from "react-hot-toast";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailedOrder, setDetailedOrder] = useState<OrderResponse | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("Tất cả");
  
  // Default specificMonth to current month (YYYY-MM) as per instructions
  const getInitialMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };
  const [specificMonth, setSpecificMonth] = useState<string>(getInitialMonth());
  const [specificDay, setSpecificDay] = useState<string>("");

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch orders when filters change
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        size: pageSize,
      };

      if (debouncedQuery.trim()) {
        params.query = debouncedQuery.trim();
      }

      if (selectedStatus !== "Tất cả") {
        let statusEnum: any = "";
        switch (selectedStatus) {
          case "Chờ xác nhận":
            statusEnum = "PENDING";
            break;
          case "Đang giao":
            statusEnum = "SHIPPING";
            break;
          case "Hoàn thành":
            statusEnum = "COMPLETED";
            break;
          case "Đã hủy":
            statusEnum = "CANCELLED";
            break;
        }
        if (statusEnum) {
          params.status = statusEnum;
        }
      }

      if (specificDay) {
        params.specificDay = specificDay;
      } else if (specificMonth) {
        params.specificMonth = specificMonth;
      }

      const res = await AdminOrderService.getOrders(params);
      if (res && res.items) {
        setOrders(res.items);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [debouncedQuery, selectedStatus, specificDay, specificMonth, page]);

  // Handle specific date/month changes
  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpecificDay(e.target.value);
    if (e.target.value) {
      setSpecificMonth("");
    }
    setPage(0);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpecificMonth(e.target.value);
    if (e.target.value) {
      setSpecificDay("");
    }
    setPage(0);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("Tất cả");
    setSpecificDay("");
    setSpecificMonth(getInitialMonth());
    setPage(0);
    toast.success("Đã cài lại bộ lọc");
  };

  // Fetch single order details for modal
  const handleOpenDetailModal = async (order: OrderResponse) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    setDetailedOrder(null);
    try {
      const details = await AdminOrderService.getOrderById(order.id);
      setDetailedOrder(details);
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể tải chi tiết đơn hàng.");
    } finally {
      setDetailLoading(false);
    }
  };

  // Update order status
  const handleUpdateStatus = async (status: string) => {
    if (!selectedOrder) return;
    const toastId = toast.loading("Đang cập nhật trạng thái...");
    try {
      await AdminOrderService.updateOrderStatus(selectedOrder.id, status);
      toast.success("Cập nhật trạng thái thành công!", { id: toastId });
      setIsStatusModalOpen(false);
      fetchOrders();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Cập nhật thất bại.", { id: toastId });
    }
  };

  // Helpers
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Chờ xác nhận";
      case "SHIPPING":
        return "Đang giao";
      case "COMPLETED":
        return "Hoàn thành";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const translatePaymentStatus = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "PENDING":
        return "Chưa thanh toán";
      case "PAID":
        return "Đã thanh toán";
      case "FAILED":
        return "Thanh toán lỗi";
      case "REFUNDED":
        return "Đã hoàn tiền";
      default:
        return paymentStatus;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "SHIPPING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      case "PENDING":
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const statusOptions = ["Tất cả", "Chờ xác nhận", "Đang giao", "Hoàn thành", "Đã hủy"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-950 uppercase tracking-tight">Quản lý Đơn hàng</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Tổng cộng: <span className="font-semibold text-zinc-900">{totalElements}</span> đơn hàng được tìm thấy
          </p>
        </div>
        <button
          onClick={handleClearFilters}
          className="flex items-center justify-center px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 shadow-sm hover:border-zinc-300 transition-all rounded"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-2" /> Cài lại bộ lọc
        </button>
      </div>

      {/* Filter and Date selection panel */}
      <div className="bg-white rounded border border-zinc-200 shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Tìm theo mã đơn, người nhận, SĐT..."
              className="w-full pl-10 pr-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded focus:bg-white focus:border-zinc-900 outline-none transition-all placeholder-zinc-400"
            />
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center">
              <Calendar className="w-3 h-3 mr-1" /> Theo Ngày Cụ Thể
            </label>
            <input
              type="date"
              value={specificDay}
              onChange={handleDayChange}
              className="w-full px-3 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-700"
            />
          </div>

          {/* Month Picker */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center">
              <Calendar className="w-3 h-3 mr-1" /> Theo Tháng Cụ Thể
            </label>
            <input
              type="month"
              value={specificMonth}
              onChange={handleMonthChange}
              className="w-full px-3 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded focus:bg-white focus:border-zinc-900 outline-none transition-all text-zinc-700"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="pt-2 border-t border-zinc-100">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => {
                  setSelectedStatus(status);
                  setPage(0);
                }}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded border transition-all ${
                  selectedStatus === status
                    ? "bg-zinc-950 text-white border-zinc-950 shadow-sm"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:text-zinc-900"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table list */}
      <div className="bg-white rounded border border-zinc-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-zinc-950"></div>
            <p className="text-sm font-semibold text-zinc-500">Đang tải danh sách đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center space-y-3">
            <XCircle className="h-12 w-12 text-zinc-300" />
            <h3 className="text-base font-bold text-zinc-800">Không tìm thấy đơn hàng nào</h3>
            <p className="text-sm text-zinc-500 max-w-sm">
              Không có đơn hàng nào khớp với điều kiện lọc hiện tại. Hãy thử thay đổi bộ lọc hoặc cài lại mặc định.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-zinc-50 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 font-bold">Mã Đơn</th>
                  <th className="px-6 py-4 font-bold">Khách Hàng</th>
                  <th className="px-6 py-4 font-bold">Ngày Đặt</th>
                  <th className="px-6 py-4 font-bold">Tổng Tiền</th>
                  <th className="px-6 py-4 font-bold">Trạng Thái</th>
                  <th className="px-6 py-4 font-bold">Thanh Toán</th>
                  <th className="px-6 py-4 font-bold text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-zinc-950">#{order.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-900">{order.shippingName}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{order.shippingPhone}</div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600">
                      {new Date(order.createdAt).toLocaleString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 font-bold text-zinc-900">{formatPrice(order.finalAmount)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-extrabold uppercase tracking-wider border ${getStatusBadgeClass(
                          order.status
                        )}`}
                      >
                        {translateStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-semibold ${
                          order.paymentStatus === "PAID"
                            ? "text-green-600 font-bold"
                            : order.paymentStatus === "REFUNDED"
                            ? "text-blue-600"
                            : "text-zinc-500"
                        }`}
                      >
                        {translatePaymentStatus(order.paymentStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleOpenDetailModal(order)}
                          className="p-2 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded transition-all"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsStatusModalOpen(true);
                          }}
                          className="p-2 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded transition-all"
                          title="Cập nhật trạng thái"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Trang <span className="font-semibold text-zinc-900">{page + 1}</span> / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((prev) => prev - 1)}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 rounded text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white transition-all"
              >
                Trước
              </button>
              <button
                disabled={page === totalPages - 1}
                onClick={() => setPage((prev) => prev + 1)}
                className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 rounded text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white transition-all"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Chi Tiết Đơn Hàng */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all border border-zinc-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200">
              <div>
                <h3 className="text-lg font-black text-zinc-950 uppercase tracking-tight">Chi tiết đơn hàng #{selectedOrder.id}</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Đặt lúc: {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 p-1.5 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {detailLoading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-950"></div>
                  <p className="text-xs font-medium text-zinc-400">Đang lấy chi tiết đơn hàng...</p>
                </div>
              ) : detailedOrder ? (
                <>
                  {/* Delivery and Customer Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-50 p-4 border border-zinc-200 rounded">
                    <div className="text-sm space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">Thông tin giao hàng</h4>
                      <p className="font-bold text-zinc-900">{detailedOrder.shippingName}</p>
                      <p className="text-zinc-600">SĐT: <span className="font-medium text-zinc-950">{detailedOrder.shippingPhone}</span></p>
                      <p className="text-zinc-600">
                        Địa chỉ:{" "}
                        <span className="font-medium text-zinc-950">
                          {detailedOrder.shippingStreet}, {detailedOrder.shippingWard}, {detailedOrder.shippingDistrict},{" "}
                          {detailedOrder.shippingProvince}
                        </span>
                      </p>
                    </div>
                    <div className="text-sm space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">Thông tin thanh toán</h4>
                      <p className="text-zinc-600">
                        Trạng thái đơn hàng:{" "}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getStatusBadgeClass(detailedOrder.status)}`}>
                          {translateStatus(detailedOrder.status)}
                        </span>
                      </p>
                      <p className="text-zinc-600">
                        Thanh toán:{" "}
                        <span className="font-bold text-zinc-950">{translatePaymentStatus(detailedOrder.paymentStatus)}</span>
                      </p>
                      {detailedOrder.note && (
                        <p className="text-zinc-500 italic mt-2">
                          Ghi chú: "{detailedOrder.note}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Products Table list */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3">Sản phẩm đã đặt</h4>
                    <div className="border border-zinc-200 rounded overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 text-[11px] font-bold text-zinc-500 border-b border-zinc-200 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Sản phẩm</th>
                            <th className="px-4 py-3 text-right">Đơn giá</th>
                            <th className="px-4 py-3 text-center">SL</th>
                            <th className="px-4 py-3 text-right">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {detailedOrder.items && detailedOrder.items.length > 0 ? (
                            detailedOrder.items.map((item) => (
                              <tr key={item.id} className="hover:bg-zinc-50/50">
                                <td className="px-4 py-3.5">
                                  <div className="font-bold text-zinc-900">{item.productName}</div>
                                  {item.variantName && (
                                    <div className="text-xs text-zinc-400 mt-0.5">Biến thể: {item.variantName}</div>
                                  )}
                                  {item.sku && (
                                    <div className="text-[10px] font-mono text-zinc-400">SKU: {item.sku}</div>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 text-right font-medium text-zinc-600">
                                  {formatPrice(item.unitPrice)}
                                </td>
                                <td className="px-4 py-3.5 text-center font-bold text-zinc-700">{item.quantity}</td>
                                <td className="px-4 py-3.5 text-right font-bold text-zinc-900">
                                  {formatPrice(item.subtotal)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="text-center py-6 text-zinc-400">
                                Không có sản phẩm nào
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Calculations breakdown */}
                  <div className="flex justify-end text-sm">
                    <div className="w-80 space-y-2.5 bg-zinc-50 p-4 border border-zinc-200 rounded">
                      <div className="flex justify-between text-zinc-600">
                        <span>Tạm tính:</span>
                        <span className="font-semibold text-zinc-900">{formatPrice(detailedOrder.subtotalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-600">
                        <span>Phí vận chuyển:</span>
                        <span className="font-semibold text-zinc-900">{formatPrice(detailedOrder.shippingFee)}</span>
                      </div>
                      {detailedOrder.discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Giảm giá (Voucher):</span>
                          <span>-{formatPrice(detailedOrder.discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-base text-zinc-950 pt-2.5 border-t border-zinc-200">
                        <span>Tổng thanh toán:</span>
                        <span className="text-lg font-black text-zinc-950">{formatPrice(detailedOrder.finalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-zinc-400">Không tìm thấy dữ liệu chi tiết.</div>
              )}
            </div>

            <div className="p-5 border-t border-zinc-200 flex justify-end bg-zinc-50">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-zinc-950 hover:bg-zinc-800 rounded transition-all shadow-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cập Nhật Trạng Trạng Thái */}
      {isStatusModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-zinc-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
              <h3 className="font-black text-zinc-950 uppercase tracking-tight text-sm">Cập nhật đơn #{selectedOrder.id}</h3>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-zinc-400 mb-2">Chọn trạng thái tiếp theo cho đơn hàng này:</p>
              
              <button
                onClick={() => handleUpdateStatus("PENDING")}
                className="w-full flex items-center p-3 rounded border border-zinc-200 hover:border-yellow-500 hover:bg-yellow-50/50 transition-all text-left group"
              >
                <Clock className="w-5 h-5 text-yellow-500 mr-3.5 group-hover:scale-110 transition-all" />
                <div>
                  <div className="font-bold text-sm text-zinc-800">Chờ xác nhận</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Trạng thái mới nhận đơn, chưa xử lý hàng</div>
                </div>
              </button>

              <button
                onClick={() => handleUpdateStatus("SHIPPING")}
                disabled={selectedOrder.status !== "PENDING"}
                className="w-full flex items-center p-3 rounded border border-zinc-200 hover:border-blue-500 hover:bg-blue-50/50 disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-zinc-200 transition-all text-left group"
                title={selectedOrder.status !== "PENDING" ? "Chỉ đơn hàng đang Chờ xác nhận mới có thể chuyển sang Đang giao" : ""}
              >
                <Truck className="w-5 h-5 text-blue-500 mr-3.5 group-hover:scale-110 transition-all" />
                <div>
                  <div className="font-bold text-sm text-zinc-800">Đang giao hàng</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Chuyển hàng đi và tự động trừ số lượng tồn kho</div>
                </div>
              </button>

              <button
                onClick={() => handleUpdateStatus("COMPLETED")}
                disabled={selectedOrder.status !== "SHIPPING"}
                className="w-full flex items-center p-3 rounded border border-zinc-200 hover:border-green-500 hover:bg-green-50/50 disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-zinc-200 transition-all text-left group"
                title={selectedOrder.status !== "SHIPPING" ? "Chỉ đơn hàng đang Đang giao mới có thể chuyển sang Hoàn thành" : ""}
              >
                <Check className="w-5 h-5 text-green-500 mr-3.5 group-hover:scale-110 transition-all" />
                <div>
                  <div className="font-bold text-sm text-zinc-800">Hoàn thành</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Khách đã nhận hàng và hoàn tất thanh toán đơn</div>
                </div>
              </button>

              <button
                onClick={() => handleUpdateStatus("CANCELLED")}
                disabled={selectedOrder.status !== "PENDING"}
                className="w-full flex items-center p-3 rounded border border-zinc-200 hover:border-red-500 hover:bg-red-50/50 disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-zinc-200 transition-all text-left group"
                title={selectedOrder.status !== "PENDING" ? "Chỉ đơn hàng chưa gửi đi mới có thể hủy" : ""}
              >
                <XCircle className="w-5 h-5 text-red-500 mr-3.5 group-hover:scale-110 transition-all" />
                <div>
                  <div className="font-bold text-sm text-zinc-800">Hủy đơn hàng</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Hủy hẳn đơn hàng này, không tiếp tục giao dịch</div>
                </div>
              </button>
            </div>
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-end">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-600 hover:text-zinc-900 border border-zinc-200 bg-white hover:bg-zinc-50 rounded transition-all"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
