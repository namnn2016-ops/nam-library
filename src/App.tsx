import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Borrow from './pages/Borrow';
import Readers from './pages/Readers';
import Books from './pages/Books';
import SettingsPage from './pages/SettingsPage';
import DownloadPage from './pages/DownloadPage';
import WebLoginPage from './pages/WebLoginPage';
import DesktopLoginPage from './components/DesktopLoginPage';
import StorageSetupModal from './components/StorageSetupModal';
import WebRestrictedPage from './components/WebRestrictedPage';
import { ToastProvider, useToast } from './context/ToastContext';
import { dbService } from './services/db';
import { getStoredDesktopUser, logoutDesktopUser } from './services/auth';
import { getClerkPublishableKey } from './services/clerkConfig';
import { ClerkProvider } from '@clerk/clerk-react';
import ErrorBoundary from './components/ErrorBoundary';
import type { AuthUser } from './types';

interface MainLayoutProps {
  user: AuthUser | null;
  onLogout: () => void;
  onOpenStorageModal: () => void;
}

function MainLayout({ user, onLogout, onOpenStorageModal }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { showToast } = useToast();

  // Tự động kiểm tra và gửi email cho sách gần quá hạn hoặc quá hạn
  useEffect(() => {
    const runAutoEmailCheck = async () => {
      try {
        const sentList = await dbService.checkAndSendAutoEmails();
        sentList.forEach((msg) => {
          showToast(msg, 'info');
        });
      } catch (err) {
        console.warn('Lỗi kiểm tra gửi email tự động:', err);
      }
    };

    // Chạy sau 3 giây khi ứng dụng sẵn sàng
    const initialTimer = setTimeout(runAutoEmailCheck, 3000);

    // Lặp lại kiểm tra định kỳ mỗi 2 phút
    const intervalTimer = setInterval(runAutoEmailCheck, 120000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [showToast]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sidebar thu vào mở ra */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        user={user}
        onLogout={onLogout}
        onOpenStorageModal={onOpenStorageModal}
      />

      {/* Cột giao diện chính (Header + Nội dung các trang) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={user} onLogout={onLogout} />

        {/* Vùng nội dung cuộn mượt mà */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/app" element={<Dashboard />} />
            <Route path="/borrow" element={<Borrow />} />
            <Route path="/readers" element={<Readers />} />
            <Route path="/books" element={<Books />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const isElectron =
    typeof window !== 'undefined' &&
    (Boolean((window as unknown as { electronAPI?: unknown }).electronAPI) ||
      navigator.userAgent.toLowerCase().includes('electron'));

  const [desktopUser, setDesktopUser] = useState<AuthUser | null>(() => getStoredDesktopUser());
  const [showStorageModal, setShowStorageModal] = useState(false);

  // Khởi tạo CSDL SQLite riêng cho user khi mở ứng dụng Desktop
  useEffect(() => {
    if (isElectron && window.electronAPI) {
      if (desktopUser) {
        window.electronAPI.initUserDb(desktopUser.id).catch((err) => {
          console.error('Lỗi khởi tạo CSDL người dùng:', err);
        });
      }

      // Kiểm tra nếu chưa chọn ổ đĩa lần đầu -> Hiển thị hộp thoại chọn ổ đĩa ngay
      window.electronAPI.getStorageConfig().then((config) => {
        if (!config.isConfigured) {
          setShowStorageModal(true);
        }
      }).catch((err) => {
        console.error('Lỗi đọc cấu hình ổ đĩa:', err);
      });
    }
  }, [isElectron, desktopUser]);

  const handleLogout = () => {
    logoutDesktopUser();
    setDesktopUser(null);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setDesktopUser(user);
    // Sau khi đăng nhập, kiểm tra ổ đĩa
    if (window.electronAPI) {
      window.electronAPI.getStorageConfig().then((config) => {
        if (!config.isConfigured) {
          setShowStorageModal(true);
        }
      });
    }
  };

  const clerkKey = getClerkPublishableKey();

  const webRoutes = (
    <Routes>
      {/* Trang chủ & Cổng xác thực Clerk / Tải ứng dụng Desktop */}
      <Route path="/" element={<DownloadPage />} />
      <Route path="/download" element={<DownloadPage />} />
      <Route path="/login/*" element={<WebLoginPage />} />
      <Route path="/auth/*" element={<WebLoginPage />} />
      <Route path="/sign-in/*" element={<WebLoginPage />} />
      <Route path="/sign-up/*" element={<WebLoginPage />} />

      {/* Chặn tất cả các route dùng thử trên Web */}
      <Route path="/app" element={<WebRestrictedPage />} />
      <Route path="/borrow" element={<WebRestrictedPage />} />
      <Route path="/readers" element={<WebRestrictedPage />} />
      <Route path="/books" element={<WebRestrictedPage />} />
      <Route path="/settings" element={<WebRestrictedPage />} />
      <Route path="*" element={<WebRestrictedPage />} />
    </Routes>
  );

  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          {isElectron ? (
            // ================= MÔI TRƯỜNG ELECTRON DESKTOP =================
            <>
              {!desktopUser ? (
                <DesktopLoginPage
                  onLoginSuccess={handleLoginSuccess}
                  onOpenStorageModal={() => setShowStorageModal(true)}
                />
              ) : (
                <MainLayout
                  user={desktopUser}
                  onLogout={handleLogout}
                  onOpenStorageModal={() => setShowStorageModal(true)}
                />
              )}
              <StorageSetupModal
                isOpen={showStorageModal}
                onClose={() => setShowStorageModal(false)}
                onSaved={() => setShowStorageModal(false)}
              />
            </>
          ) : (
            // ================= MÔI TRƯỜNG WEB (KHÔNG CÓ BẢN DÙNG THỬ) =================
            clerkKey ? (
              <ClerkProvider
                publishableKey={clerkKey}
                appearance={{
                  layout: {
                    unsafe_disableDevelopmentModeWarnings: true,
                  },
                }}
              >
                {webRoutes}
              </ClerkProvider>
            ) : (
              webRoutes
            )
          )}
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
