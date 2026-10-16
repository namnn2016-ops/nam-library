import { useState } from 'react';
import {
  KeyRound,
  ExternalLink,
  ClipboardPaste,
  ArrowRight,
  Sparkles,
  UserCheck,
  HardDrive
} from 'lucide-react';
import {
  parseDesktopAuthToken,
  setStoredDesktopUser,
  generateDesktopAuthToken,
  verifyTokenWithBackend
} from '../services/auth';
import { useToast } from '../context/ToastContext';
import type { AuthUser } from '../types';

interface DesktopLoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  onOpenStorageModal?: () => void;
}

export default function DesktopLoginPage({ onLoginSuccess, onOpenStorageModal }: DesktopLoginPageProps) {
  const { showToast } = useToast();
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Đường dẫn mở web đăng nhập
  const webAuthUrl =
    import.meta.env.VITE_WEB_AUTH_URL ||
    (typeof window !== 'undefined' && window.location.origin.includes('localhost')
      ? 'http://localhost:5173/#/login'
      : 'https://nam-library.vercel.app/#/login');

  const handleOpenWeb = () => {
    if (window.electronAPI) {
      window.electronAPI.openExternal(webAuthUrl);
    } else {
      window.open(webAuthUrl, '_blank');
    }
    showToast('Đã mở trang xác thực Web trên trình duyệt!', 'info');
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setTokenInput(text.trim());
        showToast('Đã dán mã từ Clipboard!', 'success');
      }
    } catch {
      showToast('Vui lòng cấp quyền truy cập Clipboard hoặc dán thủ công (Ctrl+V)!', 'error');
    }
  };

  const handleVerifyToken = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tokenInput.trim()) {
      showToast('Vui lòng dán chuỗi ký tự xác thực nhận được từ Web!', 'error');
      return;
    }

    setLoading(true);
    try {
      const verifyRes = await verifyTokenWithBackend(tokenInput.trim());
      const user = verifyRes.user || parseDesktopAuthToken(tokenInput.trim());

      if (!user) {
        throw new Error(
          'Chuỗi ký tự xác thực không hợp lệ hoặc đã hết hạn! Vui lòng tạo chuỗi mới trên Web và thử lại.'
        );
      }

      // Khởi tạo CSDL SQLite riêng cho user này nếu đang chạy trên Electron
      if (window.electronAPI) {
        await window.electronAPI.initUserDb(user.id);
      }

      setStoredDesktopUser(user);
      showToast(`Đăng nhập thành công! Chào mừng ${user.name}`, 'success');
      onLoginSuccess(user);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Lỗi xác thực chuỗi đăng nhập!', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Hỗ trợ đăng nhập nhanh tài khoản mẫu để kiểm tra tính năng dữ liệu riêng biệt
  const handleQuickDemoLogin = async (demoName: string, demoId: string, email: string) => {
    const demoToken = generateDesktopAuthToken({
      id: demoId,
      name: demoName,
      email: email,
    });
    setTokenInput(demoToken);

    const user = parseDesktopAuthToken(demoToken);
    if (user) {
      if (window.electronAPI) {
        await window.electronAPI.initUserDb(user.id);
      }
      setStoredDesktopUser(user);
      showToast(`Đăng nhập nhanh thành công với tài khoản ${user.name}!`, 'success');
      onLoginSuccess(user);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 backdrop-blur-xl space-y-8 animate-fadeIn">
        {/* Brand & Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 border border-indigo-500/30 p-1 shadow-lg shadow-indigo-500/20 mx-auto">
            <img src="/logo-icon.svg" alt="Logo" className="w-full h-full object-cover rounded-xl" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Xác thực Clerk • Lưu trữ cục bộ trên máy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Đăng Nhập Nam Library
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Không cần mã PIN. Mỗi tài khoản sở hữu một cơ sở dữ liệu riêng biệt lưu trực tiếp trên ổ đĩa máy tính.
            </p>
          </div>
        </div>

        {/* Step-by-step Login Flow */}
        <div className="space-y-4">
          {/* Step 1: Open Web */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <span className="text-xs font-bold text-slate-200">
                  Đăng nhập hoặc Đăng ký trên Web
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Dùng tài khoản Clerk</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Nhấp vào nút dưới để mở trang đăng nhập trên trình duyệt. Sau khi đăng nhập, hệ thống sẽ cấp một chuỗi ký tự xác thực ngẫu nhiên.
            </p>

            <button
              type="button"
              onClick={handleOpenWeb}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700/90 text-white font-bold text-xs border border-slate-700 hover:border-indigo-500/50 transition-all cursor-pointer shadow-sm"
            >
              <ExternalLink className="w-4 h-4 text-cyan-400" />
              <span>Mở Trình Duyệt Để Đăng Nhập / Đăng Ký (Clerk)</span>
            </button>
          </div>

          {/* Step 2: Paste Auth Token */}
          <form onSubmit={handleVerifyToken} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <span className="text-xs font-bold text-slate-200">
                  Dán chuỗi ký tự xác thực từ Web vào đây
                </span>
              </div>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Dán từ bộ nhớ tạm</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Dán chuỗi ký tự xác thực tại đây (VD: NAM-AUTH...)"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Đang xác thực...' : 'Xác Nhận & Đăng Nhập Vào Máy Tính'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Demo Fast Login for Multi-Account Testing */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              Tài khoản mẫu thử nghiệm (Kiểm tra dữ liệu riêng biệt):
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('Thủ Thư Nam (Cơ sở 1)', 'librarian_nam_01', 'nam@library.vn')}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-left transition-colors cursor-pointer group"
            >
              <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-400">
                Thủ Thư Nam (Kho 1)
              </div>
              <div className="text-[10px] text-slate-500 font-mono">user: librarian_nam_01</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('Quản Thư Lan (Cơ sở 2)', 'librarian_lan_02', 'lan@library.vn')}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-left transition-colors cursor-pointer group"
            >
              <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-400">
                Quản Thư Lan (Kho 2)
              </div>
              <div className="text-[10px] text-slate-500 font-mono">user: librarian_lan_02</div>
            </button>
          </div>
        </div>

        {/* Local Storage Privacy Note & Cloud Sync Tip */}
        <div className="space-y-2 text-center">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Dữ liệu lưu trên máy tính (SQLite). Không sử dụng máy chủ đám mây Neon.</span>
          </div>
          <p className="text-[10px] text-slate-500">
            ☁️ <strong>Đồng bộ đa máy:</strong> Chọn lưu tại thư mục <code>OneDrive</code> hoặc <code>Google Drive</code> để dữ liệu tự động đồng bộ khi sang máy tính khác.
          </p>
          {onOpenStorageModal && (
            <div className="pt-1">
              <button
                type="button"
                onClick={onOpenStorageModal}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1.5 cursor-pointer underline underline-offset-4"
              >
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cài đặt ổ đĩa lưu trữ (OneDrive / Ổ C: / Ổ D:)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
