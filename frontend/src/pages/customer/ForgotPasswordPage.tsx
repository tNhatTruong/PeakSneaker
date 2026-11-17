import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, Loader2, Mail, ShieldCheck, RefreshCw, Eye, EyeOff, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { AuthService } from "../../services/authService";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Tiêu chí bảo mật cho mật khẩu mới
  const hasMinLength = newPassword.length >= 8 && newPassword.length <= 72;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[@#$%^&+=!._*~-]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error("Vui lòng nhập địa chỉ email.");
      return;
    }

    setLoading(true);
    try {
      await AuthService.forgotPassword(cleanEmail);
      toast.success("Mã khôi phục đã được gửi vào email của bạn!");
      setStep("reset");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng kiểm tra lại email.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    if (!cleanToken || cleanToken.length !== 6) {
      toast.error("Vui lòng nhập mã xác thực gồm 6 chữ số.");
      return;
    }
    if (!isPasswordValid) {
      toast.error("Mật khẩu mới chưa đáp ứng đầy đủ tiêu chuẩn bảo mật.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      await AuthService.resetPassword({
        email: cleanEmail,
        token: cleanToken,
        newPassword
      });
      toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.");
      navigate("/login");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Mã xác thực không đúng hoặc đã hết hạn.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    setResending(true);
    try {
      await AuthService.forgotPassword(cleanEmail);
      toast.success("Mã khôi phục mới đã được gửi vào email của bạn!");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Không thể gửi lại mã.";
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-zinc-100">
        
        {step === "request" ? (
          <>
            <div className="text-center">
              <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-900 border border-zinc-200">
                <KeyRound className="w-7 h-7" strokeWidth={1.75} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-900">Quên Mật Khẩu</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Nhập địa chỉ email liên kết với tài khoản của bạn để nhận mã khôi phục.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleRequestReset}>
              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Email đăng ký
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-zinc-300 rounded-lg placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 text-sm transition-colors"
                    placeholder="nguyenvan@example.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 uppercase tracking-widest transition-colors disabled:opacity-60 shadow-sm"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang gửi mã...
                    </span>
                  ) : (
                    "Gửi Mã Khôi Phục"
                  )}
                </button>
              </div>

              <div className="pt-2 text-center text-sm text-zinc-600 border-t border-zinc-100">
                <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-zinc-900 hover:underline">
                  <ArrowLeft className="w-4 h-4" /> Quay lại Đăng nhập
                </Link>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600 border border-emerald-100">
                <ShieldCheck className="w-7 h-7" strokeWidth={1.75} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-900">Thiết Lập Mật Khẩu Mới</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Mã xác thực 6 số đã được gửi tới <span className="font-semibold text-zinc-900">{email}</span>. Vui lòng kiểm tra hòm thư của bạn.
              </p>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleResetPassword}>
              <div>
                <label htmlFor="token" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Mã xác thực (6 số)
                </label>
                <input
                  id="token"
                  name="token"
                  type="text"
                  maxLength={6}
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                  className="appearance-none block w-full px-3 py-3 border border-zinc-300 rounded-lg placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 text-center font-mono text-xl tracking-[0.3em] font-bold transition-colors"
                  placeholder="000000"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 pr-10 border border-zinc-300 rounded-lg placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 text-sm transition-colors"
                    placeholder="Nhập mật khẩu mới an toàn"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Checklist độ mạnh mật khẩu */}
                {newPassword.length > 0 && (
                  <div className="mt-2.5 p-3 bg-zinc-50 border border-zinc-200/80 rounded-lg text-xs space-y-1.5">
                    <p className="font-semibold text-zinc-700">Yêu cầu bảo mật mật khẩu mới:</p>
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
                <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 pr-10 border border-zinc-300 rounded-lg placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 text-sm transition-colors"
                    placeholder="Nhập lại mật khẩu mới"
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
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-500">Mật khẩu xác nhận không khớp.</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Mật khẩu khớp
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !isPasswordValid || (confirmPassword !== "" && newPassword !== confirmPassword)}
                  className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 uppercase tracking-widest transition-colors disabled:opacity-60 shadow-sm"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang cập nhật...
                    </span>
                  ) : (
                    "Xác Nhận Đổi Mật Khẩu"
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 text-xs text-zinc-500">
                <button
                  type="button"
                  onClick={() => setStep("request")}
                  className="hover:text-zinc-900 font-semibold underline"
                >
                  Thay đổi email
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending}
                  className="inline-flex items-center gap-1 hover:text-zinc-900 font-semibold disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                  {resending ? "Đang gửi..." : "Gửi lại mã"}
                </button>
              </div>

              <div className="pt-4 text-center text-sm text-zinc-600 border-t border-zinc-100">
                <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-zinc-900 hover:underline">
                  <ArrowLeft className="w-4 h-4" /> Quay lại Đăng nhập
                </Link>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
