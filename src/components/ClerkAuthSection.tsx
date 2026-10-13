import { useState, useEffect } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  HardDrive,
  LogIn,
  UserPlus,
  ShieldCheck
} from 'lucide-react';
import {
  ClerkProvider,
  SignIn,
  SignUp,
  UserButton,
  useUser,
  useClerk
} from '@clerk/clerk-react';
import { generateDesktopAuthToken } from '../services/auth';

// Khóa Publishable Key chính thức của tài khoản Clerk Nam Library
const DEFAULT_CLERK_KEY = 'pk_test_bmFtLWxpYnJhcnkuY2xlcmsuYWNjb3VudHMuZGV2JA';
const CLERK_PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || DEFAULT_CLERK_KEY;

// Component tạo và hiển thị chuỗi ký tự xác thực khi người dùng đã đăng nhập Clerk thành công
function DesktopTokenGenerator({
  userInfo,
  onSignOut,
}: {
  userInfo: { id: string; name: string; email: string; avatar?: string };
  onSignOut?: () => void;
}) {
  const [authToken, setAuthToken] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Tự động sinh mã xác thực ngẫu nhiên từ tài khoản Clerk này
    const code = generateDesktopAuthToken(userInfo);
    setAuthToken(code);
  }, [userInfo]);

  const handleRegenerate = () => {
    const code = generateDesktopAuthToken(userInfo);
    setAuthToken(code);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(authToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-indigo-500/40 shadow-2xl space-y-6">
      {/* Account Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-12 h-12 rounded-2xl ring-2 ring-indigo-500/40',
                },
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-white">{userInfo.name}</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Đã đăng nhập Clerk</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">{userInfo.email || userInfo.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="px-3.5 py-1.5 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      </div>

      {/* Generated Random Auth String Box */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            Chuỗi ký tự ngẫu nhiên đăng nhập Desktop (Auth Code):
          </label>
          <button
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
            onClick={handleCopy}
            className={`shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md ${
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
      </div>

      {/* Guide Steps */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
        <div className="font-bold text-white flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Hướng dẫn hoàn tất đăng nhập trên ứng dụng Desktop:</span>
        </div>
        <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
          <li>
            Mở phần mềm <strong>Nam Library</strong> đã cài đặt trên máy tính Windows.
          </li>
          <li>
            Dán chuỗi ký tự trên vào ô <strong>"Dán chuỗi ký tự xác thực"</strong> trên ứng dụng.
          </li>
          <li>
            Bấm <strong>"Xác nhận &amp; Đăng nhập"</strong>. Toàn bộ sách và dữ liệu của bạn sẽ được lưu riêng biệt trên ổ đĩa máy tính!
          </li>
        </ol>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <HardDrive className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>
          Cơ sở dữ liệu của tài khoản này được tách biệt 100%, lưu trực tiếp trên ổ đĩa máy tính của bạn.
        </span>
      </div>
    </div>
  );
}

// Giao diện chính tích hợp Clerk Login/Register trực tiếp trên Web
function LiveClerkAuthInner() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');

  if (!isLoaded) {
    return (
      <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Đang kết nối hệ thống tài khoản Clerk...</p>
      </div>
    );
  }

  // Khi chưa đăng nhập: Hiển thị trực tiếp form đăng nhập/đăng ký Clerk chính thức
  if (!user) {
    return (
      <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-indigo-500/30 shadow-2xl space-y-8 backdrop-blur-xl">
        <div className="text-center space-y-2 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Xác Thực Chính Thức Bằng Clerk</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Đăng Nhập Tài Khoản Clerk
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Đăng nhập hoặc đăng ký tài khoản trực tiếp qua Clerk để lấy chuỗi ký tự xác thực ngẫu nhiên đăng nhập vào phần mềm máy tính (Desktop Windows).
          </p>
        </div>

        {/* Tab chuyển đổi Đăng Nhập / Đăng Ký */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-2xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setAuthTab('signin')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authTab === 'signin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthTab('signup')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authTab === 'signup'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Đăng Ký Tài Khoản</span>
            </button>
          </div>
        </div>

        {/* Khung nhúng trực tiếp giao diện Clerk chính thức */}
        <div className="flex justify-center">
          <div className="w-full max-w-md flex justify-center">
            {authTab === 'signin' ? (
              <SignIn routing="hash" />
            ) : (
              <SignUp routing="hash" />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Khi đã đăng nhập Clerk thành công: Hiển thị ngay thông tin và mã Desktop
  const userInfo = {
    id: user.id,
    name: user.fullName || user.firstName || 'Thủ Thư',
    email: user.primaryEmailAddress?.emailAddress || '',
    avatar: user.imageUrl,
  };

  return <DesktopTokenGenerator userInfo={userInfo} onSignOut={() => signOut()} />;
}

export default function ClerkAuthSection() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <LiveClerkAuthInner />
    </ClerkProvider>
  );
}
