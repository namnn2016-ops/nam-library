import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  X,
  AlertTriangle,
  Clock,
  QrCode,
  Banknote,
  Coins,
  Check,
  Copy,
  Receipt,
  CheckCircle2
} from 'lucide-react';
import { dbService } from '../services/db';
import { playSuccessBeep, playErrorBeep } from '../services/audio';
import { useToast } from '../context/ToastContext';
import { getVietQrUrl, formatVnd, generateCashSuggestions } from '../constants/banks';
import type { Reader, BorrowRecord, AppSettings } from '../types';

interface ReturnModalData {
  borrowRecord: BorrowRecord;
  bookId: string;
  bookTitle: string;
  readerId: string;
  readerName: string;
  readerEmail?: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string;
  daysOverdue: number;
  feePerDay: number;
  totalFine: number;
  settings: AppSettings;
}

export default function Borrow() {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedReader, setSelectedReader] = useState<Reader | null>(null);
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Gia hạn sách
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedRenewIds, setSelectedRenewIds] = useState<(string | number)[]>([]);

  // Modal Thu hồi & Tính tiền phạt theo hạn
  const [returnModalData, setReturnModalData] = useState<ReturnModalData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK'>('CASH');
  const [customerCash, setCustomerCash] = useState<number>(0);
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

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

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBankField(label);
    showToast(`Đã sao chép ${label}!`, 'success');
    setTimeout(() => setCopiedBankField(null), 2000);
  };

  const handleInitiateReturn = async (bookId: string) => {
    try {
      const cleanBookId = bookId.trim().toUpperCase();
      const activeBorrow = await dbService.getActiveBorrowByBook(cleanBookId);
      if (!activeBorrow) {
        throw new Error(`Sách với mã "${cleanBookId}" hiện không ở trạng thái được mượn!`);
      }

      const [book, reader, settings] = await Promise.all([
        dbService.getBookById(cleanBookId),
        dbService.getReaderById(activeBorrow.reader_id),
        dbService.getSettings(),
      ]);

      const todayStr = new Date().toISOString().split('T')[0];
      const todayTime = new Date(todayStr).getTime();
      const dueTime = new Date(activeBorrow.due_date).getTime();
      const diffDays = Math.round((todayTime - dueTime) / 86400000);
      const daysOverdue = Math.max(0, diffDays);
      const feePerDay = settings.late_fee_per_day ?? 5000;
      const totalFine = daysOverdue * feePerDay;

      setReturnModalData({
        borrowRecord: activeBorrow,
        bookId: cleanBookId,
        bookTitle: book?.title || activeBorrow.book_title || cleanBookId,
        readerId: activeBorrow.reader_id,
        readerName: reader?.name || activeBorrow.reader_name || activeBorrow.reader_id,
        readerEmail: reader?.email || '',
        borrowDate: activeBorrow.borrow_date,
        dueDate: activeBorrow.due_date,
        returnDate: todayStr,
        daysOverdue,
        feePerDay,
        totalFine,
        settings,
      });

      setPaymentMethod('CASH');
      setCustomerCash(totalFine);

      if (daysOverdue > 0) {
        playSoundIfEnabled(false);
      } else {
        playSoundIfEnabled(true);
      }
    } catch (err: unknown) {
      const error = err as Error;
      playSoundIfEnabled(false);
      showToast(error.message || 'Lỗi khi chuẩn bị trả sách!', 'error');
    }
  };

  const handleConfirmReturn = async (isWaived = false) => {
    if (!returnModalData || isProcessingReturn) return;
    setIsProcessingReturn(true);

    try {
      const { bookId, daysOverdue, feePerDay, totalFine } = returnModalData;
      const actualPaymentMethod: 'CASH' | 'BANK' | 'WAIVED' = isWaived
        ? 'WAIVED'
        : totalFine > 0
        ? paymentMethod
        : 'CASH';
      const paidAmount = isWaived ? 0 : totalFine;

      const { book, readerName } = await dbService.returnBook(bookId, {
        daysOverdue,
        feePerDay,
        totalFee,
        paidAmount,
        paymentMethod: actualPaymentMethod,
        notes: isWaived
          ? 'Miễn tiền phạt quá hạn'
          : totalFine > 0
          ? `Thanh toán ${formatVnd(totalFine)} qua ${
              actualPaymentMethod === 'CASH' ? 'Tiền mặt' : 'VietQR Ngân hàng'
            }`
          : 'Trả sách đúng hạn',
      });

      if (selectedReader) {
        await loadBorrowedBooks(selectedReader.id);
      }

      setReturnModalData(null);
      playSoundIfEnabled(true);

      if (totalFine > 0 && !isWaived) {
        showToast(
          `Thu hồi "${book.title}" từ bạn đọc ${readerName} thành công! Đã thu ${formatVnd(
            totalFine
          )} tiền phạt (${actualPaymentMethod === 'CASH' ? 'Tiền mặt' : 'VietQR'}).`,
          'success'
        );
      } else if (isWaived) {
        showToast(
          `Thu hồi "${book.title}" thành công (Đã miễn khoản phạt ${formatVnd(totalFine)})!`,
          'info'
        );
      } else {
        showToast(`Thu hồi "${book.title}" từ bạn đọc ${readerName} đúng hạn thành công!`, 'success');
      }

      setBarcodeInput('');
    } catch (err: unknown) {
      const error = err as Error;
      playSoundIfEnabled(false);
      showToast(error.message || 'Lỗi khi hoàn tất trả sách!', 'error');
    } finally {
      setIsProcessingReturn(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleDirectReturn = async (bookId: string) => {
    await handleInitiateReturn(bookId);
  };

  // Bắt phím tắt toàn cục F6 & F9, Enter & Esc cho popup trả sách
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (returnModalData) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setReturnModalData(null);
          setTimeout(() => inputRef.current?.focus(), 50);
          return;
        }
        if (e.key === 'Enter') {
          const target = e.target as HTMLElement;
          if (target && target.tagName === 'INPUT' && target.getAttribute('type') === 'number') {
            return;
          }
          e.preventDefault();
          handleConfirmReturn(false);
          return;
        }
      }

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
  }, [returnModalData, isProcessingReturn, customerCash, paymentMethod]);

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
        const list = await dbService.getActiveBorrowsByReader(existingReader.id);
        setBorrowedBooks(list);
        setBarcodeInput('');

        const todayTime = new Date(new Date().toISOString().split('T')[0]).getTime();
        let overdueCount = 0;
        let nearDueCount = 0;
        for (const item of list) {
          if (item.due_date) {
            const dueTime = new Date(item.due_date).getTime();
            const diffDays = Math.round((dueTime - todayTime) / 86400000);
            if (diffDays < 0) overdueCount++;
            else if (diffDays <= 2) nearDueCount++;
          }
        }

        playSoundIfEnabled(true);
        if (overdueCount > 0) {
          showToast(
            `⚠️ CẢNH BÁO: Bạn đọc "${existingReader.name}" có ${overdueCount} cuốn sách ĐÃ QUÁ HẠN!`,
            'error'
          );
        } else if (nearDueCount > 0) {
          showToast(
            `⏰ CHÚ Ý: Bạn đọc "${existingReader.name}" có ${nearDueCount} cuốn sách SẮP ĐẾN HẠN (trong 1-2 ngày tới)!`,
            'warning'
          );
        } else {
          showToast(
            `Đã nhận diện bạn đọc: ${existingReader.name}. Quét mã sách để mượn!`,
            'success'
          );
        }
        return;
      }

      // Kiểm tra có phải sách đang mượn -> Mở popup thu hồi & tính tiền phạt
      const activeBorrow = await dbService.getActiveBorrowByBook(rawCode);
      if (activeBorrow) {
        setBarcodeInput('');
        await handleInitiateReturn(rawCode);
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

            {/* Banner cảnh báo nhanh khi bạn đọc có sách quá hạn hoặc sắp đến hạn */}
            {selectedReader && borrowedBooks.length > 0 && (() => {
              const overdueCount = borrowedBooks.filter((b) => {
                if (!b.due_date) return false;
                const diff = Math.round(
                  (new Date(b.due_date).getTime() - new Date(todayStr).getTime()) / 86400000
                );
                return diff < 0;
              }).length;

              const nearDueCount = borrowedBooks.filter((b) => {
                if (!b.due_date) return false;
                const diff = Math.round(
                  (new Date(b.due_date).getTime() - new Date(todayStr).getTime()) / 86400000
                );
                return diff >= 0 && diff <= 2;
              }).length;

              if (overdueCount > 0) {
                return (
                  <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-2.5 font-medium">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>
                        ⚠️ Bạn đọc có <strong className="font-bold underline text-rose-700">{overdueCount} cuốn sách đã quá hạn</strong>. Vui lòng thu hồi hoặc gia hạn ngay!
                      </span>
                    </div>
                    <button
                      onClick={handleOpenRenewModal}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 transition-colors shadow-2xs"
                    >
                      Gia hạn
                    </button>
                  </div>
                );
              }

              if (nearDueCount > 0) {
                return (
                  <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-2.5 font-medium">
                      <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>
                        ⏰ <strong>Cảnh báo hạn trả:</strong> Bạn đọc có <strong className="font-bold text-amber-900">{nearDueCount} cuốn sách sắp đến hạn trả</strong> (trong 1-2 ngày tới).
                      </span>
                    </div>
                    <button
                      onClick={handleOpenRenewModal}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition-colors shadow-2xs"
                    >
                      Gia hạn
                    </button>
                  </div>
                );
              }

              return null;
            })()}

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
                  const todayDate = new Date(todayStr);
                  const itemDueDate = item.due_date ? new Date(item.due_date) : null;
                  const diffDays = itemDueDate
                    ? Math.round((itemDueDate.getTime() - todayDate.getTime()) / 86400000)
                    : null;
                  const isOverdue = diffDays !== null && diffDays < 0;
                  const isNearDue = diffDays !== null && !isOverdue && diffDays <= 2;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                        isOverdue
                          ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-200'
                          : isNearDue
                          ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-200 shadow-2xs'
                          : 'bg-slate-50/80 border-slate-200 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isOverdue
                              ? 'bg-rose-100 text-rose-600'
                              : isNearDue
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-indigo-100 text-indigo-600'
                          }`}
                        >
                          {isOverdue ? (
                            <AlertTriangle className="w-5 h-5" />
                          ) : isNearDue ? (
                            <Clock className="w-5 h-5" />
                          ) : (
                            <BookOpen className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {item.book_id}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm truncate">
                              {item.book_title}
                            </h4>
                            {isOverdue ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                                ⚠️ Quá hạn {Math.abs(diffDays!)} ngày
                              </span>
                            ) : isNearDue ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                                ⏰ Sắp đến hạn ({diffDays === 0 ? 'Hôm nay' : `Còn ${diffDays} ngày`})
                              </span>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                            <span>Mượn ngày: {item.borrow_date}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              Hạn trả:
                              <strong
                                className={`font-semibold ${
                                  isOverdue
                                    ? 'text-rose-600 underline'
                                    : isNearDue
                                    ? 'text-amber-700 underline font-bold'
                                    : 'text-indigo-600'
                                }`}
                              >
                                {item.due_date}{' '}
                                {isOverdue
                                  ? '(ĐÃ QUÁ HẠN)'
                                  : isNearDue
                                  ? diffDays === 0
                                    ? '(HẾT HẠN HÔM NAY)'
                                    : `(CÒN ${diffDays} NGÀY)`
                                  : ''}
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
      {isRenewModalOpen && createPortal(
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
        </div>,
        document.body
      )}

      {/* POPUP TRẢ SÁCH Ở GIỮA MÀN HÌNH & TÍNH TIỀN PHẠT THEO HẠN (VIETQR / TIỀN MẶT) */}
      {returnModalData && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    returnModalData.totalFine > 0
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                  {returnModalData.totalFine > 0 ? (
                    <Receipt className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {returnModalData.totalFine > 0
                      ? 'Thu Hồi Sách & Thu Tiền Phạt Quá Hạn'
                      : 'Xác Nhận Thu Hồi Sách'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {returnModalData.totalFine > 0
                      ? `Sách trễ hạn ${returnModalData.daysOverdue} ngày. Vui lòng thanh toán tiền phạt.`
                      : 'Sách trả đúng hạn. Không phát sinh phí phạt.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReturnModalData(null);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                title="Đóng (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin Sách & Bạn đọc */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[11px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
                      {returnModalData.bookId}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm truncate">
                      {returnModalData.bookTitle}
                    </h4>
                  </div>
                  <p className="text-slate-500 mt-1">
                    Bạn đọc: <strong className="text-slate-800">{returnModalData.readerName}</strong>{' '}
                    <span className="font-mono text-slate-400">({returnModalData.readerId})</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Ngày mượn:</span>
                  <span className="font-semibold text-slate-700">{returnModalData.borrowDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Hạn trả:</span>
                  <span className="font-semibold text-slate-700">{returnModalData.dueDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Ngày trả thực tế:</span>
                  <span className="font-semibold text-indigo-600">{returnModalData.returnDate} (Hôm nay)</span>
                </div>
              </div>
            </div>

            {/* Thẻ tiền phạt */}
            {returnModalData.daysOverdue > 0 ? (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Đã quá hạn {returnModalData.daysOverdue} ngày</span>
                  </div>
                  <div className="text-[11px] text-rose-700 mt-0.5">
                    Mức phạt: {formatVnd(returnModalData.feePerDay)} / ngày
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-rose-500 block">
                    Tổng tiền phạt
                  </span>
                  <span className="text-2xl font-black text-rose-600">
                    {formatVnd(returnModalData.totalFine)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-xs block">Sách được trả đúng hạn quy định!</span>
                    <span className="text-[11px] text-emerald-700">Không có tiền phạt trễ hạn.</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-emerald-600">0 đ</span>
                </div>
              </div>
            )}

            {/* NẾU CÓ TIỀN PHẠT: CHỌN PHƯƠNG THỨC THANH TOÁN (TIỀN MẶT HOẶC NGÂN HÀNG VIETQR) */}
            {returnModalData.totalFine > 0 && (
              <div className="space-y-4">
                {/* 2 Tabs chọn phương thức */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      paymentMethod === 'CASH'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Tiền Mặt Tại Quầy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('BANK')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      paymentMethod === 'BANK'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Chuyển Khoản (VietQR)</span>
                  </button>
                </div>

                {/* TAB 1: TIỀN MẶT VỚI GỢI Ý MỆNH GIÁ */}
                {paymentMethod === 'CASH' ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-amber-500" />
                        Gợi ý các số tiền khách đưa:
                      </span>
                      <span className="text-slate-400 text-[11px]">Bấm số tiền để tính thối lại</span>
                    </div>

                    {/* Danh sách nút gợi ý số tiền */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {generateCashSuggestions(returnModalData.totalFine).map((amt) => {
                        const isSelected = customerCash === amt;
                        const isExact = amt === returnModalData.totalFine;
                        const change = amt - returnModalData.totalFine;

                        return (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setCustomerCash(amt)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <span>{formatVnd(amt)}</span>
                            {isExact ? (
                              <span className="text-[10px] opacity-80">(Vừa đủ)</span>
                            ) : change > 0 ? (
                              <span
                                className={`text-[10px] font-normal ${
                                  isSelected ? 'text-indigo-200' : 'text-emerald-600'
                                }`}
                              >
                                (Thối {formatVnd(change)})
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>

                    {/* Ô nhập số tiền khách đưa */}
                    <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Số tiền khách đưa (VNĐ):
                        </label>
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={customerCash}
                          onChange={(e) => setCustomerCash(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono text-sm font-bold text-slate-900 outline-none focus:border-indigo-600"
                        />
                      </div>

                      {/* Hiển thị tiền thối lại hoặc thiếu */}
                      <div className="p-3 rounded-xl border text-xs">
                        {customerCash >= returnModalData.totalFine ? (
                          <div className="text-emerald-800">
                            <span className="text-[11px] text-slate-500 block">Tiền thừa trả khách:</span>
                            <span className="text-base font-extrabold text-emerald-600">
                              {formatVnd(customerCash - returnModalData.totalFine)}
                            </span>
                          </div>
                        ) : (
                          <div className="text-rose-700">
                            <span className="text-[11px] text-slate-500 block">Chưa đủ, còn thiếu:</span>
                            <span className="text-base font-bold text-rose-600">
                              {formatVnd(returnModalData.totalFine - customerCash)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* TAB 2: CHUYỂN KHOẢN NGÂN HÀNG VIETQR */
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-indigo-50/20 border border-slate-200/80 space-y-4 animate-fadeIn">
                    {returnModalData.settings.bank_account_no ? (
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Hình ảnh mã VietQR */}
                        <div className="p-2.5 bg-white rounded-2xl shadow-md border border-slate-200 shrink-0">
                          <img
                            src={getVietQrUrl({
                              bankBinOrCode:
                                returnModalData.settings.bank_bin ||
                                returnModalData.settings.bank_code ||
                                '970422',
                              accountNo: returnModalData.settings.bank_account_no,
                              accountName: returnModalData.settings.bank_account_name,
                              amount: returnModalData.totalFine,
                              memo: `Phat ${returnModalData.bookId} ${returnModalData.readerId}`,
                              template: 'compact2',
                            })}
                            alt="VietQR Chuyển Khoản"
                            className="w-48 h-auto rounded-xl object-contain"
                          />
                        </div>

                        {/* Chi tiết thông tin chuyển khoản */}
                        <div className="flex-1 w-full space-y-2 text-xs">
                          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                            <span className="text-slate-400 text-[11px]">Ngân hàng:</span>
                            <span className="font-bold text-slate-800">
                              {returnModalData.settings.bank_name ||
                                returnModalData.settings.bank_code ||
                                'MBBank'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                            <span className="text-slate-400 text-[11px]">Số tài khoản:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-indigo-600 text-sm">
                                {returnModalData.settings.bank_account_no}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyText(
                                    returnModalData.settings.bank_account_no || '',
                                    'số tài khoản'
                                  )
                                }
                                className="p-1 rounded hover:bg-slate-100 text-slate-500 cursor-pointer"
                                title="Sao chép số tài khoản"
                              >
                                {copiedBankField === 'số tài khoản' ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {returnModalData.settings.bank_account_name && (
                            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                              <span className="text-slate-400 text-[11px]">Chủ tài khoản:</span>
                              <span className="font-bold text-slate-800 uppercase">
                                {returnModalData.settings.bank_account_name}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                            <span className="text-slate-400 text-[11px]">Số tiền cần chuyển:</span>
                            <span className="font-black text-rose-600 text-sm">
                              {formatVnd(returnModalData.totalFine)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                            <span className="text-slate-400 text-[11px]">Nội dung:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-semibold text-slate-700">
                                {`Phat ${returnModalData.bookId} ${returnModalData.readerId}`}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyText(
                                    `Phat ${returnModalData.bookId} ${returnModalData.readerId}`,
                                    'nội dung chuyển khoản'
                                  )
                                }
                                className="p-1 rounded hover:bg-slate-100 text-slate-500 cursor-pointer"
                                title="Sao chép nội dung"
                              >
                                {copiedBankField === 'nội dung chuyển khoản' ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <p className="text-[11px] text-emerald-700 font-medium pt-1">
                            ✓ Mã QR đã được nhúng sẵn số tiền phạt và nội dung chuyển khoản tự động.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-slate-400 space-y-2">
                        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                        <p className="font-semibold text-xs text-slate-700">
                          Chưa cài đặt tài khoản ngân hàng nhận tiền
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                          Vui lòng vào trang <strong>Cài đặt</strong> để chọn ngân hàng và số tài khoản nhận tiền phạt trước khi sử dụng tính năng VietQR.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Nút hành động Modal */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <div className="text-xs text-slate-400 hidden sm:block">
                Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-slate-700 font-mono font-bold text-[10px]">Enter</kbd> để xác nhận, <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-slate-700 font-mono font-bold text-[10px]">Esc</kbd> để hủy
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setReturnModalData(null);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
                >
                  Hủy bỏ (Esc)
                </button>

                {returnModalData.totalFine > 0 && (
                  <button
                    type="button"
                    disabled={isProcessingReturn}
                    onClick={() => handleConfirmReturn(true)}
                    className="px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                    title="Miễn tiền phạt cho độc giả này và hoàn tất thu hồi sách"
                  >
                    Miễn Phạt
                  </button>
                )}

                <button
                  type="button"
                  disabled={isProcessingReturn}
                  onClick={() => handleConfirmReturn(false)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isProcessingReturn
                      ? 'Đang xử lý...'
                      : returnModalData.totalFine > 0
                      ? `Xác Nhận Đã Thu ${formatVnd(returnModalData.totalFine)}`
                      : 'Xác Nhận Thu Hồi Sách (Enter)'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
