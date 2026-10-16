import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HardDrive, FolderOpen, CheckCircle2, ShieldCheck, Sparkles, Cloud, ArrowRight } from 'lucide-react';
import type { DriveInfo, CloudFolderInfo, StorageConfig } from '../types/electron';

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
  const [cloudFolders, setCloudFolders] = useState<CloudFolderInfo[]>([]);
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

          if (window.electronAPI.getCloudFolders) {
            const clouds = await window.electronAPI.getCloudFolders();
            setCloudFolders(clouds || []);
          }
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full p-7 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold">
            <Cloud className="w-3.5 h-3.5 text-cyan-600" />
            <span>Đồng bộ đa máy tính qua OneDrive / Google Drive</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Chọn Vị Trí Lưu Trữ Dữ Liệu
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Để <strong>không bị mất dữ liệu khi đăng nhập trên máy tính khác</strong>, bạn nên chọn thư mục bên trong <strong>OneDrive</strong> hoặc <strong>Google Drive</strong>. Windows sẽ tự động đồng bộ tệp dữ liệu SQLite khi bạn đăng nhập cùng tài khoản cloud trên máy mới.
          </p>
        </div>

        {/* 1. THƯ MỤC CLOUD SYNC (KHUYÊN DÙNG ĐỂ ĐỒNG BỘ ĐA MÁY) */}
        {cloudFolders.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Khuyên Dùng: Đồng Bộ Đa Máy (OneDrive / Cloud)</span>
              </label>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Tự động đồng bộ
              </span>
            </div>

            <div className="space-y-2">
              {cloudFolders.map((cf) => {
                const isSelected = selectedDir.toLowerCase().startsWith(cf.baseDir.toLowerCase());
                return (
                  <button
                    key={cf.id}
                    type="button"
                    onClick={() => setSelectedDir(cf.path)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 shadow-md ring-1 ring-indigo-500'
                        : 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-white border border-indigo-200 text-indigo-600'
                        }`}
                      >
                        <Cloud className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>{cf.name}</span>
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                            Tự động sync máy khác
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          {cf.description}
                        </p>
                        <div className="text-[11px] text-slate-400 font-mono break-all pt-0.5">
                          {cf.path}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 ml-2 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Ổ ĐĨA CỤC BỘ TRÊN MÁY (CHỈ LƯU MÁY NÀY) */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>Ổ Đĩa Cục Bộ (Chỉ Lưu Trên Máy Tính Này)</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {drives.map((d) => {
              const isSelected = selectedDir.startsWith(d.letter) && !cloudFolders.some((cf) => selectedDir.toLowerCase().startsWith(cf.baseDir.toLowerCase()));
              return (
                <button
                  key={d.letter}
                  type="button"
                  onClick={() => setSelectedDir(d.path)}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-slate-800 bg-slate-100 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      {d.letter.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{d.label}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{d.path}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0 ml-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. TÙY CHỌN CHỌN THƯ MỤC TÙY Ý */}
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

        {/* Security / Guidance Note */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Ứng dụng sử dụng định dạng <strong>SQLite WAL Mode</strong> đảm bảo cơ sở dữ liệu đọc/ghi tức thì và không bị xung đột khóa tệp khi OneDrive hoặc Google Drive đồng bộ nền.
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
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Đang lưu...' : 'Xác nhận vị trí lưu trữ'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
