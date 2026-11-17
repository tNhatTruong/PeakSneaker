import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  ImageIcon,
  Loader2,
  MapPin,
  Minus,
  PhoneCall,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  AdminOrderService,
  type AdminCreateOrderPayload,
  type OrderResponse,
} from "../../../services/admin/adminOrderService";
import {
  AdminInventoryService,
  type InventoryVariantResponse,
} from "../../../services/admin/adminInventoryService";
import {
  AdminUserService,
  type UserResponse,
} from "../../../services/admin/adminUserService";
import {
  calculateFee,
  getDistricts,
  getProvinces,
  getWards,
  type District,
  type Province,
  type Ward,
} from "../../../services/shippingService";
import { formatOrderCurrency } from "../../../utils/adminOrderPresentation";

interface AdminCreateOrderModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (order: OrderResponse) => void;
}

interface SelectedLineItem {
  variant: InventoryVariantResponse;
  quantity: number;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
};

export default function AdminCreateOrderModal({
  open,
  onClose,
  onCreated,
}: AdminCreateOrderModalProps) {
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<UserResponse[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<UserResponse | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingStreet, setShippingStreet] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "VNPAY">("COD");
  const [voucherCode, setVoucherCode] = useState("");
  const [note, setNote] = useState("Khách đặt hàng qua điện thoại / tại quầy");

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number>(0);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number>(0);
  const [selectedWardCode, setSelectedWardCode] = useState<string>("");
  const [shippingFee, setShippingFee] = useState<number>(30000);
  const [calculatingFee, setCalculatingFee] = useState(false);

  const [variantQuery, setVariantQuery] = useState("");
  const [variantResults, setVariantResults] = useState<InventoryVariantResponse[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedLineItem[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open, submitting]);

  useEffect(() => {
    if (!open) return;
    void getProvinces()
      .then((res) => setProvinces(res.data ?? []))
      .catch(() => setProvinces([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      setLoadingVariants(true);
      AdminInventoryService.getVariants({
        search: variantQuery.trim() || undefined,
        page: 0,
        size: 16,
        sortBy: "stockQuantity",
        sortDirection: "desc",
      })
        .then((res) => {
          setVariantResults((res.items ?? []).filter((item) => item.stock > 0 && !item.productInactive));
        })
        .catch(() => setVariantResults([]))
        .finally(() => setLoadingVariants(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [open, variantQuery]);

  useEffect(() => {
    if (!open || !customerQuery.trim()) {
      setCustomerResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setLoadingCustomers(true);
      AdminUserService.getUsers({ query: customerQuery.trim(), page: 0, size: 6 })
        .then((res) => setCustomerResults(res.items ?? []))
        .catch(() => setCustomerResults([]))
        .finally(() => setLoadingCustomers(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [customerQuery, open]);

  const handleProvinceChange = (provinceId: number) => {
    setSelectedProvinceId(provinceId);
    setSelectedDistrictId(0);
    setSelectedWardCode("");
    setDistricts([]);
    setWards([]);
    if (provinceId > 0) {
      void getDistricts(provinceId)
        .then((res) => setDistricts(res.data ?? []))
        .catch(() => setDistricts([]));
    }
  };

  const handleDistrictChange = (districtId: number) => {
    setSelectedDistrictId(districtId);
    setSelectedWardCode("");
    setWards([]);
    if (districtId > 0) {
      void getWards(districtId)
        .then((res) => setWards(res.data ?? []))
        .catch(() => setWards([]));
    }
  };

  const handleWardChange = (wardCode: string) => {
    setSelectedWardCode(wardCode);
    if (selectedDistrictId > 0 && wardCode) {
      setCalculatingFee(true);
      void calculateFee(selectedDistrictId, wardCode)
        .then((res) => {
          if (res.data?.total != null) {
            setShippingFee(res.data.total);
          }
        })
        .catch(() => setShippingFee(30000))
        .finally(() => setCalculatingFee(false));
    }
  };

  const handleSelectCustomer = (customer: UserResponse) => {
    setSelectedCustomer(customer);
    setShippingName(customer.fullName || `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim());
    if (customer.phone) setShippingPhone(customer.phone);
    setCustomerQuery("");
    setCustomerResults([]);
  };

  const handleAddVariant = (variant: InventoryVariantResponse) => {
    setSelectedItems((current) => {
      const existing = current.find((line) => line.variant.id === variant.id);
      if (existing) {
        if (existing.quantity >= variant.stock) {
          toast.error(`Sản phẩm ${variant.sku} chỉ còn ${variant.stock} sản phẩm trong kho.`);
          return current;
        }
        return current.map((line) =>
          line.variant.id === variant.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [...current, { variant, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (variantId: number, nextQty: number) => {
    setSelectedItems((current) =>
      current.map((line) => {
        if (line.variant.id !== variantId) return line;
        const clamped = Math.min(Math.max(1, nextQty), line.variant.stock);
        return { ...line, quantity: clamped };
      }),
    );
  };

  const handleRemoveItem = (variantId: number) => {
    setSelectedItems((current) => current.filter((line) => line.variant.id !== variantId));
  };

  const subtotal = useMemo(
    () => selectedItems.reduce((sum, line) => sum + line.variant.finalPrice * line.quantity, 0),
    [selectedItems],
  );

  const estimatedTotal = subtotal + (selectedItems.length > 0 ? shippingFee : 0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!shippingName.trim() || !shippingPhone.trim()) {
      setFormError("Vui lòng nhập đầy đủ họ tên và số điện thoại người nhận.");
      return;
    }
    const provinceObj = provinces.find((p) => p.ProvinceID === selectedProvinceId);
    const districtObj = districts.find((d) => d.DistrictID === selectedDistrictId);
    const wardObj = wards.find((w) => w.WardCode === selectedWardCode);

    if (!provinceObj || !districtObj || !wardObj || !shippingStreet.trim()) {
      setFormError("Vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện, Phường/Xã và nhập số nhà, tên đường.");
      return;
    }
    if (selectedItems.length === 0) {
      setFormError("Vui lòng chọn ít nhất 1 sản phẩm cho đơn hàng.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: AdminCreateOrderPayload = {
        userId: selectedCustomer?.id ?? null,
        shippingName: shippingName.trim(),
        shippingPhone: shippingPhone.trim(),
        shippingProvince: provinceObj.ProvinceName,
        shippingDistrict: districtObj.DistrictName,
        shippingDistrictId: districtObj.DistrictID,
        shippingWard: wardObj.WardName,
        shippingWardCode: wardObj.WardCode,
        shippingStreet: shippingStreet.trim(),
        paymentMethod,
        voucherCode: voucherCode.trim() || undefined,
        note: note.trim() || undefined,
        items: selectedItems.map((line) => ({
          variantId: line.variant.id,
          quantity: line.quantity,
        })),
      };

      const createdOrder = await AdminOrderService.createOrder(payload);
      toast.success(`Đã tạo đơn hàng ${createdOrder.orderCode} thành công!`);
      onCreated(createdOrder);
      onClose();
    } catch (error) {
      setFormError(getErrorMessage(error, "Không thể tạo đơn hàng. Vui lòng kiểm tra lại thông tin."));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-xs sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-create-order-title"
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white">
              <PhoneCall className="h-5 w-5" />
            </span>
            <div>
              <h2 id="admin-create-order-title" className="text-base font-black text-slate-950">
                Tạo đơn hàng mới
              </h2>
              <p className="text-xs text-slate-500">
                Hỗ trợ tạo đơn nhanh cho khách lớn tuổi hoặc khách gọi điện đặt hàng mà không cần tự thao tác trên web.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-12">
              {/* Cột trái: Thông tin người nhận & Địa chỉ GHN */}
              <div className="space-y-4 lg:col-span-5">
                <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-900">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      1. Thông tin người nhận
                    </h3>
                    {selectedCustomer && (
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(null)}
                        className="text-[11px] font-bold text-red-600 hover:underline"
                      >
                        Bỏ liên kết TK
                      </button>
                    )}
                  </div>

                  {selectedCustomer ? (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                      <p className="font-bold">{selectedCustomer.fullName}</p>
                      <p className="text-[11px] text-blue-700">
                        {selectedCustomer.email} {selectedCustomer.phone ? `· ${selectedCustomer.phone}` : ""}
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        value={customerQuery}
                        onChange={(e) => setCustomerQuery(e.target.value)}
                        placeholder="Tìm khách quen theo SĐT, họ tên hoặc email..."
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs outline-none focus:border-slate-400"
                      />
                      {loadingCustomers && (
                        <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-400" />
                      )}
                      {customerResults.length > 0 && (
                        <div className="absolute left-0 right-0 top-10 z-20 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                          {customerResults.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelectCustomer(c)}
                              className="flex w-full flex-col rounded-lg px-3 py-2 text-left text-xs hover:bg-slate-50"
                            >
                              <span className="font-bold text-slate-900">{c.fullName}</span>
                              <span className="text-[11px] text-slate-500">
                                {c.phone || "Chưa có SĐT"} · {c.email}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs font-bold text-slate-700">
                        Họ tên người nhận <span className="text-red-500">*</span>
                      </span>
                      <input
                        required
                        value={shippingName}
                        onChange={(e) => setShippingName(e.target.value)}
                        placeholder="VD: Bác Nguyễn Văn An"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-bold text-slate-700">
                        Số điện thoại <span className="text-red-500">*</span>
                      </span>
                      <input
                        required
                        value={shippingPhone}
                        onChange={(e) => setShippingPhone(e.target.value)}
                        placeholder="VD: 0901234567"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                      />
                    </label>
                  </div>
                </section>

                <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-900">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    2. Địa chỉ nhận hàng
                  </h3>

                  <label className="block space-y-1">
                    <span className="text-xs font-bold text-slate-700">
                      Tỉnh / Thành phố <span className="text-red-500">*</span>
                    </span>
                    <select
                      required
                      value={selectedProvinceId || ""}
                      onChange={(e) => handleProvinceChange(Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                    >
                      <option value="">-- Chọn Tỉnh / Thành phố --</option>
                      {provinces.map((p) => (
                        <option key={p.ProvinceID} value={p.ProvinceID}>
                          {p.ProvinceName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs font-bold text-slate-700">
                        Quận / Huyện <span className="text-red-500">*</span>
                      </span>
                      <select
                        required
                        disabled={!selectedProvinceId}
                        value={selectedDistrictId || ""}
                        onChange={(e) => handleDistrictChange(Number(e.target.value))}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 disabled:bg-slate-100"
                      >
                        <option value="">-- Chọn Quận / Huyện --</option>
                        {districts.map((d) => (
                          <option key={d.DistrictID} value={d.DistrictID}>
                            {d.DistrictName}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1">
                      <span className="text-xs font-bold text-slate-700">
                        Phường / Xã <span className="text-red-500">*</span>
                      </span>
                      <select
                        required
                        disabled={!selectedDistrictId}
                        value={selectedWardCode}
                        onChange={(e) => handleWardChange(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 disabled:bg-slate-100"
                      >
                        <option value="">-- Chọn Phường / Xã --</option>
                        {wards.map((w) => (
                          <option key={w.WardCode} value={w.WardCode}>
                            {w.WardName}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-xs font-bold text-slate-700">
                      Số nhà, tên đường / thôn xóm <span className="text-red-500">*</span>
                    </span>
                    <input
                      required
                      value={shippingStreet}
                      onChange={(e) => setShippingStreet(e.target.value)}
                      placeholder="VD: 123 Nguyễn Huệ, Khu phố 2..."
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs font-bold text-slate-700">Phương thức thanh toán</span>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as "COD" | "VNPAY")}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                      >
                        <option value="COD">Thanh toán khi nhận hàng - COD</option>
                        <option value="VNPAY">Chuyển khoản qua VNPAY</option>
                      </select>
                    </label>

                    <label className="space-y-1">
                      <span className="text-xs font-bold text-slate-700">Mã giảm giá</span>
                      <input
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        placeholder="VD: PEAK50K"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm uppercase outline-none focus:border-slate-400"
                      />
                    </label>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-xs font-bold text-slate-700">Ghi chú giao hàng</span>
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ghi chú cho nhân viên đóng gói hoặc bưu tá GHN..."
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-slate-400"
                    />
                  </label>
                </section>
              </div>

              {/* Cột phải: Chọn sản phẩm & Giỏ hàng đơn đặt hộ */}
              <div className="flex flex-col gap-4 lg:col-span-7">
                <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-900">
                      <ShoppingBag className="h-4 w-4 text-blue-600" />
                      3. Chọn sản phẩm và kích cỡ
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Nhấn vào sản phẩm để thêm vào đơn
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={variantQuery}
                      onChange={(e) => setVariantQuery(e.target.value)}
                      placeholder="Tìm theo tên giày, mã SKU, màu sắc hoặc kích cỡ..."
                      className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
                    />
                  </div>

                  <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                    {loadingVariants ? (
                      <div className="py-8 text-center text-xs text-slate-500">
                        <Loader2 className="mr-1.5 inline h-4 w-4 animate-spin" />
                        Đang tìm biến thể còn hàng...
                      </div>
                    ) : variantResults.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        Không tìm thấy biến thể nào còn tồn kho khớp từ khóa.
                      </div>
                    ) : (
                      variantResults.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between gap-3 px-3 py-2 text-xs hover:bg-slate-50"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-10 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white">
                              {v.productImageUrl ? (
                                <img src={v.productImageUrl} alt="" className="h-full w-full object-contain p-0.5" />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-slate-300" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-900">{v.productName}</p>
                              <p className="truncate text-[11px] text-slate-500">
                                <span className="font-mono font-bold text-blue-600">{v.sku}</span> · {v.color} / Size{" "}
                                <strong>{v.size}</strong> · Tồn: <strong className="text-emerald-700">{v.stock}</strong>
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="font-bold text-slate-900">{formatOrderCurrency(v.finalPrice)}</span>
                            <button
                              type="button"
                              onClick={() => handleAddVariant(v)}
                              className="inline-flex h-8 items-center gap-1 rounded-lg bg-slate-950 px-2.5 text-[11px] font-bold text-white hover:bg-slate-800"
                            >
                              <Plus className="h-3.5 w-3.5" /> Chọn
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="flex flex-1 flex-col justify-between rounded-xl border border-slate-200 bg-white p-4">
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-black uppercase tracking-wide text-slate-900">
                          Danh sách sản phẩm đã chọn
                        </h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                          {selectedItems.reduce((s, i) => s + i.quantity, 0)} sản phẩm
                        </span>
                      </div>
                      {selectedItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedItems([])}
                          className="text-xs font-bold text-red-600 hover:underline"
                        >
                          Xóa tất cả
                        </button>
                      )}
                    </div>

                    {selectedItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-xs text-slate-400">
                        Chưa có sản phẩm nào trong đơn. Hãy nhấn <strong>+ Chọn</strong> ở danh sách phía trên.
                      </div>
                    ) : (
                      <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                        {selectedItems.map(({ variant, quantity }) => (
                          <div
                            key={variant.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-bold text-slate-900">{variant.productName}</p>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                <span className="font-mono font-bold text-blue-600">{variant.sku}</span> ·{" "}
                                {variant.color} / Size {variant.size} · {formatOrderCurrency(variant.finalPrice)}/đôi
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(variant.id, quantity - 1)}
                                className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={variant.stock}
                                value={quantity}
                                onChange={(e) => handleUpdateQuantity(variant.id, Number(e.target.value))}
                                className="h-7 w-12 rounded-md border border-slate-200 bg-white text-center font-bold text-slate-900 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(variant.id, quantity + 1)}
                                className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            <div className="w-24 text-right font-black text-slate-900">
                              {formatOrderCurrency(variant.finalPrice * quantity)}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(variant.id)}
                              className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                              aria-label="Xóa sản phẩm"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 space-y-1.5 border-t border-slate-200 pt-3 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Tạm tính tiền hàng:</span>
                      <strong className="text-slate-900">{formatOrderCurrency(subtotal)}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Phí giao hàng GHN dự kiến:</span>
                      <strong className="text-slate-900">
                        {calculatingFee
                          ? "Đang tính..."
                          : selectedItems.length > 0
                            ? formatOrderCurrency(shippingFee)
                            : "0 ₫"}
                      </strong>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-950">
                      <span>Tổng thanh toán dự kiến:</span>
                      <span className="text-blue-600">{formatOrderCurrency(estimatedTotal)}</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting || selectedItems.length === 0}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Tạo đơn hàng ngay
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
  );
}

