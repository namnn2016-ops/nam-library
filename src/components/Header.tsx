import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, VolumeX, ShieldCheck, Clock, Download } from 'lucide-react';
import { dbService } from '../services/db';
import { playSuccessBeep } from '../services/audio';

export default function Header() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    let isMounted = true;
    dbService.getSettings().then((settings) => {
      if (isMounted) {
        setSoundEnabled(settings.sound_enabled);
      }
    });

    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('vi-VN', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const toggleSound = async () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    await dbService.saveSettings({ sound_enabled: nextState });
    if (nextState) {
      playSuccessBeep();
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs shrink-0 select-none">
      {/* Left: Global shortcuts pill */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:inline">
          Phím tắt hệ thống:
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700">
            <kbd className="px-1 py-0.5 rounded bg-white font-mono font-bold text-indigo-600 shadow-2xs border border-slate-200 text-[11px]">
              F6
            </kbd>
            <span>Ô quét mã</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700">
            <kbd className="px-1 py-0.5 rounded bg-white font-mono font-bold text-rose-600 shadow-2xs border border-slate-200 text-[11px]">
              F9
            </kbd>
            <span>Xóa / Reset</span>
          </div>
        </div>
      </div>

      {/* Right: Sound toggle & Date/Status */}
      <div className="flex items-center gap-4">
        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="capitalize">{timeStr}</span>
        </div>

        <div className="h-4 w-px bg-slate-200 hidden md:block" />

        {/* Nút Tải bản Windows EXE */}
        <Link
          to="/download"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors"
          title="Tải ứng dụng Nam Library cho Windows (.exe)"
        >
          <Download className="w-3.5 h-3.5 text-indigo-600" />
          <span>Tải bản EXE</span>
        </Link>

        {/* Sound toggle button */}
        <button
          onClick={toggleSound}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            soundEnabled
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
          }`}
          title={soundEnabled ? 'Âm thanh: BẬT (Bấm để tắt)' : 'Âm thanh: TẮT (Bấm để bật)'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span>{soundEnabled ? 'Âm thanh bật' : 'Đã tắt tiếng'}</span>
        </button>

        {/* Database status indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sẵn sàng</span>
        </div>
      </div>
    </header>
  );
}
