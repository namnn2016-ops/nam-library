import { useState, useEffect } from 'react';
import { 
  Volume2, 
  Calendar, 
  Mail, 
  Save, 
  RotateCcw, 
  Sparkles,
  Play,
  Key,
  BellRing,
  HardDrive,
  FolderOpen,
  LogOut,
  UserCheck
} from 'lucide-react';
import { dbService } from '../services/db';
import { playSuccessBeep, playErrorBeep } from '../services/audio';
import { useToast } from '../context/ToastContext';
import { getStoredDesktopUser, logoutDesktopUser } from '../services/auth';
import type { AppSettings, AuthUser } from '../types';
import type { StorageConfig } from '../types/electron';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [storageConfig, setStorageConfig] = useState<StorageConfig | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    sound_enabled: true,
    borrow_days: 14,
    max_books_per_reader: 3,
    auto_email_enabled: true,
  });

  const [saving, setSaving] = useState(false);
  const envApiKey = import.meta.env.VITE_RESEND_API_KEY || '';
  const envFromEmail = import.meta.env.VITE_RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  useEffect(() => {
    const user = getStoredDesktopUser();
    setCurrentUser(user);

    const fetchConfig = async () => {
      try {
        const current = await dbService.getSettings();
        setSettings(current);

        if (window.electronAPI) {
          const sConf = await window.electronAPI.getStorageConfig();
          setStorageConfig(sConf);
        }
      } catch (err) {
        console.error('Lỗi đọc cài đặt:', err);
      }
    };
    fetchConfig();
  }, []);

  const handleSelectFolder = async () => {
    if (!window.electronAPI) {
      showToast('Tính năng chọn thư mục chỉ hoạt động trên ứng dụng Desktop!', 'info');
      return;
    }
    try {
      const res = await window.electronAPI.selectDirectory();
      if (res && res.dataDir) {
        const updated = await window.electronAPI.getStorageConfig();
        setStorageConfig(updated);
        playSuccessBeep();
        showToast(`Đã chuyển thư mục lưu trữ sang: ${res.dataDir}`, 'success');
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Lỗi khi chọn thư mục!', 'error');
    }
  };

  const handleOpenFolder = async () => {
    if (!window.electronAPI) return;
    try {
      await window.electronAPI.openStorageFolder();
    } catch (err) {
      console.error('Lỗi mở thư mục:', err);
    }
  };

  const handleLogout = () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?')) {
      logoutDesktopUser();
      window.location.reload();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dbService.saveSettings(settings);
      playSuccessBeep();
      showToast('Đã lưu thành công các cài đặt hệ thống!', 'success');
    } catch (err: unknown) {
      const error = err as Error;
      playErrorBeep();
      showToast(error.message || 'Lỗi khi lưu cài đặt!', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClearData = async () => {
    if (
      confirm(
        'Bạn có chắc chắn muốn xóa sạch toàn bộ dữ liệu trong thư viện của tài khoản này? Thao tác này sẽ đưa cơ sở dữ liệu trên máy tính về trạng thái trống hoàn toàn.'
      )
    ) {
      try {
        await dbService.clearAllData();
        playSuccessBeep();
        showToast('Đã xóa sạch dữ liệu! Cơ sở dữ liệu hiện ở trạng thái ban đầu.', 'info');
      } catch (err: unknown) {
        const error = err as Error;
        playErrorBeep();
        showToast(error.message || 'Lỗi khi xóa dữ liệu!', 'error');
      }
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
          <Sparkles className="w-4 h-4" />
          Hệ Thống Cấu Hình
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Cài Đặt Hệ Thống
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Quản lý tài khoản, ổ đĩa lưu trữ cục bộ, quy định mượn trả và dịch vụ email
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* KHỐI 0: TÀI KHOẢN ĐANG ĐĂNG NHẬP (CLERK AUTH) */}
        {currentUser && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center shrink-0 overflow-hidden shadow-md shadow-indigo-600/20">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    currentUser.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{currentUser.name}</h2>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Tài khoản cá nhân
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    {currentUser.email || currentUser.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất tài khoản này</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              💡 Mỗi tài khoản đăng nhập sở hữu một cơ sở dữ liệu riêng biệt lưu trên ổ đĩa máy tính. Khi chuyển đổi tài khoản, ứng dụng tự động mở kho dữ liệu của tài khoản đó.
            </p>
          </div>
        )}

        {/* KHỐI 1: Ổ ĐĨA & VỊ TRÍ LƯU TRỮ DỮ LIỆU CỤC BỘ TRÊN MÁY TÍNH */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Ổ Đĩa &amp; Vị Trí Lưu Trữ Dữ Liệu</h2>
                <p className="text-xs text-slate-500">
                  Lưu trữ trên máy tính theo yêu cầu (Không sử dụng Neon Cloud DB)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectFolder}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Đổi ổ đĩa / thư mục</span>
              </button>

              <button
                type="button"
                onClick={handleOpenFolder}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Mở trong Explorer</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Thư mục gốc lưu trữ:</span>
                <span className="font-mono font-bold text-slate-800">
                  {storageConfig?.dataDir || 'D:\\NamLibraryData (Mặc định)'}
                </span>
              </div>
              {storageConfig?.activeDbPath && (
                <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                  <span className="font-semibold text-slate-600">File CSDL SQLite tài khoản này:</span>
                  <span className="font-mono text-cyan-700 truncate max-w-[420px]" title={storageConfig.activeDbPath}>
                    {storageConfig.activeDbPath}
                  </span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              💡 Toàn bộ sách, bạn đọc, lịch sử mượn trả được lưu hoàn toàn trong tệp <code>library.db</code> bên trong thư mục người dùng trên ổ đĩa này, đảm bảo tính bảo mật và độc lập dữ liệu tuyệt đối.
            </p>
          </div>
        </div>

        {/* KHỐI 2: CÀI ĐẶT ÂM THANH THEO PLAN.MD */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Âm Thanh Tín Hiệu (Smart Beep)</h2>
                <p className="text-xs text-slate-500">
                  Phát âm thanh khi quét mã thành công hoặc có lỗi
                </p>
              </div>
            </div>

            {/* Toggle switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.sound_enabled}
                onChange={(e) => setSettings({ ...settings, sound_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
            <span className="text-slate-600 font-medium">Nghe thử âm thanh:</span>
            <button
              type="button"
              onClick={playSuccessBeep}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Tít ngắn (Hợp lệ)</span>
            </button>
            <button
              type="button"
              onClick={playErrorBeep}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-semibold cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Tít dài (Cảnh báo lỗi)</span>
            </button>
          </div>
        </div>

        {/* KHỐI 3: QUY ĐỊNH MƯỢN TRẢ THEO PLAN.MD */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Quy Định Mượn Sách</h2>
              <p className="text-xs text-slate-500">Thời hạn và hạn mức số lượng sách</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Số ngày được mượn sách cho mỗi lần
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.borrow_days}
                  onChange={(e) =>
                    setSettings({ ...settings, borrow_days: parseInt(e.target.value) || 14 })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold outline-none focus:bg-white focus:border-indigo-600"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                  ngày
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Dùng để tính hạn trả tự động và gia hạn (Renew).
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Số sách tối đa mỗi bạn đọc được mượn
              </label>
              <input
                type="number"
                min="0"
                value={settings.max_books_per_reader}
                onChange={(e) =>
                  setSettings({ ...settings, max_books_per_reader: parseInt(e.target.value) || 0 })
                }
                placeholder="0 = Vô hạn"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold outline-none focus:bg-white focus:border-indigo-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                💡 Nhập <strong>0</strong> hoặc để trống nếu cho phép mượn <strong>Vô hạn</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* KHỐI 4: CẤU HÌNH GỬI EMAIL TỰ ĐỘNG & RESEND API */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Dịch Vụ Gửi Email (Resend API)</h2>
                <p className="text-xs text-slate-500">
                  Tự động gửi email khi sách gần quá hạn (&le; 2 ngày) hoặc đã quá hạn
                </p>
              </div>
            </div>

            {/* Auto email switch */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Tự động gửi mail:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.auto_email_enabled ?? true}
                  onChange={(e) => setSettings({ ...settings, auto_email_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-400" />
                  Trạng thái cấu hình Resend API Key:
                </span>
                {envApiKey ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Đã cấu hình trong .env ({envApiKey.substring(0, 5)}***)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Chưa cấu hình API Key trong .env
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-slate-600 border-t border-slate-200/60 pt-2">
                <span>Email người gửi (From Address):</span>
                <span className="font-mono font-semibold text-slate-800">{envFromEmail}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600 border-t border-slate-200/60 pt-2">
                <span className="flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5 text-indigo-500" />
                  Quy trình thông báo tự động:
                </span>
                <span className="text-slate-700 font-medium">
                  Chạy nền định kỳ mỗi 2 phút &amp; gửi tối đa 1 lần/ngày/bạn đọc
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KHỐI 5: XÓA SẠCH DỮ LIỆU CỦA TÀI KHOẢN NÀY */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-slate-500" />
              Xóa Sạch Dữ Liệu Tài Khoản Này
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đưa toàn bộ danh sách sách, bạn đọc và lịch sử mượn trả của tài khoản này về trạng thái trống hoàn toàn trên máy tính
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearData}
            className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs transition-colors shrink-0 cursor-pointer"
          >
            Xóa sạch dữ liệu
          </button>
        </div>

        {/* NÚT LƯU THAY ĐỔI */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Đang lưu...' : 'Lưu Tất Cả Cài Đặt'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
