import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-white font-sans">
      <div className="bg-slate-800 p-10 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full text-center">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-6">
          PeakSneaker
        </h1>
        
        <p className="text-slate-300 mb-8 text-lg">
          Frontend React + Vite đã được cấu hình thành công với <span className="font-semibold text-cyan-400">Tailwind CSS v4</span>!
        </p>

        <button
          onClick={() => setCount((count) => count + 1)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50"
        >
          Đếm số: {count}
        </button>

        <div className="mt-8 text-sm text-slate-500">
          Chỉnh sửa <code className="bg-slate-900 px-2 py-1 rounded text-pink-400 font-mono">src/App.tsx</code> để bắt đầu.
        </div>
      </div>
    </div>
  )
}

export default App
