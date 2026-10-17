import { Link } from 'react-router-dom';
import { ShieldAlert, Download, Monitor, HardDrive, ArrowLeft } from 'lucide-react';

export default function WebRestrictedPage() {
  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
            Không có bản dùng thử trên Web
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ứng Dụng Yêu Cầu Cài Đặt Desktop
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            Hệ thống quản lý thư viện chỉ hoạt động trên phiên bản máy tính (Windows) để đảm bảo lưu trữ toàn bộ dữ liệu trực tiếp trên ổ đĩa máy tính của bạn, độc lập cho từng tài khoản và không lưu trữ trên máy chủ công cộng.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            <div className="text-xs font-bold text-white">Lưu Trữ Cục Bộ</div>
            <div className="text-[11px] text-slate-400">Chọn ổ C: hoặc D: khi cài đặt</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <Monitor className="w-5 h-5 text-cyan-400" />
            <div className="text-xs font-bold text-white">Phím Tắt F6 / F9 / Enter</div>
            <div className="text-[11px] text-slate-400">Tối ưu quét barcode &amp; xác nhận/lưu</div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Link
            to="/download"
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Tải Bộ Cài Đặt Windows (.EXE) & Đăng Nhập Lấy Mã</span>
          </Link>

          <Link
            to="/download"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Trang Chủ / Trang Đăng Nhập Clerk</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
