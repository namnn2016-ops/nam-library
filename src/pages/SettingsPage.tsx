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
  BellRing
} from 'lucide-react';
import { dbService } from '../services/db';
import { playSuccessBeep, playErrorBeep } from '../services/audio';
import { useToast } from '../context/ToastContext';
import type { AppSettings } from '../types';

export default function SettingsPage() {
  const { showToast } = useToast();
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
    const fetchSettings = async () => {
      try {
        const current = await dbService.getSettings();
        setSettings(current);
      } catch (err) {
        console.error('Lỗi đọc cài đặt:', err);
      }
    };
    fetchSettings();
  }, []);

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
        'Bạn có chắc chắn muốn xóa sạch toàn bộ dữ liệu trong thư viện? Thao tác này sẽ đưa cơ sở dữ liệu về trạng thái trống hoàn toàn.'
      )
    ) {
      try {
        await dbService.clearAllData();
        playSuccessBeep();
        showToast('Đã xóa sạch dữ liệu! Hệ thống hiện ở trạng thái ban đầu.', 'info');
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
          Điều chỉnh quy định mượn trả, thông báo âm thanh và dịch vụ tự động gửi email
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* KHỐI 1: CÀI ĐẶT ÂM THANH THEO PLAN.MD */}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-semibold"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Tít ngắn (Hợp lệ)</span>
            </button>
            <button
              type="button"
              onClick={playErrorBeep}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-semibold"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Tít dài (Cảnh báo lỗi)</span>
            </button>
          </div>
        </div>

        {/* KHỐI 2: QUY ĐỊNH MƯỢN TRẢ THEO PLAN.MD */}
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

        {/* KHỐI 3: CẤU HÌNH GỬI EMAIL TỰ ĐỘNG & RESEND API (TỪ FILE .ENV) */}
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
                    Chưa cấu hình API Key trong .env (Chạy chế độ mô phỏng)
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

            <p className="text-[11px] text-slate-400">
              💡 Khóa API Resend được cấu hình bảo mật trực tiếp trong file <code>.env</code> (biến <code>VITE_RESEND_API_KEY</code>) theo đúng yêu cầu bảo mật, không cần nhập lại trên giao diện.
            </p>
          </div>
        </div>

        {/* KHỐI 4: XÓA SẠCH DỮ LIỆU */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-slate-500" />
              Xóa Sạch Dữ Liệu
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đưa toàn bộ danh sách sách, bạn đọc và lịch sử mượn trả về trạng thái trống hoàn toàn trên Neon PostgreSQL
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearData}
            className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs transition-colors shrink-0"
          >
            Xóa sạch dữ liệu
          </button>
        </div>

        {/* NÚT LƯU THAY ĐỔI */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Đang lưu...' : 'Lưu Tất Cả Cài Đặt'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
