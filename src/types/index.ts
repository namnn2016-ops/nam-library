export interface Reader {
  id: string; // Mã bạn đọc (VD: BD001, BD002...)
  name: string;
  dob?: string;
  email?: string;
  avatar?: string;
  expiry_date?: string | null; // Nếu null hoặc rỗng = Vô thời hạn
  created_at?: string;
}

export interface Book {
  id: string; // Mã sách (VD: MS001, MS002...)
  title: string;
  owner?: string;
  status: 'AVAILABLE' | 'BORROWED';
  created_at?: string;
}

export interface BorrowRecord {
  id: string | number;
  book_id: string;
  reader_id: string;
  book_title?: string;
  reader_name?: string;
  borrow_date: string;
  due_date: string;
  return_date?: string | null;
  status: 'BORROWED' | 'RETURNED';
  renew_count?: number;
}

export interface AppSettings {
  sound_enabled: boolean;
  borrow_days: number;
  max_books_per_reader: number; // 0 hoặc rỗng = Vô hạn
  auto_email_enabled?: boolean; // Tự động gửi email khi gần quá hạn hoặc quá hạn
  resend_api_key?: string; // Khóa API tùy chỉnh (Lưu trong SQLite an toàn trên máy)
  resend_from_email?: string; // Địa chỉ email gửi (Mặc định onboarding@resend.dev)
  late_fee_per_day: number; // Tiền phạt theo ngày trễ (VNĐ/ngày)
  bank_bin?: string; // Mã BIN ngân hàng VietQR
  bank_code?: string; // Mã viết tắt ngân hàng
  bank_name?: string; // Tên đầy đủ ngân hàng
  bank_account_no?: string; // Số tài khoản ngân hàng
  bank_account_name?: string; // Tên chủ tài khoản ngân hàng
}

export interface PenaltyRecord {
  id?: number | string;
  borrow_id?: number | string;
  reader_id: string;
  reader_name?: string;
  book_id: string;
  book_title?: string;
  days_overdue: number;
  fee_per_day: number;
  total_fee: number;
  paid_amount: number;
  payment_method: 'CASH' | 'BANK' | 'WAIVED';
  paid_date: string;
  notes?: string;
}

export interface EmailBookItem {
  title: string;
  dueDate: string;
  daysDiff?: number; // Quá hạn (nếu âm hoặc số dương biểu thị số ngày quá hạn) hoặc số ngày còn lại
}

export interface OverdueReaderInfo {
  reader: Reader;
  overdue_books: Array<{
    record_id: string | number;
    book_id: string;
    book_title: string;
    due_date: string;
    days_overdue: number;
  }>;
}

export interface NearDueReaderInfo {
  reader: Reader;
  near_due_books: Array<{
    record_id: string | number;
    book_id: string;
    book_title: string;
    due_date: string;
    days_left: number;
  }>;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  loginAt?: string;
}

export interface DesktopAuthPayload {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: number;
  nonce: string;
}

