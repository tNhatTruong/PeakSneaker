import { Link } from "react-router-dom";

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-sm border border-zinc-100">
        <div className="text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight text-zinc-900">Tạo Tài Khoản</h2>
          <p className="mt-2 text-sm text-zinc-500">Tham gia cộng đồng PeakSneaker</p>
        </div>
        
        <form className="mt-8 space-y-6" action="#" method="POST">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700">Họ và Tên</label>
              <input id="name" name="name" type="text" required className="mt-1 appearance-none relative block w-full px-3 py-2.5 border border-zinc-300 rounded-md placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm" placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700">Email</label>
              <input id="email" name="email" type="email" required className="mt-1 appearance-none relative block w-full px-3 py-2.5 border border-zinc-300 rounded-md placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm" placeholder="Nhập địa chỉ email" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700">Mật khẩu</label>
              <input id="password" name="password" type="password" required className="mt-1 appearance-none relative block w-full px-3 py-2.5 border border-zinc-300 rounded-md placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm" placeholder="Tạo mật khẩu" />
            </div>
          </div>

          <div>
            <button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-black hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 uppercase tracking-widest transition-colors">
              Đăng Ký
            </button>
          </div>
          
          <p className="mt-2 text-center text-sm text-zinc-600">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-medium text-black hover:underline">Đăng nhập</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
