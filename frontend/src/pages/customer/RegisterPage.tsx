import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { AuthService } from "../../services/authService";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import toast from "react-hot-toast";

const VN_PHONE_REGEX = /^(0[35789])[0-9]{8}$/;

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Tiêu chí bảo mật mật khẩu
  const hasMinLength = password.length >= 8 && password.length <= 72;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[@#$%^&+=!._*~-]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!isPasswordValid) {
      setError("Mật khẩu chưa đáp ứng đầy đủ các tiêu chuẩn bảo mật.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    if (!VN_PHONE_REGEX.test(phone.trim())) {
      setFieldErrors(prev => ({
        ...prev,
        phone: "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09."
      }));
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      await AuthService.register(cleanEmail, password, firstName, lastName, phone.trim());
      localStorage.setItem('pending_verify_email', cleanEmail);
      toast.success("Đăng ký thành công! Vui lòng nhập mã OTP để kích hoạt tài khoản.");
      navigate(`/verify-otp?email=${encodeURIComponent(cleanEmail)}`);
    } catch (err: any) {
      const responseData = err.response?.data;
      if (responseData?.data && typeof responseData.data === 'object') {
        setFieldErrors(responseData.data);
        setError(responseData.message || "Dữ liệu đầu vào không hợp lệ");
      } else {
        setError(responseData?.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getInputClassName = (fieldName: string) => {
    return `mt-1 appearance-none relative block w-full px-3 py-2.5 border rounded-md placeholder-zinc-400 focus:outline-none focus:ring-1 sm:text-sm ${
      fieldErrors[fieldName]
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
    }`;
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-sm border border-zinc-100">
        <div className="text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight text-zinc-900">Tạo Tài Khoản</h2>
          <p className="mt-2 text-sm text-zinc-500">Điền thông tin của bạn để tiếp tục</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && Object.keys(fieldErrors).length === 0 && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-zinc-700">Họ</label>
                <input id="lastName" name="lastName" type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nguyễn" className={getInputClassName("lastName")} />
                {fieldErrors.lastName && <p className="mt-1 text-xs text-red-500">{fieldErrors.lastName}</p>}
              </div>

              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-zinc-700">Tên</label>
                <input id="firstName" name="firstName" type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Văn A" className={getInputClassName("firstName")} />
                {fieldErrors.firstName && <p className="mt-1 text-xs text-red-500">{fieldErrors.firstName}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={getInputClassName("email")}
                placeholder="Nhập địa chỉ email"
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-zinc-700">Số Điện Thoại</label>
              <input
                id="phone"
                name="phone"
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={getInputClassName("phone")}
                placeholder="0987654321"
              />
              {fieldErrors.phone && <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700">Mật khẩu</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${getInputClassName("password")} pr-10`}
                  placeholder="Tạo mật khẩu an toàn"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}

              {/* Checklist độ mạnh mật khẩu theo chuẩn bảo mật */}
              {password.length > 0 && (
                <div className="mt-2.5 p-3 bg-zinc-50 border border-zinc-200/80 rounded-lg text-xs space-y-1.5">
                  <p className="font-semibold text-zinc-700">Yêu cầu bảo mật mật khẩu:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    <span className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-600 font-medium" : "text-zinc-500"}`}>
                      {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-zinc-400" />} Từ 8 - 72 ký tự
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasUpper ? "text-emerald-600 font-medium" : "text-zinc-500"}`}>
                      {hasUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-zinc-400" />} Chữ cái in hoa (A-Z)
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasLower ? "text-emerald-600 font-medium" : "text-zinc-500"}`}>
                      {hasLower ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-zinc-400" />} Chữ cái in thường (a-z)
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-600 font-medium" : "text-zinc-500"}`}>
                      {hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-zinc-400" />} Chữ số (0-9)
                    </span>
                    <span className={`flex items-center gap-1.5 col-span-1 sm:col-span-2 ${hasSpecial ? "text-emerald-600 font-medium" : "text-zinc-500"}`}>
                      {hasSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-zinc-400" />} Ký tự đặc biệt (@#$%^&+=!._*~-)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700">Nhập lại mật khẩu</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className={`mt-1 appearance-none relative block w-full px-3 py-2.5 pr-10 border rounded-md placeholder-zinc-400 focus:outline-none focus:ring-1 sm:text-sm ${
                    confirmPassword && password !== confirmPassword
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
                  }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-500">Mật khẩu không khớp</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Mật khẩu khớp
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-black hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Đăng Ký"}
            </button>
          </div>

          <p className="mt-2 text-center text-sm text-zinc-600">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-medium text-black hover:underline">Đăng nhập</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
