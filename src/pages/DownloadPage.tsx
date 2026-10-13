import { useState } from 'react';
import {
  Download,
  Sparkles,
  ShieldCheck,
  Zap,
  BarChart3,
  CheckCircle2,
  Cpu,
  HardDrive,
  Monitor,
  Barcode,
  Volume2,
  Mail,
  HelpCircle,
  Check,
  Copy,
  KeyRound
} from 'lucide-react';
import ClerkAuthSection from '../components/ClerkAuthSection';

// =========================================================================
// CẤU HÌNH CÁC ĐƯỜNG DẪN TẢI XUỐNG VÀ DỰ PHÒNG CHO NAM LIBRARY
// Bạn có thể chỉnh sửa link trực tiếp ở đây hoặc cấu hình qua biến môi trường (.env / Vercel):
// =========================================================================
const rawExeUrl = import.meta.env.VITE_DOWNLOAD_EXE_URL || '';
const gDriveUrl =
  import.meta.env.VITE_DOWNLOAD_GDRIVE_URL ||
  'https://drive.google.com/file/d/1Xk0iEaP2ZKdKSYuWyeNmLsC1XQV3Ll_a/view?usp=sharing';

export const DOWNLOAD_CONFIG = {
  // Luôn luôn trỏ trực tiếp đến link Google Drive để mở ra trang web tải file .exe (~123MB)
  googleDriveUrl: gDriveUrl,
  exeUrl: rawExeUrl.startsWith('http') ? rawExeUrl : gDriveUrl,
  githubReleasesUrl:
    import.meta.env.VITE_DOWNLOAD_GITHUB_URL ||
    'https://github.com/namnn2016-ops/nam-library/releases',
  portableUrl: gDriveUrl,
};

export default function DownloadPage() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'email' | 'analytics' | 'readers'>('scanner');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadStarted, setDownloadStarted] = useState(false);

  const handleDownloadClick = () => {
    setDownloadStarted(true);
    const downloadTarget = DOWNLOAD_CONFIG.googleDriveUrl;
    window.open(downloadTarget, '_blank');
  };

  const copyShortcutText = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Header Navigation */}
      <nav className="relative z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/25 border border-indigo-500/40 p-0.5 bg-slate-900">
              <img src="/logo-icon.svg" alt="Nam Library Logo" className="w-full h-full object-cover rounded-xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Nam <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Library</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v1.0.0 Windows
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Hệ Thống Quản Lý Thư Viện Thông Minh
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#auth-section" className="hover:text-cyan-400 transition-colors font-bold text-indigo-300">Đăng Nhập Clerk</a>
            <a href="#features" className="hover:text-indigo-400 transition-colors">Tính năng</a>
            <a href="#installation" className="hover:text-indigo-400 transition-colors">Cài đặt</a>
            <a href="#shortcuts" className="hover:text-indigo-400 transition-colors">Phím tắt</a>
            <a href="#specs" className="hover:text-indigo-400 transition-colors">Cấu hình</a>
            <a href="#faq" className="hover:text-indigo-400 transition-colors">FAQ</a>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <a
              href="#auth-section"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all shadow-xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>Đăng Nhập / Lấy Mã Desktop</span>
            </a>

            <a
              href={DOWNLOAD_CONFIG.googleDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải EXE (Google Drive)</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline & Download CTA */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 text-xs font-medium text-indigo-300 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>Phiên bản v1.0.0 chính thức cho hệ điều hành Windows</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Quản Lý Thư Viện{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                Tốc Độ Cao
              </span>{' '}
              &amp; Trực Quan Nhất
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Phần mềm máy tính Windows được xây dựng với công nghệ hiện đại. Tối ưu hoàn hảo cho máy quét mã vạch qua phím tắt <span className="font-mono text-cyan-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">F6</span> / <span className="font-mono text-rose-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">F9</span>, hệ thống phát âm thanh thông minh, tự động gửi email nhắc hạn qua <span className="text-indigo-300 font-semibold">Resend API</span> và lưu trữ dữ liệu cục bộ riêng biệt cho từng tài khoản trên ổ đĩa máy tính (SQLite).
            </p>

            {/* Download CTA Card */}
            <div id="download-section" className="p-6 rounded-3xl bg-slate-900/90 border border-indigo-500/30 shadow-2xl shadow-indigo-950/50 space-y-4 backdrop-blur-xl">
              {downloadStarted && (
                <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-pulse" />
                    <span>
                      <strong className="text-white">Đang mở trang tải xuống Google Drive:</strong> Tab Google Drive đang được mở. Hãy nhấn nút <strong>"Tải xuống"</strong> (hoặc Download) trên Google Drive để tải file <code>nam-libary-Setup-1.0.0.exe (~123MB)</code> về máy!
                    </span>
                  </div>
                  <button
                    onClick={() => setDownloadStarted(false)}
                    className="text-emerald-400 hover:text-emerald-200 font-bold px-2 py-1 rounded bg-emerald-900/50 hover:bg-emerald-800/50 transition-colors shrink-0 cursor-pointer"
                  >
                    Đã hiểu
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Main Download Button: Direct Link to Google Drive */}
                <a
                  href={DOWNLOAD_CONFIG.googleDriveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setDownloadStarted(true)}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-3.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-base shadow-xl shadow-indigo-600/35 hover:shadow-cyan-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-decoration-none"
                >
                  <Download className="w-5 h-5 animate-bounce shrink-0" />
                  <div className="text-left">
                    <div className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">Tải về miễn phí</div>
                    <div className="text-base">Mở Trang Tải Google Drive (.exe)</div>
                  </div>
                </a>

                {/* Web Auth Link Button */}
                <a
                  href="#auth-section"
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700/80 text-white font-bold text-sm border border-slate-700 transition-all hover:-translate-y-0.5"
                >
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  <span>Đăng Nhập Lấy Mã Desktop</span>
                </a>
              </div>

              {/* Download Meta Information */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>100% Sạch &amp; An Toàn (Đã kiểm duyệt)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  <span>Windows 10 / 11 (64-bit)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-indigo-400" />
                  <span>Dung lượng: ~123 MB</span>
                </span>
              </div>
            </div>

            {/* Quick mirror links */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
              <span className="font-semibold text-slate-400">Các đường dẫn dự phòng:</span>
              <a
                href={DOWNLOAD_CONFIG.googleDriveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 underline underline-offset-4 flex items-center gap-1 text-emerald-300 font-semibold"
              >
                Google Drive Mirror (.exe)
              </a>
              <span>•</span>
              <a
                href={DOWNLOAD_CONFIG.githubReleasesUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-indigo-400 underline underline-offset-4 flex items-center gap-1"
              >
                GitHub Releases
              </a>
            </div>
          </div>

          {/* Right Column: 3D Logo / Interactive App Mockup */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Ambient Back Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-cyan-500/20 to-violet-500/20 rounded-3xl blur-2xl -z-10" />

            {/* App Preview Container */}
            <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl shadow-indigo-950/80 overflow-hidden transform transition-transform hover:scale-[1.01]">
              {/* Window Title Bar */}
              <div className="h-9 bg-slate-950/90 border-b border-slate-800/80 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <img src="/logo-icon.svg" alt="" className="w-3.5 h-3.5" />
                  <span>nam-libary v1.0.0.exe</span>
                </div>
                <div className="w-12" />
              </div>

              {/* 3D Visual Graphic Hero */}
              <div className="relative aspect-square max-h-[340px] bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center p-6 overflow-hidden">
                <img
                  src="/logo-3d.jpg"
                  alt="Nam Library 3D Logo"
                  className="w-full h-full object-contain rounded-2xl drop-shadow-[0_20px_35px_rgba(79,70,229,0.35)]"
                />

                {/* Floating Micro-Badges */}
                <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md border border-indigo-500/30 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-bold text-slate-200">Phím tắt F6/F9 Siêu Tốc</span>
                </div>

                <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-md border border-emerald-500/30 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-bold text-slate-200">Lưu Trữ Ổ Đĩa Cục Bộ</span>
                </div>
              </div>

              {/* Preview Footer Details */}
              <div className="p-4 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-300 font-medium">Sẵn sàng vận hành</span>
                </div>
                <span className="font-mono text-indigo-400">Electron 44 + React 19</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clerk Authentication & Desktop Auth Code Generation Section */}
      <section id="auth-section" className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative z-10">
        <ClerkAuthSection />
      </section>

      {/* Feature Showcase Tabs Section */}
      <section id="features" className="py-20 border-t border-slate-800/80 bg-slate-900/40 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Công Nghệ &amp; Trải Nghiệm Người Dùng</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Tính Năng Độc Quyền Thiết Kế Cho Quản Thư
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Không rườm rà, loại bỏ các bước thao tác thừa, tối đa hóa năng suất phục vụ bạn đọc tại quầy.
            </p>
          </div>

          {/* Feature Tabs Selector */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {[
              { id: 'scanner', label: 'Quầy Mượn Trả Siêu Tốc (F6/F9)', icon: Barcode },
              { id: 'email', label: 'Tự Động Gửi Email Nhắc Hạn', icon: Mail },
              { id: 'analytics', label: 'Biểu Đồ Thống Kê 6 Tháng', icon: BarChart3 },
              { id: 'readers', label: 'Tự Xóa Độc Giả Hết Hạn', icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Content Card */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 sm:p-10 shadow-2xl">
            {activeTab === 'scanner' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Barcode className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Quầy Mượn Trả Tự Động Hóa 100%</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Chỉ với <strong>MỘT ô nhập mã duy nhất</strong>: Quét mã bạn đọc để nạp hồ sơ, sau đó quét mã sách để cho mượn. Nếu quét mã của một cuốn sách đang được mượn, hệ thống tự động nhận diện đây là hành vi hoàn trả sách và giải phóng kho ngay tức khắc.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Phím tắt <strong>F6</strong>: Focus ngay lập tức vào ô quét mã mà không cần chạm chuột.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Phím tắt <strong>F9</strong>: Xóa sạch thông tin đang hiển thị và đưa quầy về trạng thái sẵn sàng.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Hỗ trợ nút Gia hạn sách (Renew) với popup chọn từng cuốn hoặc tất cả sách.</span>
                    </li>
                  </ul>
                </div>
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
                    <span className="font-semibold text-slate-200">Mô phỏng thao tác nhanh</span>
                    <span className="font-mono text-cyan-400">Khảo sát 0.05s</span>
                  </div>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">1. Nhập mã bạn đọc:</span>
                      <span className="text-indigo-400 font-bold">RD1001 [Enter]</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">2. Nhập mã sách cần mượn:</span>
                      <span className="text-emerald-400 font-bold">BK-TECH-01 [Enter]</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span>Phát âm thanh Tít ngắn (880Hz) - Thành công!</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Tự Động Gửi Email Nhắc Nhở Thông Minh</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Tích hợp dịch vụ email chuyên nghiệp qua <strong>Resend API</strong>. Ứng dụng tự động chạy nền định kỳ mỗi 2 phút, quét toàn bộ danh sách mượn sách và tự động gửi email thông báo cho bạn đọc khi sách sắp đến hạn (&le; 2 ngày) hoặc khi đã quá hạn.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Cơ chế chống spam thông minh: Giới hạn tối đa 1 email/ngày cho mỗi bạn đọc.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Tự động cập nhật lịch sử gửi vào cơ sở dữ liệu để kiểm soát chặt chẽ.</span>
                    </li>
                  </ul>
                </div>
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3 font-sans text-xs">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Người gửi:</span>
                      <span className="font-mono text-slate-200">onboarding@resend.dev</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Tiêu đề:</span>
                      <span className="font-semibold text-amber-300">⚠️ [Nam Library] Sách của bạn sắp đến hạn trả!</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 text-slate-300 text-[11px] leading-relaxed border border-slate-800/60">
                      Xin chào Nguyễn Văn A, cuốn sách "Lập Trình Web Hiện Đại" sẽ đến hạn trả vào ngày mai. Vui lòng mang sách tới quầy để trả hoặc gia hạn nhé!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Biểu Đồ Trực Quan &amp; Báo Cáo Thời Gian Thực</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Không cần bấm nút xuất Excel thủ công, trang Dashboard tự động tính toán tổng số sách đang mượn, sách sẵn có trong kho, tổng số bạn đọc và danh sách các bạn đọc đang quá hạn kèm số ngày trễ cụ thể.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Biểu đồ Area Chart biểu diễn xu hướng mượn và trả sách trong 6 tháng gần nhất.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Thẻ cảnh báo danh sách bạn đọc quá hạn nổi bật với nút gửi email nhắc nhở tức thì.</span>
                    </li>
                  </ul>
                </div>
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-2xl font-extrabold text-indigo-400">100%</div>
                      <div className="text-[11px] text-slate-400 mt-1">Dữ liệu thời gian thực</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-2xl font-extrabold text-emerald-400">6 Tháng</div>
                      <div className="text-[11px] text-slate-400 mt-1">Lịch sử tăng trưởng</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'readers' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Tự Động Quét &amp; Xóa Thẻ Hết Hạn</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Theo đúng yêu cầu quản trị thư viện, hệ thống tích hợp quy trình quét tự động dọn dẹp các thẻ bạn đọc đã hết hạn theo ngày hiện tại, đảm bảo danh bạ bạn đọc luôn tinh gọn và chính xác mà không làm phiền thủ thư.
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Hỗ trợ thẻ Không thời hạn (bỏ trống ngày hết hạn) hoặc có thời hạn linh hoạt.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Bảo vệ toàn vẹn: Không cho phép xóa độc giả đang giữ sách chưa hoàn trả.</span>
                    </li>
                  </ul>
                </div>
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3 font-mono text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Quét hạn thẻ:</span>
                    <span className="text-emerald-400 font-bold">Hàng ngày / Mỗi lần tải</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Thẻ vô thời hạn:</span>
                    <span className="text-indigo-400 font-bold">Giữ vĩnh viễn</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3-Step Installation Guide */}
      <section id="installation" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Download className="w-4 h-4" />
            <span>Chỉ 3 Bước Đơn Giản</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Hướng Dẫn Cài Đặt Trong 30 Giây
          </h2>
          <p className="text-slate-400 text-sm">
            Không cần cài đặt thêm phần mềm phụ trợ, không cần kiến thức lập trình phức tạp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 relative space-y-4 hover:border-indigo-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-extrabold text-xl flex items-center justify-center">
              1
            </div>
            <h3 className="text-lg font-bold text-white">Tải Bộ Cài Đặt .EXE</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nhấp vào nút tải phía trên để mở Google Drive và tải bản Setup (.exe ~123MB) về thư mục Downloads của máy tính.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 relative space-y-4 hover:border-cyan-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-extrabold text-xl flex items-center justify-center">
              2
            </div>
            <h3 className="text-lg font-bold text-white">Chạy File Cài Đặt</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nhấp đúp chuột vào file <code>nam-libary-Setup-1.0.0.exe</code>. Trình cài đặt tự động tạo biểu tượng ngoài Desktop và Menu Start.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 relative space-y-4 hover:border-emerald-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-xl flex items-center justify-center">
              3
            </div>
            <h3 className="text-lg font-bold text-white">Mở Ứng Dụng &amp; Vận Hành</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Phần mềm mở trực tiếp vào hệ thống quản lý, không yêu cầu mã PIN cản trở. Nhấn <kbd className="font-mono text-cyan-400">F6</kbd> và bắt đầu quét mã!
            </p>
          </div>
        </div>
      </section>

      {/* Keyboard Shortcuts Cheat Sheet */}
      <section id="shortcuts" className="py-16 border-t border-slate-800/80 bg-slate-900/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Bảng Phím Tắt Thao Tác Nhanh
            </h2>
            <p className="text-xs text-slate-400">
              Được tối ưu để quản thư không cần rời tay khỏi bàn phím và máy quét barcode
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'F6', label: 'Vào ô quét mã', desc: 'Focus tức thì vào ô nhập mã mượn/trả', color: 'border-indigo-500/50 text-indigo-400' },
              { key: 'F9', label: 'Làm mới / Reset', desc: 'Xóa thông tin bạn đọc và đưa quầy về ban đầu', color: 'border-rose-500/50 text-rose-400' },
              { key: 'Enter', label: 'Xác nhận mã', desc: 'Tự động kích hoạt khi quét bằng súng quét mã', color: 'border-cyan-500/50 text-cyan-400' },
              { key: 'Esc', label: 'Đóng Popup Modal', desc: 'Thoát nhanh các cửa sổ gia hạn và thêm mới', color: 'border-amber-500/50 text-amber-400' },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => copyShortcutText(s.key)}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2 hover:border-slate-700 transition-all cursor-pointer group relative"
                title={`Nhấp để sao chép phím ${s.key}`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <kbd className={`px-3 py-1.5 rounded-lg bg-slate-950 border font-mono text-base font-extrabold shadow-sm ${s.color}`}>
                    {s.key}
                  </kbd>
                  <span className="text-slate-500 group-hover:text-slate-300 transition-colors">
                    {copiedKey === s.key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />}
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-200">{s.label}</div>
                <div className="text-[11px] text-slate-400">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* System Specifications */}
      <section id="specs" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Yêu Cầu Cấu Hình Hệ Thống
          </h2>
          <p className="text-xs text-slate-400">
            Ứng dụng siêu nhẹ, tương thích với hầu hết các máy tính văn phòng và trường học
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-4">
            <Monitor className="w-8 h-8 text-indigo-400 shrink-0" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-200">Hệ Điều Hành</h3>
              <p className="text-xs text-slate-400">Windows 10, Windows 11 (phiên bản 64-bit)</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-4">
            <Cpu className="w-8 h-8 text-cyan-400 shrink-0" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-200">Bộ Xử Lý &amp; RAM</h3>
              <p className="text-xs text-slate-400">CPU Intel Core i3 hoặc tương đương, RAM 2GB+ (khuyên dùng 4GB)</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-4">
            <HardDrive className="w-8 h-8 text-emerald-400 shrink-0" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-200">Dung Lượng Đĩa</h3>
              <p className="text-xs text-slate-400">Tối thiểu 150MB dung lượng trống để cài đặt</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 border-t border-slate-800/80 bg-slate-900/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Câu Hỏi Thường Gặp (FAQ)
            </h2>
            <p className="text-xs text-slate-400">Giải đáp các thắc mắc về cài đặt và vận hành phần mềm</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                Phần mềm có cần kết nối Internet không?
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Ứng dụng có thể chạy ngoại tuyến (offline) hoàn toàn với cơ sở dữ liệu SQLite lưu trực tiếp trên ổ đĩa máy tính. Chỉ cần kết nối Internet khi bạn muốn gửi email nhắc hạn qua Resend API hoặc đăng nhập tài khoản Clerk.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                Cách kết nối máy quét mã vạch (Barcode Scanner)?
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Mọi loại súng quét mã vạch USB hoặc không dây 2.4GHz/Bluetooth đều hoạt động tự động dạng HID Keyboard. Chỉ cần cắm vào máy tính, mở phần mềm và bấm <kbd className="font-mono text-cyan-400 font-bold">F6</kbd>, sau đó bóp cò quét mã là xong!
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                Dữ liệu thư viện được lưu ở đâu? Mỗi tài khoản có bị lẫn dữ liệu không?
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Dữ liệu được lưu trữ trực tiếp trên ổ đĩa máy tính (như C:\ hoặc D:\NamLibraryData) theo lựa chọn của bạn khi cài đặt. Mỗi tài khoản có cơ sở dữ liệu SQLite hoàn toàn riêng biệt và độc lập, không dùng máy chủ Neon Cloud, đảm bảo dữ liệu riêng tư và an toàn tuyệt đối.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-indigo-500/30">
              <img src="/logo-icon.svg" alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-bold text-slate-200">Nam Library</span>
              <p className="text-[11px] text-slate-500">Phần mềm quản lý thư viện chuyên nghiệp cho Windows</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a href="#auth-section" className="hover:text-indigo-400 transition-colors">Đăng Nhập Clerk</a>
            <a href="#download-section" className="hover:text-cyan-400 transition-colors">Tải File EXE</a>
            <a href="#faq" className="hover:text-slate-300 transition-colors">Trợ Giúp</a>
          </div>

          <div className="text-slate-500 text-[11px]">
            &copy; 2026 Nam Library. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
