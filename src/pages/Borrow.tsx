import { useState, useEffect, useRef } from 'react';
import { 
  ScanBarcode, 
  RotateCcw, 
  UserCheck, 
  Calendar, 
  BookOpen, 
  CalendarPlus, 
  CheckSquare, 
  Square,
  Sparkles,
  ArrowRight,
  Info,
  X
} from 'lucide-react';
import { dbService } from '../services/db';
import { playSuccessBeep, playErrorBeep } from '../services/audio';
import { useToast } from '../context/ToastContext';
import type { Reader, BorrowRecord } from '../types';

export default function Borrow() {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedReader, setSelectedReader] = useState<Reader | null>(null);
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Gia hạn sách
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedRenewIds, setSelectedRenewIds] = useState<(string | number)[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const todayStr = new Date().toISOString().split('T')[0];

  const playSoundIfEnabled = async (isSuccess: boolean) => {
    try {
      const settings = await dbService.getSettings();
      if (settings.sound_enabled) {
        if (isSuccess) playSuccessBeep();
        else playErrorBeep();
      }
    } catch {
      if (isSuccess) playSuccessBeep();
      else playErrorBeep();
    }
  };

  const loadBorrowedBooks = async (readerId: string) => {
    const list = await dbService.getActiveBorrowsByReader(readerId);
    setBorrowedBooks(list);
  };

  // Reset về trạng thái ban đầu (F9)
  const handleReset = () => {
    setSelectedReader(null);
    setBorrowedBooks([]);
    setBarcodeInput('');
    showToast('Đã làm mới quầy mượn trả (F9)', 'info');
    playSoundIfEnabled(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Focus ô nhập mã (F6)
  const handleFocusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  };

  // Bắt phím tắt toàn cục F6 & F9
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F6') {
        e.preventDefault();
        handleFocusInput();
      } else if (e.key === 'F9') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Tự động focus ô nhập mã khi mở trang
  useEffect(() => {
    handleFocusInput();
  }, []);

  // Xử lý khi quét mã hoặc nhấn Enter
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawCode = barcodeInput.trim();
    if (!rawCode || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // TRƯỜNG HỢP 1: ĐÃ CHỌN BẠN ĐỌC -> Quét mã sách để mượn
      if (selectedReader) {
        try {
          const { record, book } = await dbService.borrowBook(selectedReader.id, rawCode);
          await loadBorrowedBooks(selectedReader.id);
          setBarcodeInput('');
          playSoundIfEnabled(true);
          showToast(
            `Mượn thành công "${book.title}" cho bạn đọc ${selectedReader.name}! Hạn trả: ${record.due_date}`,
            'success'
          );
        } catch (err: unknown) {
          const error = err as Error;
          playSoundIfEnabled(false);
          showToast(error.message || 'Lỗi khi mượn sách!', 'error');
          setBarcodeInput('');
        }
        return;
      }

      // TRƯỜNG HỢP 2: CHƯA CHỌN BẠN ĐỌC
      // Kiểm tra xem là Mã Bạn Đọc hay Mã Sách đang mượn (để tự động Trả sách)
      const existingReader = await dbService.getReaderById(rawCode);

      if (existingReader) {
        if (existingReader.expiry_date) {
          const todayStr = new Date().toISOString().split('T')[0];
          if (existingReader.expiry_date < todayStr) {
            playSoundIfEnabled(false);
            showToast(
              `Thẻ của "${existingReader.name}" đã hết hạn vào ngày ${existingReader.expiry_date}!`,
              'error'
            );
            setBarcodeInput('');
            return;
          }
        }

        setSelectedReader(existingReader);
        await loadBorrowedBooks(existingReader.id);
        setBarcodeInput('');
        playSoundIfEnabled(true);
        showToast(
          `Đã nhận diện bạn đọc: ${existingReader.name}. Quét mã sách để mượn!`,
          'success'
        );
        return;
      }

      // Kiểm tra có phải sách đang mượn -> Tự động trả sách
      const activeBorrow = await dbService.getActiveBorrowByBook(rawCode);
      if (activeBorrow) {
        try {
          const { book, readerName } = await dbService.returnBook(rawCode);
          setBarcodeInput('');
          playSoundIfEnabled(true);
          showToast(
            `Thu hồi "${book.title}" từ bạn đọc ${readerName} thành công!`,
            'success'
          );
        } catch (err: unknown) {
          const error = err as Error;
          playSoundIfEnabled(false);
          showToast(error.message || 'Lỗi khi trả sách!', 'error');
          setBarcodeInput('');
        }
        return;
      }

      // Nếu là mã sách sẵn sàng
      const existingBook = await dbService.getBookById(rawCode);
      if (existingBook) {
        playSoundIfEnabled(false);
        showToast(
          `Sách "${existingBook.title}" đang có sẵn trong kho. Quét mã bạn đọc trước nếu muốn mượn!`,
          'warning'
        );
        setBarcodeInput('');
        return;
      }

      // Mã không tồn tại
      playSoundIfEnabled(false);
      showToast(`Mã "${rawCode}" không tồn tại trong hệ thống!`, 'error');
      setBarcodeInput('');
    } finally {
      setIsSubmitting(false);
      // Giữ focus ở ô nhập mã dù mã hợp lệ hay không hợp lệ (không tự out ô nhập)
      // Chỉ mất focus khi người dùng chủ động nháy chuột ra ngoài
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  // Mở Popup Gia hạn sách
  const handleOpenRenewModal = () => {
    if (borrowedBooks.length === 0) {
      showToast('Bạn đọc hiện không có cuốn sách nào để gia hạn!', 'warning');
      return;
    }
    setSelectedRenewIds(borrowedBooks.map((b) => b.id));
    setIsRenewModalOpen(true);
  };

  const handleToggleRenewItem = (id: string | number) => {
    setSelectedRenewIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleAllRenew = () => {
    if (selectedRenewIds.length === borrowedBooks.length) {
      setSelectedRenewIds([]);
    } else {
      setSelectedRenewIds(borrowedBooks.map((b) => b.id));
    }
  };

  const handleConfirmRenew = async () => {
    if (selectedRenewIds.length === 0) {
      showToast('Vui lòng chọn ít nhất một cuốn sách để gia hạn!', 'warning');
      return;
    }

    try {
      await dbService.renewBooks(selectedRenewIds);
      if (selectedReader) {
        await loadBorrowedBooks(selectedReader.id);
      }
      setIsRenewModalOpen(false);
      playSoundIfEnabled(true);
      showToast(`Gia hạn thành công ${selectedRenewIds.length} cuốn sách!`, 'success');
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Lỗi gia hạn sách', 'error');
    }
  };

  const handleDirectReturn = async (bookId: string) => {
    try {
      const { book } = await dbService.returnBook(bookId);
      if (selectedReader) {
        await loadBorrowedBooks(selectedReader.id);
      }
      playSoundIfEnabled(true);
      showToast(`Đã trả sách "${book.title}" thành công!`, 'success');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } catch (err: unknown) {
      const error = err as Error;
      playSoundIfEnabled(false);
      showToast(error.message || 'Lỗi trả sách!', 'error');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <Sparkles className="w-4 h-4" />
            Module Cốt Lõi • Lưu Trữ SQLite Cục Bộ Trên Máy
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Mượn & Trả Sách Thông Minh
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-xs transition-colors shadow-2xs"
            title="Nhấn F9 để xóa bạn đọc và làm mới"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Xóa thông tin / Reset (F9)</span>
          </button>
        </div>
      </div>

      {/* MỘT Ô NHẬP MÃ ĐA NĂNG CỰC LỚN THEO YÊU CẦU PLAN.MD */}
      <div className="bg-white rounded-3xl p-6 border-2 border-indigo-500/30 shadow-lg shadow-indigo-500/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                selectedReader
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-100'
              }`}
            >
              <ScanBarcode className="w-3.5 h-3.5" />
              {selectedReader ? 'Chế độ 2: Quét mã sách để mượn' : 'Chế độ 1: Quét mã bạn đọc hoặc mã sách để trả'}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Nhấn <kbd className="font-mono font-bold text-indigo-600">F6</kbd> để nhảy nhanh vào ô này
          </span>
        </div>

        <form onSubmit={handleCodeSubmit} className="relative flex items-center">
          <div className="absolute left-4 text-slate-400 pointer-events-none">
            <ScanBarcode className="w-6 h-6 text-indigo-600 animate-pulse" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder={
              selectedReader
                ? `Đang chọn "${selectedReader.name}". Quét hoặc gõ MÃ SÁCH rồi Enter để mượn...`
                : 'Quét MÃ BẠN ĐỌC (để mượn) hoặc MÃ SÁCH ĐANG MƯỢN (để trả), nhấn Enter...'
            }
            className="w-full pl-14 pr-32 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-lg font-mono font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 placeholder:font-sans placeholder:text-sm sm:placeholder:text-base"
            autoFocus
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="absolute right-2.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Đang xử lý...' : 'Nhận mã'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Tít ngắn = Thao tác hợp lệ
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Tít dài = Lỗi / Cảnh báo
            </span>
          </div>
          <span className="text-slate-400">
            Hỗ trợ máy quét mã vạch USB/Bluetooth hoặc gõ trực tiếp
          </span>
        </div>
      </div>

      {/* 2 CỘT CHÍNH: THÔNG TIN BẠN ĐỌC (TRÁI) & SÁCH ĐÃ MƯỢN (PHẢI) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KHỐI TRÁI: THÔNG TIN BẠN ĐỌC */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                Thông tin bạn đọc
              </h2>
              {selectedReader && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Đã nhận diện
                </span>
              )}
            </div>

            {!selectedReader ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <UserCheck className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700 text-sm">Chưa chọn bạn đọc nào</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Hãy quét hoặc nhập Mã bạn đọc vào ô bên trên để bắt đầu mượn sách
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center gap-4">
                  {selectedReader.avatar ? (
                    <img
                      src={selectedReader.avatar}
                      alt={selectedReader.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-indigo-50 border-2 border-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-2xl shadow-sm shrink-0">
                      {selectedReader.name.trim().charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-900 text-white">
                      #{selectedReader.id}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-xl truncate mt-1">
                      {selectedReader.name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {selectedReader.email || 'Chưa cập nhật email'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Ngày sinh:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedReader.dob || 'Không rõ'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Thời hạn thẻ:</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded ${
                        selectedReader.expiry_date
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {selectedReader.expiry_date
                        ? `Đến ${selectedReader.expiry_date}`
                        : 'Vô thời hạn'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500">Đang mượn:</span>
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {borrowedBooks.length} cuốn
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* NÚT GIA HẠN SÁCH */}
          {selectedReader && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                onClick={handleOpenRenewModal}
                disabled={borrowedBooks.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Gia hạn sách (Renew)</span>
              </button>
            </div>
          )}
        </div>

        {/* KHỐI PHẢI: DANH MỤC SÁCH ĐÃ MƯỢN */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Danh mục sách đã mượn
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {borrowedBooks.length} cuốn đang mượn
              </span>
            </div>

            {!selectedReader ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
                <BookOpen className="w-12 h-12 text-slate-200" />
                <p className="text-sm font-medium">Chưa có dữ liệu sách mượn.</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Khi quét mã bạn đọc, toàn bộ sách đang mượn kèm hạn trả sẽ hiển thị tại đây.
                </p>
              </div>
            ) : borrowedBooks.length === 0 ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
                <p className="text-sm font-medium text-slate-700">
                  Bạn đọc này hiện chưa mượn cuốn sách nào.
                </p>
                <p className="text-xs text-slate-400">
                  Quét mã sách ở ô phía trên để bắt đầu mượn!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {borrowedBooks.map((item) => {
                  const isOverdue = item.due_date && item.due_date < todayStr;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                        isOverdue
                          ? 'bg-rose-50/60 border-rose-200'
                          : 'bg-slate-50/80 border-slate-200 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isOverdue
                              ? 'bg-rose-100 text-rose-600'
                              : 'bg-indigo-100 text-indigo-600'
                          }`}
                        >
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {item.book_id}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm truncate">
                              {item.book_title}
                            </h4>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                            <span>Mượn ngày: {item.borrow_date}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              Hạn trả:
                              <strong
                                className={`font-semibold ${
                                  isOverdue ? 'text-rose-600 underline' : 'text-indigo-600'
                                }`}
                              >
                                {item.due_date} {isOverdue && '(QUÁ HẠN)'}
                              </strong>
                            </span>
                            {item.renew_count ? (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                                Đã gia hạn x{item.renew_count}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleDirectReturn(item.book_id)}
                          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs transition-colors shadow-2xs"
                        >
                          Trả sách này
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Mẹo trả sách:</strong> Không cần chọn bạn đọc trước. Quét trực tiếp mã sách vào ô trên cùng để tự động hoàn trả!
            </span>
          </div>
        </div>
      </div>

      {/* POPUP GIA HẠN SÁCH */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <CalendarPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Gia Hạn Mượn Sách</h3>
                  <p className="text-xs text-slate-500">
                    Chọn các cuốn sách cần gia hạn thêm vào hạn trả hiện tại
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">
                Đã chọn: {selectedRenewIds.length}/{borrowedBooks.length} cuốn
              </span>
              <button
                onClick={handleToggleAllRenew}
                className="flex items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-800"
              >
                {selectedRenewIds.length === borrowedBooks.length ? (
                  <>
                    <CheckSquare className="w-4 h-4" /> Bỏ chọn tất cả
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" /> Chọn tất cả
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {borrowedBooks.map((b) => {
                const isChecked = selectedRenewIds.includes(b.id);
                return (
                  <div
                    key={b.id}
                    onClick={() => handleToggleRenewItem(b.id)}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-colors ${
                      isChecked
                        ? 'bg-indigo-50/70 border-indigo-300'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-indigo-600">
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{b.book_title}</p>
                        <p className="text-xs text-slate-500">
                          Mã: <span className="font-mono font-medium">{b.book_id}</span> • Hạn hiện tại: {b.due_date}
                        </p>
                      </div>
                    </div>
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmRenew}
                disabled={selectedRenewIds.length === 0}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs disabled:opacity-50"
              >
                Xác nhận Gia hạn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
