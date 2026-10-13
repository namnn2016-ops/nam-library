import { useState, useEffect } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  User,
  LogOut,
  LogIn,
  UserPlus,
  HardDrive
} from 'lucide-react';
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
  useClerk
} from '@clerk/clerk-react';
import { generateDesktopAuthToken } from '../services/auth';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
const hasClerkKey = Boolean(
  CLERK_PUBLISHABLE_KEY &&
  CLERK_PUBLISHABLE_KEY.startsWith('pk_') &&
  !CLERK_PUBLISHABLE_KEY.includes('placeholder')
);

// Giao diện khi người dùng đã đăng nhập thành công qua Clerk (hoặc chế độ mô phỏng)
function DesktopTokenGenerator({
  userInfo,
  onSignOut
}: {
  userInfo: { id: string; name: string; email: string; avatar?: string };
  onSignOut?: () => void;
}) {
  const [authToken, setAuthToken] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Tự động sinh mã xác thực ngẫu nhiên cho tài khoản này
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
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 p-0.5 shrink-0">
            {userInfo.avatar ? (
              <img src={userInfo.avatar} alt={userInfo.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="w-full h-full rounded-xl bg-indigo-600/30 flex items-center justify-center text-indigo-400 font-bold text-lg">
                {userInfo.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-white">{userInfo.name}</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full">
                Đã xác thực Clerk
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
              <LogOut className="w-3.5 h-3.5" />
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
            Mở phần mềm <strong>Nam Library</strong> đã cài trên máy tính Windows.
          </li>
          <li>
            Dán chuỗi ký tự trên vào ô <strong>"Dán chuỗi ký tự xác thực"</strong> trên ứng dụng.
          </li>
          <li>
            Bấm <strong>"Xác nhận &amp; Đăng nhập"</strong>. Toàn bộ dữ liệu của bạn sẽ được lưu riêng biệt trên ổ đĩa máy tính đã chọn!
          </li>
        </ol>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
        <span>
          Cơ sở dữ liệu của tài khoản này được tách biệt 100%, lưu trực tiếp trên ổ đĩa máy tính của bạn.
        </span>
      </div>
    </div>
  );
}

// Khi dùng live ClerkProvider
function LiveClerkAuthInner() {
  const { user } = useUser();
  const { signOut } = useClerk();

  if (!user) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
          <KeyRound className="w-7 h-7" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h3 className="text-xl font-extrabold text-white">Đăng Nhập Tài Khoản Clerk</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Đăng nhập để nhận chuỗi ký tự ngẫu nhiên kích hoạt ứng dụng Desktop. Dữ liệu mỗi tài khoản được lưu riêng biệt trên máy tính của bạn.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer">
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập Với Clerk</span>
            </button>
          </SignInButton>

          <SignUpButton mode="modal">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors cursor-pointer">
              <UserPlus className="w-4 h-4" />
              <span>Đăng Ký Tài Khoản Mới</span>
            </button>
          </SignUpButton>
        </div>
      </div>
    );
  }

  const userInfo = {
    id: user.id,
    name: user.fullName || user.firstName || 'Thủ Thư',
    email: user.primaryEmailAddress?.emailAddress || '',
    avatar: user.imageUrl,
  };

  return <DesktopTokenGenerator userInfo={userInfo} onSignOut={() => signOut()} />;
}

// Chế độ mô phỏng / Offline / Demo khi chưa cấu hình Key Clerk
function SimulatedClerkAuth() {
  const [demoUser, setDemoUser] = useState<{ id: string; name: string; email: string; avatar?: string } | null>(null);
  const [inputName, setInputName] = useState('');
  const [inputEmail, setInputEmail] = useState('');

  const handleSimulatedLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    const generatedId = `user_${Math.random().toString(36).substring(2, 10)}`;
    setDemoUser({
      id: generatedId,
      name: inputName.trim(),
      email: inputEmail.trim() || `${inputName.toLowerCase().replace(/\s+/g, '')}@library.vn`,
    });
  };

  const handleQuickDemo = (name: string, id: string, email: string) => {
    setDemoUser({ id, name, email });
  };

  if (demoUser) {
    return <DesktopTokenGenerator userInfo={demoUser} onSignOut={() => setDemoUser(null)} />;
  }

  return (
    <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
      <div className="text-center space-y-2 max-w-md mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Cổng Đăng Nhập &amp; Cấp Chuỗi Xác Thực Desktop</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-white">
          Đăng Nhập / Đăng Ký Tài Khoản (Clerk)
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Sau khi đăng nhập trên Web, hệ thống sẽ tự động sản sinh chuỗi ký tự ngẫu nhiên để dán vào ứng dụng Desktop.
        </p>
      </div>

      {/* Form đăng nhập */}
      <form onSubmit={handleSimulatedLogin} className="max-w-md mx-auto space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Họ tên thủ thư / Tên tài khoản
          </label>
          <input
            type="text"
            required
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="VD: Nguyễn Văn Nam"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Địa chỉ Email (Không bắt buộc)
          </label>
          <input
            type="email"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            placeholder="VD: nam@thuvien.edu.vn"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          Đăng Nhập &amp; Tạo Chuỗi Xác Thực Desktop
        </button>
      </form>

      {/* Hoặc chọn nhanh mẫu tài khoản */}
      <div className="border-t border-slate-800 pt-4 max-w-md mx-auto space-y-2">
        <span className="text-[11px] font-semibold text-slate-400 block text-center">
          Hoặc nhấp để đăng nhập nhanh mẫu tài khoản:
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemo('Thủ Thư Nam (Kho A)', 'user_nam_kho_a', 'nam@library.vn')}
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-xs font-bold text-slate-200 hover:text-indigo-400 text-center transition-colors cursor-pointer"
          >
            Tài khoản Nam (Kho A)
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo('Quản Thư Lan (Kho B)', 'user_lan_kho_b', 'lan@library.vn')}
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-xs font-bold text-slate-200 hover:text-cyan-400 text-center transition-colors cursor-pointer"
          >
            Tài khoản Lan (Kho B)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClerkAuthSection() {
  if (hasClerkKey) {
    return (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <LiveClerkAuthInner />
      </ClerkProvider>
    );
  }

  return <SimulatedClerkAuth />;
}
