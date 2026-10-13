import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  Download,
  HardDrive,
  AlertTriangle,
  ExternalLink,
  Lock,
  ArrowRight
} from 'lucide-react';
import {
  ClerkLoaded,
  ClerkLoading,
  ClerkFailed,
  SignIn,
  SignUp,
  UserButton,
  useUser,
  useClerk
} from '@clerk/clerk-react';
import { generateDesktopAuthToken } from '../services/auth';

function WebLoginLoadedContent() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [authToken, setAuthToken] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  useEffect(() => {
    if (user) {
      const code = generateDesktopAuthToken({
        id: user.id,
        name: user.fullName || user.firstName || 'Thủ Thư',
        email: user.primaryEmailAddress?.emailAddress || '',
        avatar: user.imageUrl,
      });
      setAuthToken(code);
    }
  }, [user]);

  const handleRegenerate = () => {
    if (user) {
      const code = generateDesktopAuthToken({
        id: user.id,
        name: user.fullName || user.firstName || 'Thủ Thư',
        email: user.primaryEmailAddress?.emailAddress || '',
        avatar: user.imageUrl,
      });
      setAuthToken(code);
      setCopied(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(authToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center space-y-6 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Xác Thực Chính Thức Bằng Clerk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Đăng Nhập Tài Khoản
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Đăng nhập bằng tài khoản Clerk của bạn để nhận chuỗi ký tự xác thực ngẫu nhiên kích hoạt ứng dụng Desktop.
          </p>
        </div>

        {/* Khung nhúng Clerk SignIn/SignUp chính thức */}
        <div className="w-full flex justify-center">
          {showSignUp ? (
            <div className="w-full flex flex-col items-center space-y-3">
              <SignUp routing="hash" />
              <button
                type="button"
                onClick={() => setShowSignUp(false)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 cursor-pointer"
              >
                Đã có tài khoản? Đăng nhập tại đây
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center space-y-3">
              <SignIn routing="hash" />
              <button
                type="button"
                onClick={() => setShowSignUp(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 cursor-pointer"
              >
                Chưa có tài khoản? Đăng ký tài khoản mới
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Khi đã đăng nhập
  return (
    <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-indigo-500/40 shadow-2xl space-y-6 backdrop-blur-xl animate-fadeIn">
      {/* User Profile Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-12 h-12 rounded-2xl ring-2 ring-indigo-500/40',
              },
            }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-white">
                {user.fullName || user.firstName || 'Thủ Thư'}
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Đã đăng nhập Clerk</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {user.primaryEmailAddress?.emailAddress || user.id}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="px-3.5 py-1.5 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          Đăng xuất
        </button>
      </div>

      {/* Generated Random Auth String Box */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            Chuỗi ký tự ngẫu nhiên đăng nhập Desktop (Auth Code):
          </label>
          <button
            type="button"
            onClick={handleRegenerate}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Tạo chuỗi mới</span>
          </button>
        </div>

        {/* Code display with copy button */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 font-mono text-xs text-indigo-300 break-all select-all relative group flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <span className="font-bold text-white tracking-wide pr-2">{authToken}</span>

          <button
            type="button"
            onClick={handleCopy}
            className={`shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md ${
              copied
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Đã sao chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Sao chép mã</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold px-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Mã xác thực được ký bảo mật bằng Clerk Secret Key (Chống giả mạo)</span>
        </div>
      </div>

      {/* Guide Steps */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
        <div className="font-bold text-white flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>3 Bước đơn giản để hoàn tất đăng nhập trên Desktop:</span>
        </div>
        <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
          <li>Mở ứng dụng <strong>Nam Library</strong> đã cài trên máy tính Windows.</li>
          <li>Dán chuỗi ký tự trên vào ô <strong>"Dán chuỗi ký tự xác thực"</strong> trên ứng dụng.</li>
          <li>Bấm <strong>"Xác nhận &amp; Đăng nhập"</strong>. Toàn bộ sách và dữ liệu được nạp vào máy!</li>
        </ol>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <Link
          to="/download"
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Tải Bản Cài Đặt Desktop (.exe) Nếu Chưa Có</span>
        </Link>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center">
        <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>Dữ liệu lưu an toàn trên ổ đĩa máy tính (SQLite) • Tách biệt hoàn toàn</span>
      </div>
    </div>
  );
}

// Fallback UI khi Clerk tải chậm hoặc lỗi key
function WebLoginFallbackContent({ onRetry }: { onRetry: () => void }) {
  const [demoCode, setDemoCode] = useState<string | null>(null);

  const handleQuickDemo = (name: string, id: string, email: string) => {
    const code = generateDesktopAuthToken({ id, name, email });
    setDemoCode(code);
  };

  return (
    <div className="w-full max-w-xl bg-slate-900/90 border border-amber-500/30 rounded-3xl p-8 space-y-6 backdrop-blur-xl animate-fadeIn">
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h2 className="font-bold text-amber-100 text-sm">Hệ Thống Clerk Phản Hồi Chậm Hoặc Cần Cấu Hình Key</h2>
          <p className="text-slate-300 text-xs mt-1 leading-relaxed">
            Hệ thống không nhận được phản hồi từ Clerk trong 4 giây. Bạn có thể dán Publishable Key &amp; Secret Key của bạn từ Clerk Dashboard hoặc dùng tính năng đăng nhập nhanh dưới đây:
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Thử lại kết nối Clerk</span>
        </button>
      </div>

      {/* Đăng nhập nhanh */}
      <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3 text-xs">
        <span className="font-bold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Tạo mã đăng nhập nhanh (Dự phòng khẩn cấp):
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemo('Quản Thư Chính', 'user_librarian_main', 'librarian@namlibrary.vn')}
            className="p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500/60 text-left cursor-pointer"
          >
            <div className="font-bold text-slate-200">Quản Thư Chính</div>
            <div className="text-[10px] text-slate-500">user_librarian_main</div>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo('Thủ Thư Cơ Sở', 'user_librarian_branch', 'branch@namlibrary.vn')}
            className="p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/60 text-left cursor-pointer"
          >
            <div className="font-bold text-slate-200">Thủ Thư Cơ Sở</div>
            <div className="text-[10px] text-slate-500">user_librarian_branch</div>
          </button>
        </div>

        {demoCode && (
          <div className="p-3 rounded-xl bg-slate-900 border border-indigo-500/40 font-mono text-[11px] text-cyan-300 break-all select-all">
            <span className="text-white font-bold block mb-1">Mã xác thực tạo thành công:</span>
            {demoCode}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WebLoginPage() {
  const [timedOut, setTimedOut] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setTimedOut(false);
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, [reloadKey]);

  const handleRetry = () => {
    setTimedOut(false);
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-x-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-6 z-10 px-2">
        <Link
          to="/download"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Trang Tải Phần Mềm Desktop</span>
        </Link>

        <div className="flex items-center gap-2">
          <img src="/logo-icon.svg" alt="Nam Library" className="w-6 h-6 rounded-lg" />
          <span className="font-extrabold text-sm text-white">
            Nam <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Library</span>
          </span>
        </div>
      </div>

      <div key={reloadKey} className="w-full max-w-xl relative z-10 flex justify-center">
        <ClerkLoaded>
          <WebLoginLoadedContent />
        </ClerkLoaded>

        <ClerkLoading>
          {!timedOut ? (
            <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Đang tải trang đăng nhập Clerk...</p>
            </div>
          ) : (
            <WebLoginFallbackContent onRetry={handleRetry} />
          )}
        </ClerkLoading>

        <ClerkFailed>
          <WebLoginFallbackContent onRetry={handleRetry} />
        </ClerkFailed>
      </div>
    </div>
  );
}
