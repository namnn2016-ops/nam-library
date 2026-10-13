import { useState, useEffect } from 'react';
import { HardDrive, FolderOpen, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import type { DriveInfo, StorageConfig } from '../types/electron';

interface StorageSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (path: string) => void;
}

export default function StorageSetupModal({
  isOpen,
  onClose,
  onSaved,
}: StorageSetupModalProps) {
  const [drives, setDrives] = useState<DriveInfo[]>([]);
  const [selectedDir, setSelectedDir] = useState<string>('');
  const [activeConfig, setActiveConfig] = useState<StorageConfig | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadConfig = async () => {
      if (window.electronAPI) {
        try {
          const config = await window.electronAPI.getStorageConfig();
          setActiveConfig(config);
          setSelectedDir(config.dataDir);

          const available = await window.electronAPI.getAvailableDrives();
          setDrives(available || []);
        } catch (err) {
          console.error('Lỗi tải cấu hình ổ đĩa:', err);
        }
      }
    };

    loadConfig();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectCustomFolder = async () => {
    if (!window.electronAPI) return;
    try {
      const res = await window.electronAPI.selectDirectory();
      if (res && res.dataDir) {
        setSelectedDir(res.dataDir);
        onSaved(res.dataDir);
        onClose();
      }
    } catch (err) {
      console.error('Lỗi chọn thư mục:', err);
    }
  };

  const handleConfirmDrive = async (dirPath: string) => {
    if (!window.electronAPI) {
      onSaved(dirPath);
      onClose();
      return;
    }
    setLoading(true);
    try {
      await window.electronAPI.setStorageDirectory(dirPath);
      onSaved(dirPath);
      onClose();
    } catch (err) {
      console.error('Lỗi lưu thư mục lưu trữ:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-2xl border border-slate-200 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cài đặt lưu trữ cục bộ</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Chọn Ổ Đĩa Lưu Trữ Dữ Liệu
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Dữ liệu thư viện và các tài khoản được lưu trữ trực tiếp trên máy tính của bạn (không dùng Neon Cloud). Vui lòng chọn ổ đĩa để bắt đầu:
          </p>
        </div>

        {/* Drives List */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Các ổ đĩa khả dụng trên máy:
          </label>

          <div className="space-y-2">
            {drives.length > 0 ? (
              drives.map((d) => {
                const isSelected = selectedDir.startsWith(d.letter);
                return (
                  <button
                    key={d.letter}
                    type="button"
                    onClick={() => setSelectedDir(d.path)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-700'
                        }`}
                      >
                        <HardDrive className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>{d.label}</span>
                          {d.letter === 'D:' && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                              Khuyên dùng
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[260px]">
                          {d.path}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
                Đang sử dụng thư mục mặc định: <code className="font-mono">{selectedDir}</code>
              </div>
            )}
          </div>
        </div>

        {/* Custom Folder Option */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleSelectCustomFolder}
            className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-dashed border-slate-300 hover:border-indigo-500 text-slate-600 hover:text-indigo-600 bg-white text-xs font-bold transition-colors cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-indigo-600" />
            <span>Duyệt chọn thư mục tùy ý khác trên máy tính...</span>
          </button>
        </div>

        {/* Security badge */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Mỗi tài khoản đăng nhập sẽ có thư mục cơ sở dữ liệu SQLite độc lập bên trong ổ đĩa này.
          </span>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {activeConfig?.isConfigured && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
            >
              Để sau
            </button>
          )}

          <button
            type="button"
            disabled={loading || !selectedDir}
            onClick={() => handleConfirmDrive(selectedDir)}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : 'Xác nhận ổ đĩa lưu trữ'}
          </button>
        </div>
      </div>
    </div>
  );
}
