import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Users, 
  Library, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  HardDrive,
  LogOut,
  Sparkles
} from 'lucide-react';
import type { AuthUser } from '../types';
import LogoIcon from './LogoIcon';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  user?: AuthUser | null;
  onLogout?: () => void;
  onOpenStorageModal?: () => void;
}

export default function Sidebar({
  isOpen,
  onToggle,
  user,
  onLogout,
  onOpenStorageModal
}: SidebarProps) {
  const navItems = [
    { to: '/app', icon: LayoutDashboard, label: 'Trang chủ', badge: null },
    { to: '/borrow', icon: ArrowLeftRight, label: 'Mượn sách', badge: 'F6' },
    { to: '/readers', icon: Users, label: 'Bạn đọc', badge: null },
    { to: '/books', icon: Library, label: 'Sách', badge: null },
    { to: '/settings', icon: Settings, label: 'Cài đặt', badge: null },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 select-none shadow-xl z-30 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="h-18 flex items-center px-4 border-b border-slate-800/80 justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-indigo-500/20 shrink-0 border border-indigo-500/30">
            <LogoIcon className="w-full h-full rounded-xl" />
          </div>
          {isOpen && (
            <div className="flex flex-col min-w-0 transition-opacity duration-200">
              <span className="font-bold text-lg text-white tracking-tight truncate flex items-center gap-1.5">
                Nam Library
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">
                Hệ thống thư viện
              </span>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          title={isOpen ? 'Thu gọn thanh bên' : 'Mở rộng thanh bên'}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer ${
            !isOpen && 'mx-auto mt-2'
          }`}
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/' || item.to === '/app'}
              className={({ isActive }) => `
                group flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200
                ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }
                ${!isOpen && 'justify-center px-0'}
              `}
              title={!isOpen ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              {isOpen && (
                <div className="flex items-center justify-between flex-1">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/90 text-indigo-300 border border-indigo-500/20">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}

        {/* Nút chọn ổ đĩa lưu trữ */}
        {onOpenStorageModal && (
          <button
            onClick={onOpenStorageModal}
            className={`w-full group flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-200 cursor-pointer ${
              !isOpen && 'justify-center px-0'
            }`}
            title="Đổi ổ đĩa lưu trữ dữ liệu"
          >
            <HardDrive className="w-5 h-5 shrink-0 text-cyan-400 transition-transform duration-200 group-hover:scale-110" />
            {isOpen && <span className="truncate">Chọn ổ đĩa lưu</span>}
          </button>
        )}
      </nav>

      {/* User account card & Logout at bottom */}
      {user && (
        <div className="p-3 border-t border-slate-800/80">
          <div
            className={`p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3 ${
              !isOpen && 'justify-center p-2'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>

            {isOpen && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{user.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{user.email || 'SQLite Cục Bộ'}</div>
              </div>
            )}

            {isOpen && onLogout && (
              <button
                onClick={onLogout}
                title="Đăng xuất"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer shortcut tips */}
      {isOpen && (
        <div className="p-3 mx-3 mb-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span>Quét mã</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-indigo-300 font-semibold">F6</kbd>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span>Làm mới</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-indigo-300 font-semibold">F9</kbd>
          </div>
        </div>
      )}
    </aside>
  );
}
