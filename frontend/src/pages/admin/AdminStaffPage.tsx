import { Search, Plus, Download, ShieldCheck, Ban, CheckCircle2, ChevronDown, ChevronRight, Lock, Key, Users, Layers, ShoppingBag, Package, LayoutDashboard, Tag, RefreshCw, Loader2 } from "lucide-react";
import { isAxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  AdminStaffService,
  type StaffResponse,
  type RoleResponse,
  type PermissionResponse,
  type CreateStaffRequest,
  type AdminStaffQueryParams,
} from "../../services/admin/adminStaffService";
import toast from "react-hot-toast";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminFilterHeader from "../../components/admin/AdminFilterHeader";
import { AdminDetailEmptyState, AdminDetailPanel } from "../../components/admin/AdminDetailPanel";
import AdminPagination from "../../components/admin/AdminPagination";

const PAGE_SIZE = 10;

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!isAxiosError<{ message?: string }>(error)) return fallback;
  return error.response?.data?.message || fallback;
};

// Map role to style
const getRoleBadge = (role: string) => {
  switch (role) {
    case "ROLE_SUPER_ADMIN":
    case "SUPER_ADMIN":
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700">Quản trị viên</span>;
    case "ROLE_STAFF_MANAGER":
    case "STAFF_MANAGER":
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-700">Quản lý nhân sự</span>;
    case "ROLE_WAREHOUSE":
    case "WAREHOUSE":
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700">Quản lý kho</span>;
    case "ROLE_SALES":
    case "SALES":
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700">Nhân viên bán hàng</span>;
    case "ROLE_SUPPORT":
    case "SUPPORT":
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-700">Nhân viên CSKH</span>;
    case "ROLE_MARKETING":
    case "MARKETING":
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-700">Nhân viên nội dung</span>;
    default:
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">Nhân viên</span>;
  }
};

export interface WorkspacePermInfo {
  name: string;
  badge: string;
}

export const ROLE_WORKSPACES_MAP: Record<string, {
  level: number;
  levelLabel: string;
  description: string;
  allowed: WorkspacePermInfo[];
  restricted: string[];
}> = {
  ROLE_SUPER_ADMIN: {
    level: 1,
    levelLabel: "Cấp 1 - Tối cao",
    description: "Toàn quyền quản trị 100% hệ thống, cấu hình cốt lõi và báo cáo tài chính mật.",
    allowed: [
      { name: "Tổng quan & Tài chính", badge: "Toàn quyền" },
      { name: "Dự báo & Cảnh báo", badge: "Toàn quyền" },
      { name: "Đơn hàng", badge: "Toàn quyền" },
      { name: "Đổi trả (RMA)", badge: "Toàn quyền" },
      { name: "Sản phẩm", badge: "Toàn quyền" },
      { name: "Tồn kho & Biến thể", badge: "Toàn quyền" },
      { name: "Lô hàng & Truy xuất", badge: "Toàn quyền" },
      { name: "Danh mục", badge: "Toàn quyền" },
      { name: "Thương hiệu", badge: "Toàn quyền" },
      { name: "Khách hàng", badge: "Toàn quyền" },
      { name: "Nhân sự & Phân quyền", badge: "Toàn quyền" },
      { name: "Khuyến mãi", badge: "Toàn quyền" },
      { name: "Nhật ký Hoạt động", badge: "Toàn quyền" },
    ],
    restricted: [],
  },
  SUPER_ADMIN: {
    level: 1,
    levelLabel: "Cấp 1 - Tối cao",
    description: "Toàn quyền quản trị 100% hệ thống, cấu hình cốt lõi và báo cáo tài chính mật.",
    allowed: [
      { name: "Tổng quan & Tài chính", badge: "Toàn quyền" },
      { name: "Dự báo & Cảnh báo", badge: "Toàn quyền" },
      { name: "Đơn hàng", badge: "Toàn quyền" },
      { name: "Đổi trả (RMA)", badge: "Toàn quyền" },
      { name: "Sản phẩm", badge: "Toàn quyền" },
      { name: "Tồn kho & Biến thể", badge: "Toàn quyền" },
      { name: "Lô hàng & Truy xuất", badge: "Toàn quyền" },
      { name: "Danh mục", badge: "Toàn quyền" },
      { name: "Thương hiệu", badge: "Toàn quyền" },
      { name: "Khách hàng", badge: "Toàn quyền" },
      { name: "Nhân sự & Phân quyền", badge: "Toàn quyền" },
      { name: "Khuyến mãi", badge: "Toàn quyền" },
      { name: "Nhật ký Hoạt động", badge: "Toàn quyền" },
    ],
    restricted: [],
  },
  ROLE_STAFF_MANAGER: {
    level: 2,
    levelLabel: "Cấp 2 - Vận hành",
    description: "Quản lý nhân viên, phân công vai trò, xem lịch sử kiểm toán và tra cứu khách hàng.",
    allowed: [
      { name: "Tổng quan vận hành", badge: "Vận hành" },
      { name: "Hồ sơ Khách hàng 360", badge: "Quản lý" },
      { name: "Nhân sự & Phân quyền", badge: "Toàn quyền" },
      { name: "Nhật ký Hoạt động", badge: "Giám sát" },
    ],
    restricted: ["Báo cáo tài chính mật", "Dự báo cạn kho", "Kho vận & Lô hàng", "Khuyến mãi"],
  },
  STAFF_MANAGER: {
    level: 2,
    levelLabel: "Cấp 2 - Vận hành",
    description: "Quản lý nhân viên, phân công vai trò, xem lịch sử kiểm toán và tra cứu khách hàng.",
    allowed: [
      { name: "Tổng quan vận hành", badge: "Vận hành" },
      { name: "Hồ sơ Khách hàng 360", badge: "Quản lý" },
      { name: "Nhân sự & Phân quyền", badge: "Toàn quyền" },
      { name: "Nhật ký Hoạt động", badge: "Giám sát" },
    ],
    restricted: ["Báo cáo tài chính mật", "Dự báo cạn kho", "Kho vận & Lô hàng", "Khuyến mãi"],
  },
  ROLE_WAREHOUSE: {
    level: 3,
    levelLabel: "Cấp 3 - Kho vận",
    description: "Quản lý toàn diện tồn kho biến thể, nhập xuất lô Batches FIFO, kiểm kê và kiểm định RMA.",
    allowed: [
      { name: "Tổng quan cảnh báo kho", badge: "Cảnh báo" },
      { name: "Dự báo cạn kho & ROP", badge: "Toàn quyền" },
      { name: "Tồn kho & Biến thể", badge: "Toàn quyền" },
      { name: "Lô hàng & Truy xuất FIFO", badge: "Toàn quyền" },
      { name: "Kiểm định Đổi trả RMA", badge: "Kiểm tra" },
      { name: "Tra cứu Sản phẩm", badge: "Xem SKU" },
    ],
    restricted: ["Đơn hàng thanh toán", "Khách hàng", "Khuyến mãi", "Nhân sự", "Kiểm toán"],
  },
  WAREHOUSE: {
    level: 3,
    levelLabel: "Cấp 3 - Kho vận",
    description: "Quản lý toàn diện tồn kho biến thể, nhập xuất lô Batches FIFO, kiểm kê và kiểm định RMA.",
    allowed: [
      { name: "Tổng quan cảnh báo kho", badge: "Cảnh báo" },
      { name: "Dự báo cạn kho & ROP", badge: "Toàn quyền" },
      { name: "Tồn kho & Biến thể", badge: "Toàn quyền" },
      { name: "Lô hàng & Truy xuất FIFO", badge: "Toàn quyền" },
      { name: "Kiểm định Đổi trả RMA", badge: "Kiểm tra" },
      { name: "Tra cứu Sản phẩm", badge: "Xem SKU" },
    ],
    restricted: ["Đơn hàng thanh toán", "Khách hàng", "Khuyến mãi", "Nhân sự", "Kiểm toán"],
  },
  ROLE_SALES: {
    level: 3,
    levelLabel: "Cấp 3 - Bán hàng",
    description: "Xử lý đơn hàng, tạo đơn quầy với Pessimistic Lock, in vận đơn GHN A5 và hỗ trợ đổi trả.",
    allowed: [
      { name: "Tổng quan phễu đơn", badge: "Vận hành" },
      { name: "Quản lý Đơn hàng & In A5", badge: "Toàn quyền" },
      { name: "Xử lý Đổi trả (RMA)", badge: "Toàn quyền" },
      { name: "Hồ sơ Khách hàng", badge: "Tra cứu" },
      { name: "Tra cứu giá Sản phẩm", badge: "Xem giá" },
      { name: "Tra cứu mã Khuyến mãi", badge: "Xem mã" },
    ],
    restricted: ["Kho & Lô Batches", "Dự báo ROP", "Nhân sự", "Danh mục & Thương hiệu"],
  },
  SALES: {
    level: 3,
    levelLabel: "Cấp 3 - Bán hàng",
    description: "Xử lý đơn hàng, tạo đơn quầy với Pessimistic Lock, in vận đơn GHN A5 và hỗ trợ đổi trả.",
    allowed: [
      { name: "Tổng quan phễu đơn", badge: "Vận hành" },
      { name: "Quản lý Đơn hàng & In A5", badge: "Toàn quyền" },
      { name: "Xử lý Đổi trả (RMA)", badge: "Toàn quyền" },
      { name: "Hồ sơ Khách hàng", badge: "Tra cứu" },
      { name: "Tra cứu giá Sản phẩm", badge: "Xem giá" },
      { name: "Tra cứu mã Khuyến mãi", badge: "Xem mã" },
    ],
    restricted: ["Kho & Lô Batches", "Dự báo ROP", "Nhân sự", "Danh mục & Thương hiệu"],
  },
  ROLE_SUPPORT: {
    level: 3,
    levelLabel: "Cấp 3 - CSKH",
    description: "Hỗ trợ khách hàng, tiếp nhận yêu cầu bảo hành/đổi size và tra cứu lịch sử mua.",
    allowed: [
      { name: "Tổng quan", badge: "Theo dõi" },
      { name: "Tra cứu Đơn hàng", badge: "Tra cứu" },
      { name: "Tiếp nhận Đổi trả RMA", badge: "Tiếp nhận" },
      { name: "Hồ sơ Khách hàng 360", badge: "Toàn quyền" },
      { name: "Tra cứu Sản phẩm", badge: "Tư vấn" },
    ],
    restricted: ["Kho vận & Lô hàng", "Tài chính", "Khuyến mãi", "Nhân sự"],
  },
  SUPPORT: {
    level: 3,
    levelLabel: "Cấp 3 - CSKH",
    description: "Hỗ trợ khách hàng, tiếp nhận yêu cầu bảo hành/đổi size và tra cứu lịch sử mua.",
    allowed: [
      { name: "Tổng quan", badge: "Theo dõi" },
      { name: "Tra cứu Đơn hàng", badge: "Tra cứu" },
      { name: "Tiếp nhận Đổi trả RMA", badge: "Tiếp nhận" },
      { name: "Hồ sơ Khách hàng 360", badge: "Toàn quyền" },
      { name: "Tra cứu Sản phẩm", badge: "Tư vấn" },
    ],
    restricted: ["Kho vận & Lô hàng", "Tài chính", "Khuyến mãi", "Nhân sự"],
  },
  ROLE_MARKETING: {
    level: 3,
    levelLabel: "Cấp 3 - Tiếp thị",
    description: "Đăng bán sản phẩm, cập nhật ảnh/mô tả, quản trị danh mục, thương hiệu và tạo voucher.",
    allowed: [
      { name: "Tổng quan bán lẻ", badge: "Theo dõi" },
      { name: "Đăng & Quản lý Sản phẩm", badge: "Toàn quyền" },
      { name: "Cây phân loại Danh mục", badge: "Toàn quyền" },
      { name: "Thương hiệu & Silhouette", badge: "Toàn quyền" },
      { name: "Chương trình Khuyến mãi", badge: "Toàn quyền" },
    ],
    restricted: ["Đơn hàng", "Kho vận & Lô hàng", "Nhân sự", "Kiểm toán hệ thống"],
  },
  MARKETING: {
    level: 3,
    levelLabel: "Cấp 3 - Tiếp thị",
    description: "Đăng bán sản phẩm, cập nhật ảnh/mô tả, quản trị danh mục, thương hiệu và tạo voucher.",
    allowed: [
      { name: "Tổng quan bán lẻ", badge: "Theo dõi" },
      { name: "Đăng & Quản lý Sản phẩm", badge: "Toàn quyền" },
      { name: "Cây phân loại Danh mục", badge: "Toàn quyền" },
      { name: "Thương hiệu & Silhouette", badge: "Toàn quyền" },
      { name: "Chương trình Khuyến mãi", badge: "Toàn quyền" },
    ],
    restricted: ["Đơn hàng", "Kho vận & Lô hàng", "Nhân sự", "Kiểm toán hệ thống"],
  },
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Hoạt động
        </span>
      );
    case "SUSPENDED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Tạm khóa
        </span>
      );
    case "TERMINATED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Đã nghỉ
        </span>
      );
    default:
      return null;
  }
};

export default function AdminStaffPage() {
  const [activeMainTab, setActiveMainTab] = useState<"staff_list" | "roles_permissions" | "audit_log">("staff_list");
  const [staffList, setStaffList] = useState<StaffResponse[]>([]);
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected staff in detail panel
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffResponse | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "roles_perms" | "activity">("roles_perms");

  // Permission selection state for current staff
  const [currentSelectedRole, setCurrentSelectedRole] = useState<string>("");
  const [selectedPermCodes, setSelectedPermCodes] = useState<Set<string>>(new Set());
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [showAdvancedPerms, setShowAdvancedPerms] = useState(false);

  // Filter states
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("Tất cả");
  const [selectedRole, setSelectedRole] = useState<string>("Tất cả");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("Tất cả");
  const [sortBy, setSortBy] = useState<string>("joinedAt");
  const [sortDirection, setSortDirection] = useState<string>("DESC");

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Create Staff Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateStaffRequest>({
    email: "",
    password: "Staff@2026!",
    firstName: "",
    lastName: "",
    phone: "",
    role: "ROLE_WAREHOUSE",
    department: "KHO_VAN",
    positionTitle: "Nhân viên kho",
    notes: ""
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Accordion state in permissions
  const [openAccordion, setOpenAccordion] = useState<Record<string, boolean>>({
    DASHBOARD: true,
    ORDER: true,
    PRODUCT: true,
    INVENTORY: true,
    MARKETING: true,
    STAFF: true
  });

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load roles & permissions once
  useEffect(() => {
    Promise.all([
      AdminStaffService.getAllRoles(),
      AdminStaffService.getAllPermissions()
    ]).then(([r, p]) => {
      setRoles(r);
      setPermissions(p);
    }).catch(err => {
      toast.error(getApiErrorMessage(err, "Không thể nạp danh mục vai trò & quyền hạn."));
    });
  }, []);

  const fetchStaffList = useCallback(async () => {
    setLoading(true);
    try {
      const params: AdminStaffQueryParams = {
        page,
        size: PAGE_SIZE,
        sortBy,
        sortDirection
      };
      if (debouncedQuery.trim()) params.query = debouncedQuery.trim();
      if (selectedStatus !== "Tất cả") params.status = selectedStatus;
      if (selectedRole !== "Tất cả") params.role = selectedRole;
      if (selectedDepartment !== "Tất cả") params.department = selectedDepartment;

      const res = await AdminStaffService.getStaffList(params);
      if (res && res.items) {
        setStaffList(res.items);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);

        if (res.items.length > 0 && selectedStaffId === null) {
          setSelectedStaffId(res.items[0].id);
        }
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Không thể tải danh sách nhân viên."));
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, page, selectedDepartment, selectedRole, selectedStaffId, selectedStatus, sortBy, sortDirection]);

  useEffect(() => {
    void fetchStaffList();
  }, [fetchStaffList]);

  // When selected staff changes, update local state
  useEffect(() => {
    if (!selectedStaffId) {
      setSelectedStaff(null);
      return;
    }
    const staff = staffList.find(s => s.id === selectedStaffId);
    if (staff) {
      setSelectedStaff(staff);
      setCurrentSelectedRole(staff.role);
      setSelectedPermCodes(new Set(staff.permissions));
    }
  }, [selectedStaffId, staffList]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("Tất cả");
    setSelectedRole("Tất cả");
    setSelectedDepartment("Tất cả");
    setSortBy("createdAt");
    setSortDirection("DESC");
    setPage(0);
    toast.success("Đã đặt lại bộ lọc.");
  };

  const handleTogglePermission = (code: string) => {
    setSelectedPermCodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleUseRoleDefaults = () => {
    const roleObj = roles.find(r => r.code === currentSelectedRole);
    if (roleObj) {
      setSelectedPermCodes(new Set(roleObj.permissions));
      toast.success(`Đã áp dụng bộ quyền mẫu của ${roleObj.name}`);
    }
  };

  const handleSaveRoleAndPermissions = async () => {
    if (!selectedStaff) return;
    setSavingPermissions(true);
    const toastId = toast.loading("Đang lưu phân quyền...");
    try {
      if (currentSelectedRole !== selectedStaff.role) {
        await AdminStaffService.updateStaffRole(selectedStaff.id, currentSelectedRole);
      }
      await AdminStaffService.updateStaffPermissions(selectedStaff.id, Array.from(selectedPermCodes));
      toast.success("Đã lưu cập nhật phân quyền thành công!", { id: toastId });
      fetchStaffList();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Lưu phân quyền thất bại."), { id: toastId });
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleToggleStaffStatus = async (staff: StaffResponse) => {
    const nextStatus = staff.staffStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const toastId = toast.loading("Đang cập nhật trạng thái...");
    try {
      await AdminStaffService.updateStaffStatus(staff.id, nextStatus);
      toast.success(nextStatus === "ACTIVE" ? "Đã mở khóa nhân viên." : "Đã tạm khóa nhân viên.", { id: toastId });
      fetchStaffList();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Cập nhật thất bại."), { id: toastId });
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createForm.password.length < 10) {
      toast.error("Mật khẩu nhân viên phải từ 10 ký tự trở lên (gồm chữ hoa, thường, số và ký tự đặc biệt).");
      return;
    }
    setSubmittingCreate(true);
    const toastId = toast.loading("Đang thêm nhân viên mới...");
    try {
      await AdminStaffService.createStaff(createForm);
      toast.success("Thêm nhân viên mới thành công!", { id: toastId });
      setIsCreateModalOpen(false);
      setCreateForm({
        email: "",
        password: "Staff@2026!",
        firstName: "",
        lastName: "",
        phone: "",
        role: "ROLE_WAREHOUSE",
        department: "KHO_VAN",
        positionTitle: "Nhân viên kho",
        notes: ""
      });
      fetchStaffList();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Thêm nhân viên thất bại."), { id: toastId });
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleExportCSV = () => {
    if (staffList.length === 0) {
      toast.error("Không có dữ liệu nhân viên để xuất.");
      return;
    }
    const headers = ["ID", "Họ tên", "Email", "Số điện thoại", "Vai trò", "Phòng ban", "Chức danh", "Trạng thái", "Ngày tham gia"];
    const rows = staffList.map(s => [
      s.id,
      `"${s.fullName}"`,
      `"${s.email}"`,
      `"${s.phone || ''}"`,
      `"${s.roleName}"`,
      `"${s.departmentName}"`,
      `"${s.positionTitle}"`,
      s.staffStatus,
      new Date(s.joinedAt).toLocaleDateString("vi-VN")
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PeakSneaker_NhanSu_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất danh sách nhân viên thành công!");
  };

  // Group permissions by module
  const moduleLabels: Record<string, { label: string; icon: typeof LayoutDashboard }> = {
    DASHBOARD: { label: "Tổng quan & Báo cáo", icon: LayoutDashboard },
    ORDER: { label: "Đơn hàng & Vận hành", icon: Package },
    PRODUCT: { label: "Sản phẩm & Biến thể", icon: ShoppingBag },
    INVENTORY: { label: "Kho & Lô hàng (FIFO)", icon: Layers },
    MARKETING: { label: "Khuyến mãi & Danh mục", icon: Tag },
    STAFF: { label: "Nhân sự & Phân quyền", icon: Users }
  };

  const groupedPermissions: Record<string, PermissionResponse[]> = {};
  permissions.forEach(p => {
    if (!groupedPermissions[p.module]) groupedPermissions[p.module] = [];
    groupedPermissions[p.module].push(p);
  });

  const activeFilterCount = (selectedStatus !== "Tất cả" ? 1 : 0) +
    (selectedRole !== "Tất cả" ? 1 : 0) +
    (selectedDepartment !== "Tất cả" ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Header chuẩn không KPI */}
      <AdminPageHeader
        title="Nhân sự & Phân quyền"
        description="Quản lý tài khoản nhân viên, vai trò và phân quyền hệ thống."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => void fetchStaffList()}
              disabled={loading}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500"
            >
              <Download className="h-4 w-4" /> Xuất danh sách
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> Thêm nhân viên
            </button>
          </div>
        }
      />

      {/* 3 Main Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2">
        <button
          onClick={() => setActiveMainTab("staff_list")}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeMainTab === "staff_list"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" /> Danh sách nhân viên
        </button>
        <button
          onClick={() => setActiveMainTab("roles_permissions")}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeMainTab === "roles_permissions"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Vai trò & Không gian làm việc
        </button>
        <Link
          to="/admin/audit-logs"
          className="py-3 px-4 text-xs font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition flex items-center gap-2"
        >
          <Key className="w-4 h-4" /> Nhật ký kiểm toán
        </Link>
      </div>

      {activeMainTab === "staff_list" && (
        <>
          {/* Bộ lọc tìm kiếm */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <AdminFilterHeader
              isOpen={isFilterExpanded}
              onToggle={() => setIsFilterExpanded(!isFilterExpanded)}
              activeCount={activeFilterCount}
              onReset={handleClearFilters}
            />

            {isFilterExpanded && (
              <div className="border-t border-slate-100 p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên, email, vai trò, chức danh nhân viên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Trạng thái</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => { setSelectedStatus(e.target.value); setPage(0); }}
                      className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="Tất cả">Tất cả trạng thái</option>
                      <option value="ACTIVE">Hoạt động</option>
                      <option value="SUSPENDED">Tạm khóa</option>
                      <option value="TERMINATED">Đã nghỉ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Vai trò</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => { setSelectedRole(e.target.value); setPage(0); }}
                      className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="Tất cả">Tất cả vai trò</option>
                      <option value="ROLE_SUPER_ADMIN">Quản trị viên (Super Admin)</option>
                      <option value="ROLE_STAFF_MANAGER">Quản lý nhân sự</option>
                      <option value="ROLE_WAREHOUSE">Quản lý kho</option>
                      <option value="ROLE_SALES">Nhân viên bán hàng</option>
                      <option value="ROLE_SUPPORT">Nhân viên CSKH</option>
                      <option value="ROLE_MARKETING">Nhân viên nội dung</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phòng ban</label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => { setSelectedDepartment(e.target.value); setPage(0); }}
                      className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="Tất cả">Tất cả phòng ban</option>
                      <option value="BAN_GIAM_DOC">Ban giám đốc</option>
                      <option value="KHO_VAN">Kho vận</option>
                      <option value="BAN_HANG">Bán hàng</option>
                      <option value="CSKH">Chăm sóc khách hàng</option>
                      <option value="MARKETING">Marketing</option>
                      <option value="TAI_CHINH">Tài chính</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sắp xếp</label>
                    <select
                      value={`${sortBy}_${sortDirection}`}
                      onChange={(e) => {
                        const [by, dir] = e.target.value.split("_");
                        setSortBy(by);
                        setSortDirection(dir);
                        setPage(0);
                      }}
                      className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="joinedAt_DESC">Mới nhất</option>
                      <option value="joinedAt_ASC">Cũ nhất</option>
                      <option value="department_ASC">Theo phòng ban</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2-Column Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Bảng nhân viên (Cột trái) */}
            <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700">
                  Danh sách nhân viên ({totalElements})
                </p>
                <span className="text-[11px] text-slate-400 font-medium">Nhấn vào dòng để phân quyền</span>
              </div>

              <div className="overflow-x-auto min-h-[350px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3 w-10 text-center">#</th>
                      <th className="py-3 px-3">Nhân viên</th>
                      <th className="py-3 px-3">Vai trò</th>
                      <th className="py-3 px-3 hidden sm:table-cell">Phòng ban</th>
                      <th className="py-3 px-3 text-center">Trạng thái</th>
                      <th className="py-3 px-3 hidden md:table-cell">Ngày tạo</th>
                      <th className="py-3 px-3 w-12 text-center">Khóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                          Đang tải danh sách nhân viên...
                        </td>
                      </tr>
                    ) : staffList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-slate-400">
                          Không tìm thấy nhân viên nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      staffList.map((staff, idx) => {
                        const isSelected = selectedStaffId === staff.id;
                        const initial = staff.fullName ? staff.fullName.charAt(0).toUpperCase() : staff.email.charAt(0).toUpperCase();
                        return (
                          <tr
                            key={staff.id}
                            onClick={() => setSelectedStaffId(staff.id)}
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
                                  <p className="font-bold text-slate-900 truncate">{staff.fullName}</p>
                                  <p className="text-[11px] text-slate-400 truncate">{staff.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              {getRoleBadge(staff.role)}
                            </td>
                            <td className="py-3 px-3 hidden sm:table-cell text-slate-600 text-xs">
                              {staff.departmentName}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {getStatusBadge(staff.staffStatus)}
                            </td>
                            <td className="py-3 px-3 hidden md:table-cell text-slate-400 text-[11px]">
                              {new Date(staff.createdAt).toLocaleDateString("vi-VN")}
                            </td>
                            <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              {staff.role !== "ROLE_SUPER_ADMIN" && staff.role !== "SUPER_ADMIN" ? (
                                <button
                                  onClick={() => handleToggleStaffStatus(staff)}
                                  className={`p-1.5 rounded-lg border text-xs transition ${
                                    staff.staffStatus === "ACTIVE"
                                      ? "border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200"
                                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                  }`}
                                  title={staff.staffStatus === "ACTIVE" ? "Tạm khóa nhân viên" : "Mở khóa nhân viên"}
                                >
                                  {staff.staffStatus === "ACTIVE" ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                </button>
                              ) : (
                                <span title="Tài khoản tối cao không thể khóa">
                                  <Lock className="w-3.5 h-3.5 text-slate-300 mx-auto" />
                                </span>
                              )}
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
                  visibleCount={staffList.length}
                  itemLabel="nhân viên"
                  onPageChange={setPage}
                />
              </div>
            </div>

            {/* Panel Chi tiết & Phân quyền (Cột phải) */}
            <div className="lg:col-span-5 xl:col-span-4 sticky top-4">
              <AdminDetailPanel ariaLabel="Thông tin & Phân quyền nhân viên">
                {!selectedStaff ? (
                  <AdminDetailEmptyState
                    icon={<ShieldCheck className="w-8 h-8 text-blue-600" />}
                    title="Chọn một nhân viên"
                    description="Nhấn vào nhân viên trong bảng bên trái để tùy chỉnh vai trò và ma trận quyền hạn chi tiết."
                  />
                ) : (
                  <div className="p-4 space-y-4">
                    {/* Header Staff Card */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex shrink-0 items-center justify-center font-bold text-base shadow-sm">
                        {selectedStaff.fullName ? selectedStaff.fullName.charAt(0).toUpperCase() : "NV"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{selectedStaff.fullName}</h4>
                          {getStatusBadge(selectedStaff.staffStatus)}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{selectedStaff.email}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {selectedStaff.positionTitle} • {selectedStaff.departmentName}
                        </p>
                      </div>
                    </div>

                    {/* Sub-tabs */}
                    <div className="flex border-b border-slate-200">
                      <button
                        onClick={() => setDetailTab("roles_perms")}
                        className={`py-2 px-3 text-xs font-bold border-b-2 transition ${
                          detailTab === "roles_perms"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Vai trò & Quyền
                      </button>
                      <button
                        onClick={() => setDetailTab("info")}
                        className={`py-2 px-3 text-xs font-bold border-b-2 transition ${
                          detailTab === "info"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Hồ sơ nhân sự
                      </button>
                      <button
                        onClick={() => setDetailTab("activity")}
                        className={`py-2 px-3 text-xs font-bold border-b-2 transition ${
                          detailTab === "activity"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Lịch sử thao tác
                      </button>
                    </div>

                    {/* Tab Vai trò & Quyền */}
                    {detailTab === "roles_perms" && (
                      <div className="space-y-4">
                        {/* Selector Vai trò */}
                        <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              Vai trò công tác chuyên môn
                            </label>
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                              {ROLE_WORKSPACES_MAP[currentSelectedRole]?.levelLabel || "Cấp bậc"}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <select
                              value={currentSelectedRole}
                              onChange={(e) => setCurrentSelectedRole(e.target.value)}
                              disabled={selectedStaff.role === "ROLE_SUPER_ADMIN" || selectedStaff.role === "SUPER_ADMIN"}
                              className="flex-1 h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 font-medium outline-none focus:border-blue-500"
                            >
                              <option value="ROLE_SUPER_ADMIN">Quản trị viên cấp cao (Super Admin)</option>
                              <option value="ROLE_STAFF_MANAGER">Quản lý nhân sự & Vận hành</option>
                              <option value="ROLE_WAREHOUSE">Quản lý kho & Vận chuyển</option>
                              <option value="ROLE_SALES">Nhân viên bán hàng & Đơn hàng</option>
                              <option value="ROLE_SUPPORT">Nhân viên CSKH & Đổi trả</option>
                              <option value="ROLE_MARKETING">Nhân viên nội dung & Tiếp thị</option>
                            </select>
                            <button
                              onClick={handleUseRoleDefaults}
                              className="px-2.5 h-9 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition whitespace-nowrap"
                              title="Khôi phục quyền mặc định theo vai trò"
                            >
                              Quyền mẫu
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug pt-0.5">
                            {ROLE_WORKSPACES_MAP[currentSelectedRole]?.description}
                          </p>
                        </div>

                        {/* Không gian làm việc được phân công */}
                        <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-3 shadow-xs">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Phân hệ được cấp toàn quyền ({ROLE_WORKSPACES_MAP[currentSelectedRole]?.allowed.length || 0})
                              </span>
                              <span className="text-[10px] text-emerald-600 font-bold">Hiển thị trên Sidebar</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {ROLE_WORKSPACES_MAP[currentSelectedRole]?.allowed.map((w) => (
                                <span
                                  key={w.name}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                                >
                                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                  {w.name}
                                </span>
                              ))}
                            </div>
                          </div>

                          {ROLE_WORKSPACES_MAP[currentSelectedRole]?.restricted.length > 0 && (
                            <div className="pt-2 border-t border-slate-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                  <Ban className="w-3.5 h-3.5 text-slate-400" />
                                  Phân hệ bị hạn chế / Ẩn ({ROLE_WORKSPACES_MAP[currentSelectedRole]?.restricted.length || 0})
                                </span>
                                <span className="text-[10px] text-slate-400">Ẩn hoàn toàn</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {ROLE_WORKSPACES_MAP[currentSelectedRole]?.restricted.map((r) => (
                                  <span
                                    key={r}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200"
                                  >
                                    <Lock className="w-2.5 h-2.5 text-slate-400" />
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Save Button */}
                        <button
                          onClick={handleSaveRoleAndPermissions}
                          disabled={savingPermissions}
                          className="w-full h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-950/20 transition flex items-center justify-center gap-1.5"
                        >
                          {savingPermissions ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lưu phân công vai trò"}
                        </button>

                        {/* Tùy biến quyền hạn mở rộng (Nâng cao) */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAdvancedPerms(!showAdvancedPerms)}
                            className="w-full py-2 px-3 rounded-lg border border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 text-[11px] font-bold transition flex items-center justify-between"
                          >
                            <span>Tùy biến quyền chi tiết mở rộng ({selectedPermCodes.size} quyền)</span>
                            {showAdvancedPerms ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                          </button>

                          {showAdvancedPerms && (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 mt-2">
                              {Object.entries(groupedPermissions).map(([mod, perms]) => {
                                const modInfo = moduleLabels[mod] || { label: mod, icon: LayoutDashboard };
                                const Icon = modInfo.icon;
                                const isOpen = openAccordion[mod] ?? true;
                                const checkedCount = perms.filter(p => selectedPermCodes.has(p.code)).length;

                                return (
                                  <div key={mod} className="rounded-xl border border-slate-200/80 bg-white overflow-hidden text-xs">
                                    <button
                                      onClick={() => setOpenAccordion(prev => ({ ...prev, [mod]: !prev[mod] }))}
                                      className="w-full flex items-center justify-between p-2.5 bg-slate-50/70 hover:bg-slate-100/70 transition font-bold text-slate-800"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Icon className="w-4 h-4 text-blue-600" />
                                        <span>{modInfo.label}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 font-mono text-slate-600">
                                          {checkedCount}/{perms.length}
                                        </span>
                                        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                      </div>
                                    </button>

                                    {isOpen && (
                                      <div className="p-2.5 divide-y divide-slate-100 space-y-1">
                                        {perms.map(p => {
                                          const isChecked = selectedPermCodes.has(p.code);
                                          return (
                                            <label
                                              key={p.code}
                                              className="flex items-start gap-2.5 py-1.5 px-1 cursor-pointer hover:bg-blue-50/40 rounded transition"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleTogglePermission(p.code)}
                                                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                              />
                                              <div className="min-w-0">
                                                <p className="font-semibold text-slate-800 leading-tight">{p.name}</p>
                                                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{p.description}</p>
                                              </div>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tab Hồ sơ nhân sự */}
                    {detailTab === "info" && (
                      <div className="space-y-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Phòng ban:</span>
                            <span className="font-bold text-slate-800">{selectedStaff.departmentName}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Chức vụ:</span>
                            <span className="font-bold text-slate-800">{selectedStaff.positionTitle}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Số điện thoại:</span>
                            <span className="font-mono text-slate-800">{selectedStaff.phone || "Chưa cập nhật"}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Ngày vào làm:</span>
                            <span className="font-medium text-slate-700">
                              {new Date(selectedStaff.joinedAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          <div className="pt-1">
                            <span className="text-slate-500 block mb-1">Ghi chú quản lý:</span>
                            <p className="text-slate-700 italic bg-white p-2 rounded border border-slate-200">
                              {selectedStaff.notes || "Không có ghi chú thêm."}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab Lịch sử thao tác */}
                    {detailTab === "activity" && (
                      <div className="space-y-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl text-center space-y-2">
                          <p className="text-slate-600">Xem toàn bộ lịch sử thao tác của nhân viên này trên hệ thống.</p>
                          <Link
                            to={`/admin/audit-logs?performedBy=${encodeURIComponent(selectedStaff.email)}`}
                            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
                          >
                            Mở Nhật ký thao tác
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </AdminDetailPanel>
            </div>
          </div>
        </>
      )}

      {/* Tab 2: Vai trò & Không gian làm việc */}
      {activeMainTab === "roles_permissions" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((r) => {
            const roleConfig = ROLE_WORKSPACES_MAP[r.code] || {
              level: r.hierarchyLevel,
              levelLabel: `Cấp bậc ${r.hierarchyLevel}`,
              description: r.description,
              allowed: [],
              restricted: [],
            };

            return (
              <div key={r.id} className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      {roleConfig.levelLabel}
                    </span>
                    {r.isSystem && (
                      <span className="text-[10px] text-slate-400 font-semibold">Hệ thống</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{r.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{r.code}</p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{r.description}</p>
                </div>

                {/* Danh sách phân hệ được phép */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Phân hệ phụ trách:
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">
                      {roleConfig.allowed.length} phân hệ
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {roleConfig.allowed.map((w) => (
                      <span
                        key={w.name}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100"
                      >
                        {w.name}
                      </span>
                    ))}
                  </div>

                  {roleConfig.restricted.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">
                        Bị hạn chế / Ẩn menu:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {roleConfig.restricted.map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-500 border border-slate-200/60"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Quyền hạn chi tiết:</span>
                  <span className="font-bold text-slate-700">{r.permissions.length} quyền</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Thêm Nhân Viên Mới */}
      {isCreateModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" /> Thêm nhân viên mới
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Họ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Thị"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Mai"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email công việc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="VD: mai.nt@peaksneaker.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full h-9 rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mật khẩu ban đầu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Tối thiểu 10 ký tự, gồm chữ hoa, thường, số và ký tự đặc biệt (@#$%^&*...).</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 0912345678"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Vai trò <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 px-2 outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="ROLE_WAREHOUSE">Quản lý kho</option>
                    <option value="ROLE_SALES">Nhân viên bán hàng</option>
                    <option value="ROLE_SUPPORT">Nhân viên CSKH</option>
                    <option value="ROLE_MARKETING">Nhân viên nội dung</option>
                    <option value="ROLE_STAFF_MANAGER">Quản lý nhân sự</option>
                  </select>
                  <p className="text-[10px] text-blue-600 mt-1 leading-tight font-medium">
                    Toàn quyền cụm: {ROLE_WORKSPACES_MAP[createForm.role]?.allowed.map(w => w.name).slice(0, 3).join(", ")}...
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phòng ban <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={createForm.department}
                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-200 px-2 outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="KHO_VAN">Kho vận</option>
                    <option value="BAN_HANG">Bán hàng</option>
                    <option value="CSKH">Chăm sóc khách hàng</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="TAI_CHINH">Tài chính</option>
                    <option value="BAN_GIAM_DOC">Ban giám đốc</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Chức danh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Quản lý kho, Chuyên viên bán hàng..."
                  value={createForm.positionTitle}
                  onChange={(e) => setCreateForm({ ...createForm, positionTitle: e.target.value })}
                  className="w-full h-9 rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú phân công công việc..."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="h-9 px-5 rounded-xl bg-slate-950 text-xs font-bold text-white hover:bg-slate-800 transition flex items-center gap-1.5"
                >
                  {submittingCreate ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo tài khoản nhân viên"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
