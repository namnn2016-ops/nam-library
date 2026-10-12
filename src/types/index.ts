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
