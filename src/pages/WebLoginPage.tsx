import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  LogIn,
  UserPlus
} from 'lucide-react';
import {
  ClerkLoaded,
  ClerkLoading,
  ClerkFailed,
  SignIn,
  SignUp,
  UserButton,
  SignedIn,
  SignedOut,
  useUser,
  useAuth,
  useClerk
} from '@clerk/clerk-react';
import { generateDesktopAuthToken } from '../services/auth';

/**
 * Giao diện khi người dùng đã đăng nhập Clerk thành công (SignedIn)
 * Sử dụng đúng hook chuẩn: useUser(), useAuth(), useClerk()
 */
function SignedInContent() {
  const { user } = useUser();
  const { userId } = useAuth();
  const { signOut } = useClerk();
  const [authToken, setAuthToken] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      const code = generateDesktopAuthToken({
        id: user.id || userId || '',
        name: user.fullName || user.firstName || 'Thủ Thư',
        email: user.primaryEmailAddress?.emailAddress || '',
        avatar: user.imageUrl,
      });
      setAuthToken(code);
    }
  }, [user, userId]);

  const handleRegenerate = () => {
    if (user) {
      const code = generateDesktopAuthToken({
        id: user.id || userId || '',
        name: user.fullName || user.firstName || 'Thủ Thư',
        email: user.primaryEmailAddress?.emailAddress || '',
        avatar: user.imageUrl,
      });
      setAuthToken(code);
      setCopied(false);
    }
  };

  const handleCopy = () => {
    if (!authToken) return;
    navigator.clipboard.writeText(authToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (!user) return null;

  return (
    <div className="w-full max-w-xl p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-indigo-500/40 shadow-2xl space-y-6 backdrop-blur-xl animate-fadeIn">
      {/* Thanh thông tin người dùng với UserButton chuẩn của Clerk */}
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
              {user.primaryEmailAddress?.emailAddress || userId}
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

      {/* Chuỗi ký tự ngẫu nhiên kích hoạt Desktop */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            Chuỗi ký tự ngẫu nhiên đăng nhập Desktop:
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

        {/* Khung hiển thị mã và nút sao chép */}
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
          <span>Mã xác thực được bảo mật và liên kết trực tiếp với tài khoản Clerk của bạn</span>
        </div>
      </div>

      {/* 3 Bước hướng dẫn kích hoạt Desktop */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
        <div className="font-bold text-white flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>3 Bước hoàn tất đăng nhập trên ứng dụng Desktop:</span>
        </div>
        <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
          <li>Mở phần mềm <strong>Nam Library</strong> đã cài trên máy tính Windows.</li>
          <li>Dán chuỗi ký tự trên vào ô <strong>"Dán chuỗi ký tự xác thực"</strong> trên ứng dụng.</li>
          <li>Bấm <strong>"Xác nhận &amp; Đăng nhập"</strong> để mở toàn bộ tính năng quản lý thư viện!</li>
        </ol>
      </div>

      {/* Nút tải Desktop */}
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
        <span>Dữ liệu lưu độc lập trên ổ đĩa máy tính (SQLite) • An toàn tuyệt đối</span>
      </div>
    </div>
  );
}

/**
 * Giao diện khi người dùng chưa đăng nhập (SignedOut)
 * Render đúng component chính thức của Clerk: <SignIn /> hoặc <SignUp />
 */
function SignedOutContent({ defaultMode }: { defaultMode: 'signin' | 'signup' }) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(defaultMode);

  return (
    <div className="w-full flex flex-col items-center space-y-6 animate-fadeIn">
      {/* Tiêu đề & Giới thiệu */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Cổng Xác Thực Chính Thức Clerk</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {authMode === 'signup' ? 'Đăng Ký Tài Khoản Mới' : 'Đăng Nhập Tài Khoản'}
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Sử dụng tài khoản Clerk của bạn để lấy mã ngẫu nhiên đăng nhập phần mềm quản lý thư viện Desktop.
        </p>
      </div>

      {/* Tab chuyển đổi rõ ràng giữa Đăng nhập và Đăng ký */}
      <div className="inline-flex p-1 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          type="button"
          onClick={() => setAuthMode('signin')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            authMode === 'signin'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Đăng Nhập</span>
        </button>
        <button
          type="button"
          onClick={() => setAuthMode('signup')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            authMode === 'signup'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Đăng Ký</span>
        </button>
      </div>

      {/* Khung nhúng Clerk Component chuẩn: SignIn / SignUp */}
      <div className="w-full flex justify-center">
        {authMode === 'signup' ? (
          <SignUp routing="virtual" />
        ) : (
          <SignIn routing="virtual" />
        )}
      </div>
    </div>
  );
}

/**
 * Trang Web Đăng Nhập / Đăng Ký Clerk chính thức
 * Hỗ trợ các route /sign-in, /sign-up, /login, /auth
 */
export default function WebLoginPage() {
  const location = useLocation();
  const isSignUpRoute = location.pathname.includes('/sign-up');

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

      {/* Container nội dung với ClerkLoaded, ClerkLoading, ClerkFailed chuẩn */}
      <div className="w-full max-w-xl relative z-10 flex justify-center">
        <ClerkLoaded>
          <SignedIn>
            <SignedInContent />
          </SignedIn>
          <SignedOut>
            <SignedOutContent defaultMode={isSignUpRoute ? 'signup' : 'signin'} />
          </SignedOut>
        </ClerkLoaded>

        <ClerkLoading>
          <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
            <div className="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-400">Đang khởi tạo hệ thống xác thực Clerk...</p>
          </div>
        </ClerkLoading>

        <ClerkFailed>
          <div className="p-8 rounded-3xl bg-slate-900 border border-rose-500/40 text-center space-y-4 max-w-md">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto font-bold text-lg">
              !
            </div>
            <h3 className="font-bold text-white text-base">Không thể kết nối với Clerk</h3>
            <p className="text-xs text-slate-400">
              Vui lòng kiểm tra lại kết nối mạng hoặc thử tải lại trang.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Tải lại trang
            </button>
          </div>
        </ClerkFailed>
      </div>
    </div>
  );
}
