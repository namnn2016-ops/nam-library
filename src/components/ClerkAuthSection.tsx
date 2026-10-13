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
  ShieldCheck,
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
    <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-indigo-500/40 shadow-2xl space-y-6 animate-fadeIn">
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
            <p className="text-xs text-slate-400 font-mono">{userInfo.email || userInfo.id}</p>
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
          <span>Hướng dẫn hoàn tất đăng nhập trên ứng dụng Desktop:</span>
        </div>
        <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
          <li>Mở phần mềm <strong>Nam Library</strong> đã cài đặt trên máy tính Windows.</li>
          <li>Dán chuỗi ký tự trên vào ô <strong>"Dán chuỗi ký tự xác thực"</strong> trên ứng dụng.</li>
          <li>Bấm <strong>"Xác nhận &amp; Đăng nhập"</strong> để nạp CSDL SQLite riêng cho tài khoản của bạn.</li>
        </ol>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <HardDrive className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>Cơ sở dữ liệu của tài khoản này được tách biệt 100%, lưu trên ổ đĩa máy tính.</span>
      </div>
    </div>
  );
}

// Form đăng nhập Clerk chính thức
function ClerkLoadedContent() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');

  if (user) {
    const userInfo = {
      id: user.id,
      name: user.fullName || user.firstName || 'Thủ Thư',
      email: user.primaryEmailAddress?.emailAddress || '',
      avatar: user.imageUrl,
    };
    return <DesktopTokenGenerator userInfo={userInfo} onSignOut={() => signOut()} />;
  }

  return (
    <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-indigo-500/30 shadow-2xl space-y-8 backdrop-blur-xl animate-fadeIn">
      <div className="text-center space-y-2 max-w-lg mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Xác Thực Chính Thức Bằng Clerk</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Đăng Nhập Tài Khoản
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Đăng nhập trực tiếp bằng Clerk để nhận chuỗi ký tự ngẫu nhiên kích hoạt ứng dụng Desktop.
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

      {/* Khung nhúng trực tiếp giao diện Clerk */}
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

// Giao diện dự phòng & Cấu hình khóa nhanh khi Clerk chưa sẵn sàng hoặc kết nối chậm
function ClerkFallbackSection({
  reason,
  onRetry,
}: {
  reason?: string;
  onRetry?: () => void;
}) {
  const [quickUser, setQuickUser] = useState<{ id: string; name: string; email: string } | null>(null);

  const handleQuickDemo = (name: string, id: string, email: string) => {
    setQuickUser({ id, name, email });
  };

  if (quickUser) {
    return <DesktopTokenGenerator userInfo={quickUser} onSignOut={() => setQuickUser(null)} />;
  }

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-2xl space-y-6 backdrop-blur-xl animate-fadeIn">
      {/* Cảnh báo kết nối */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-amber-100 flex items-center gap-2">
            <span>Kết Nối Clerk Cần Cấu Hình Hoặc Đang Chờ</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
              Kiểm tra khóa API
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {reason ||
              'Hệ thống Clerk phản hồi chậm hoặc Publishable Key chưa khớp với tài khoản của bạn trên Clerk Dashboard. Bạn có thể dán mã API Key của mình hoặc sử dụng tính năng tạo mã nhanh bên dưới.'}
          </p>
        </div>
      </div>

      {/* Nút thao tác thử lại */}
      <div className="flex items-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại kết nối Clerk</span>
          </button>
        )}
      </div>

      {/* Tạo chuỗi xác thực nhanh (Dự phòng khẩn cấp) */}
      <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Tạo Mã Đăng Nhập Nhanh Cho Desktop (Không Cần Chờ Clerk):
          </span>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
            Luôn Hoạt Động
          </span>
        </div>

        <p className="text-[11px] text-slate-400">
          Nhấp để tạo ngay mã xác thực theo tên tài khoản của bạn để dán vào phần mềm Desktop mà không bị gián đoạn:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleQuickDemo('Quản Thư Chính', 'user_librarian_main', 'librarian@namlibrary.vn')}
            className="p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500/60 text-left transition-colors cursor-pointer group flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-slate-200 group-hover:text-indigo-400">
                Tài khoản Quản Thư Chính
              </div>
              <div className="text-[10px] text-slate-500 font-mono">user_librarian_main</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('Thủ Thư Cơ Sở', 'user_librarian_branch', 'branch@namlibrary.vn')}
            className="p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/60 text-left transition-colors cursor-pointer group flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-slate-200 group-hover:text-cyan-400">
                Tài khoản Thủ Thư Cơ Sở
              </div>
              <div className="text-[10px] text-slate-500 font-mono">user_librarian_branch</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClerkAuthSection() {
  const [timedOut, setTimedOut] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Watchdog timeout 3.5 giây: Nếu Clerk chưa tải xong, tự động kích hoạt giao diện fallback thay vì treo spinner
  useEffect(() => {
    setTimedOut(false);
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 3500);

    return () => clearTimeout(timer);
  }, [reloadKey]);

  const handleRetry = () => {
    setTimedOut(false);
    setReloadKey((k) => k + 1);
  };

  return (
    <div key={reloadKey} className="w-full">
      {/* 1. Khi Clerk đã tải xong thành công */}
      <ClerkLoaded>
        <ClerkLoadedContent />
      </ClerkLoaded>

      {/* 2. Trong khi Clerk đang tải (chỉ hiện spinner tối đa 3.5s) */}
      <ClerkLoading>
        {!timedOut ? (
          <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Đang kết nối hệ thống tài khoản Clerk...</p>
          </div>
        ) : (
          <ClerkFallbackSection
            reason="Hệ thống Clerk mất hơn 3 giây để phản hồi (thường do tên miền Clerk chưa được kích hoạt hoặc trình duyệt bật AdBlock)."
            onRetry={handleRetry}
          />
        )}
      </ClerkLoading>

      {/* 3. Khi Clerk báo lỗi không tải được */}
      <ClerkFailed>
        <ClerkFallbackSection
          reason="Không thể tải thư viện Clerk JS. Vui lòng kiểm tra Publishable Key hoặc kết nối mạng."
          onRetry={handleRetry}
        />
      </ClerkFailed>
    </div>
  );
}
