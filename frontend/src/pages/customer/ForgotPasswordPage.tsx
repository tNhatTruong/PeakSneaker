import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-sm border border-zinc-100">
        <div className="text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight text-zinc-900">Quên Mật Khẩu</h2>
          <p className="mt-2 text-sm text-zinc-500">Nhập email để nhận liên kết đặt lại mật khẩu</p>
        </div>
        
        <form className="mt-8 space-y-6" action="#" method="POST">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700">Email của bạn</label>
            <input id="email" name="email" type="email" required className="mt-1 appearance-none relative block w-full px-3 py-2.5 border border-zinc-300 rounded-md placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm" placeholder="Nhập địa chỉ email" />
          </div>

          <div>
            <button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-black hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 uppercase tracking-widest transition-colors">
              Gửi Liên Kết
            </button>
          </div>
          
          <p className="mt-4 text-center text-sm text-zinc-600">
            Nhớ mật khẩu?{' '}
            <Link to="/login" className="font-medium text-black hover:underline">Quay lại Đăng nhập</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
