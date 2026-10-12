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
import { ToastProvider, useToast } from './context/ToastContext';
import { dbService } from './services/db';

function MainLayout() {
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

    // Chạy ngay sau 3 giây khi ứng dụng sẵn sàng
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
      />

      {/* Cột giao diện chính (Header + Nội dung các trang) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        {/* Vùng nội dung cuộn mượt mà */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/app" element={<Dashboard />} />
            <Route path="/borrow" element={<Borrow />} />
            <Route path="/readers" element={<Readers />} />
            <Route path="/books" element={<Books />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const isElectron = typeof window !== 'undefined' && (
    Boolean((window as unknown as { electronAPI?: unknown }).electronAPI) ||
    navigator.userAgent.toLowerCase().includes('electron')
  );

  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Trang Tải EXE Toàn Màn Hình */}
          <Route path="/download" element={<DownloadPage />} />

          {/* Root: Nếu trên Web mở DownloadPage; Nếu trên Electron Desktop vào thẳng Dashboard */}
          <Route
            path="/"
            element={isElectron ? <Navigate to="/app" replace /> : <DownloadPage />}
          />

          {/* Hệ thống giao diện quản lý */}
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
