import { useState, useRef, useEffect } from 'react';
import {
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
  HardDrive,
  ChevronDown
} from 'lucide-react';
import type { AuthUser } from '../types';
import ClerkUserAvatar from './ClerkUserAvatar';

interface ClerkUserButtonProps {
  user: AuthUser;
  isOpen?: boolean; // Sidebar đang mở rộng hay thu gọn
  onLogout?: () => void;
  onOpenStorageModal?: () => void;
  placement?: 'bottom-sidebar' | 'header';
}

export default function ClerkUserButton({
  user,
  isOpen = true,
  onLogout,
  onOpenStorageModal,
  placement = 'bottom-sidebar',
}: ClerkUserButtonProps) {
  const [showPopover, setShowPopover] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Đóng popover khi nhấp ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowPopover(false);
      }
    }
    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopover]);

  // Mở trang quản lý tài khoản Clerk trên trình duyệt
  const handleManageAccount = () => {
    setShowPopover(false);
    const webAuthUrl =
      import.meta.env.VITE_WEB_AUTH_URL ||
      (typeof window !== 'undefined' && window.location.origin.includes('localhost')
        ? 'http://localhost:5173/'
        : 'https://nam-library.vercel.app/');

    if (window.electronAPI) {
      window.electronAPI.openExternal(webAuthUrl);
    } else {
      window.open(webAuthUrl, '_blank');
    }
  };

  const handleSignOutClick = () => {
    setShowPopover(false);
    if (onLogout) {
      onLogout();
    }
  };

  const handleStorageClick = () => {
    setShowPopover(false);
    if (onOpenStorageModal) {
      onOpenStorageModal();
    }
  };

  return (
    <div ref={containerRef} className="relative select-none">
      {/* Nút kích hoạt: Trong Sidebar hoặc Header */}
      {placement === 'bottom-sidebar' ? (
        <button
          type="button"
          onClick={() => setShowPopover((prev) => !prev)}
          className={`w-full group p-2 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/40 flex items-center gap-3 transition-all cursor-pointer shadow-sm ${
            !isOpen ? 'justify-center p-1.5' : ''
          }`}
          title={isOpen ? 'Tài khoản Clerk & Cài đặt' : user.name}
        >
          {/* Avatar dạng tròn chuẩn Clerk với hiệu ứng viền phát sáng nhẹ */}
          <div className="relative">
            <ClerkUserAvatar
              avatarUrl={user.avatar}
              name={user.name}
              email={user.email}
              id={user.id}
              size={36}
              className="ring-2 ring-indigo-500/50 group-hover:ring-indigo-400 group-hover:scale-105 transition-all shadow-md shadow-indigo-950/40"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
          </div>

          {/* Tên và Email khi Sidebar đang mở */}
          {isOpen && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-xs font-bold text-white group-hover:text-indigo-300 truncate transition-colors flex items-center gap-1">
                  <span>{user.name}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  {user.email || 'namnn2016'}
                </div>
              </div>

              <ChevronDown
                size={15}
                className={`text-slate-400 group-hover:text-slate-200 transition-transform duration-200 shrink-0 ${
                  showPopover ? 'rotate-180' : ''
                }`}
              />
            </>
          )}
        </button>
      ) : (
        /* Giao diện nút khi gắn trên Header */
        <button
          type="button"
          onClick={() => setShowPopover((prev) => !prev)}
          className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all cursor-pointer"
        >
          <ClerkUserAvatar
            avatarUrl={user.avatar}
            name={user.name}
            email={user.email}
            id={user.id}
            size={28}
          />
          <span className="text-xs font-bold text-slate-800 hidden sm:inline max-w-[120px] truncate">
            {user.name}
          </span>
          <ChevronDown size={14} className="text-slate-500" />
        </button>
      )}

      {/* Popover Card mô phỏng chuẩn xác User Profile Popover của Clerk trong image copy 5 với tông màu tối đồng bộ Sidebar */}
      {showPopover && (
        <div
          className={`absolute z-50 w-72 rounded-2xl bg-slate-900/95 text-slate-100 shadow-2xl border border-slate-700/80 p-4 space-y-3.5 animate-fadeIn backdrop-blur-xl ${
            placement === 'bottom-sidebar'
              ? isOpen
                ? 'bottom-full left-0 mb-2.5'
                : 'bottom-0 left-full ml-3'
              : 'top-full right-0 mt-2'
          }`}
        >
          {/* Header Popover: Avatar lớn, Họ tên, Username/Email */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <ClerkUserAvatar
              avatarUrl={user.avatar}
              name={user.name}
              email={user.email}
              id={user.id}
              size={46}
              className="ring-2 ring-indigo-500/40 shadow-md shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-sm text-white leading-snug truncate">
                {user.name}
              </div>
              <div className="text-xs text-slate-400 font-mono truncate leading-tight">
                {user.email || 'namnn2016'}
              </div>
              <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-[10px] border border-emerald-500/20">
                <ShieldCheck size={11} className="text-emerald-400" />
                <span>Tài khoản Clerk</span>
              </div>
            </div>
          </div>

          {/* Danh sách hành động (Action Menu) */}
          <div className="space-y-1">
            {/* Manage Account */}
            <button
              type="button"
              onClick={handleManageAccount}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer text-left group"
            >
              <div className="flex items-center gap-2.5">
                <Settings size={16} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                <span>Manage account</span>
              </div>
              <ExternalLink size={13} className="text-slate-500 group-hover:text-indigo-400" />
            </button>

            {/* Storage setup nếu đang trong app */}
            {onOpenStorageModal && (
              <button
                type="button"
                onClick={handleStorageClick}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <HardDrive size={16} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
                  <span>Ổ đĩa lưu trữ (SQLite)</span>
                </div>
                <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  Dữ liệu riêng
                </span>
              </button>
            )}

            {/* Sign Out */}
            {onLogout && (
              <button
                type="button"
                onClick={handleSignOutClick}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer text-left group"
              >
                <LogOut size={16} className="text-rose-400 group-hover:scale-110 transition-transform" />
                <span>Sign out</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
