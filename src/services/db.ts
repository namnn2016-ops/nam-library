import type { Book, Reader, BorrowRecord, AppSettings, OverdueReaderInfo } from '../types';
import { sendOverdueNotificationEmail, sendNearDueNotificationEmail } from './email';
import { getStoredDesktopUser } from './auth';

const DEFAULT_SETTINGS: AppSettings = {
  sound_enabled: true,
  borrow_days: 14,
  max_books_per_reader: 3,
  auto_email_enabled: true,
};

// Kiểm tra môi trường Electron
const isElectron = () =>
  typeof window !== 'undefined' &&
  Boolean(window.electronAPI && typeof window.electronAPI.dbQuery === 'function');

// Helper lưu trữ fallback cục bộ theo tài khoản nếu chạy ngoài Electron
function getFallbackStorageKey(subKey: string): string {
  const user = getStoredDesktopUser();
  const userId = user ? user.id.replace(/[^a-zA-Z0-9_-]/g, '_') : 'guest';
  return `nam_lib_${userId}_${subKey}`;
}

function getLocalData<T>(subKey: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(getFallbackStorageKey(subKey));
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalData<T>(subKey: string, value: T): void {
  try {
    localStorage.setItem(getFallbackStorageKey(subKey), JSON.stringify(value));
  } catch (err) {
    console.error('Lỗi ghi LocalStorage:', err);
  }
}

export const dbService = {
  // ==================== CÀI ĐẶT (SETTINGS) ====================
  async getSettings(): Promise<AppSettings> {
    if (!isElectron()) {
      return getLocalData<AppSettings>('settings', DEFAULT_SETTINGS);
    }

    try {
      const rows = await window.electronAPI!.dbQuery<{ setting_key: string; setting_value: string }>(
        'SELECT setting_key, setting_value FROM app_settings'
      );

      const map: Record<string, string> = {};
      rows.forEach((r) => {
        map[r.setting_key] = r.setting_value;
      });

      return {
        sound_enabled: map['sound_enabled'] !== 'false',
        borrow_days: parseInt(map['borrow_days'] || map['max_borrow_days'] || '14', 10),
        max_books_per_reader: parseInt(map['max_books_per_reader'] || '3', 10),
        auto_email_enabled: map['auto_email_enabled'] !== 'false',
      };
    } catch (err) {
      console.warn('Lỗi đọc settings SQLite, dùng mặc định:', err);
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...newSettings };

    if (!isElectron()) {
      setLocalData('settings', updated);
      return updated;
    }

    try {
      const pairs = [
        ['sound_enabled', String(updated.sound_enabled)],
        ['borrow_days', String(updated.borrow_days)],
        ['max_borrow_days', String(updated.borrow_days)],
        ['max_books_per_reader', String(updated.max_books_per_reader)],
        ['auto_email_enabled', String(updated.auto_email_enabled ?? true)],
      ];

      for (const [key, val] of pairs) {
        await window.electronAPI!.dbRun(
          `INSERT INTO app_settings (setting_key, setting_value)
           VALUES (?, ?)
           ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value`,
          [key, val]
        );
      }
    } catch (err) {
      console.error('Lỗi lưu settings vào SQLite cục bộ:', err);
      throw new Error('Không thể lưu cài đặt vào cơ sở dữ liệu trên máy.');
    }

    return updated;
  },

  // ==================== BẠN ĐỌC (READERS) ====================
  async getReaders(): Promise<Reader[]> {
    await this.cleanupExpiredReaders();

    if (!isElectron()) {
      return getLocalData<Reader[]>('readers', []);
    }

    try {
      const rows = await window.electronAPI!.dbQuery<Reader>(
        `SELECT id, name, dob, email, avatar, expiry_date,
                date(created_at) as created_at
         FROM readers
         ORDER BY created_at DESC, id ASC`
      );

      return rows.map((r) => ({
        id: String(r.id),
        name: r.name || '',
        dob: r.dob || '',
        email: r.email || '',
        avatar: r.avatar || '',
        expiry_date: r.expiry_date || null,
        created_at: r.created_at || '',
      }));
    } catch (err) {
      console.error('Lỗi lấy danh sách bạn đọc từ SQLite:', err);
      return [];
    }
  },

  async getReaderById(id: string): Promise<Reader | null> {
    const cleanId = id.trim().toUpperCase();

    if (!isElectron()) {
      const readers = getLocalData<Reader[]>('readers', []);
      return readers.find((r) => r.id.toUpperCase() === cleanId) || null;
    }

    try {
      const rows = await window.electronAPI!.dbQuery<Reader>(
        `SELECT id, name, dob, email, avatar, expiry_date,
                date(created_at) as created_at
         FROM readers
         WHERE UPPER(id) = UPPER(?)
         LIMIT 1`,
        [cleanId]
      );

      if (rows.length === 0) return null;
      return {
        ...rows[0],
        id: String(rows[0].id),
      };
    } catch (err) {
      console.error('Lỗi tìm bạn đọc theo ID từ SQLite:', err);
      return null;
    }
  },

  async addReader(reader: Omit<Reader, 'created_at'>): Promise<Reader> {
    const cleanId = reader.id.trim().toUpperCase();
    const existing = await this.getReaderById(cleanId);
    if (existing) {
      throw new Error(`Mã bạn đọc "${cleanId}" đã tồn tại trong hệ thống!`);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (!isElectron()) {
      const readers = getLocalData<Reader[]>('readers', []);
      const newReader: Reader = {
        ...reader,
        id: cleanId,
        created_at: todayStr,
      };
      readers.unshift(newReader);
      setLocalData('readers', readers);
      return newReader;
    }

    try {
      await window.electronAPI!.dbRun(
        `INSERT INTO readers (id, name, dob, email, avatar, expiry_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          cleanId,
          reader.name.trim(),
          reader.dob || null,
          reader.email ? reader.email.trim() : null,
          reader.avatar ? reader.avatar.trim() : null,
          reader.expiry_date || null,
        ]
      );

      const created = await this.getReaderById(cleanId);
      return created!;
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Lỗi thêm bạn đọc vào SQLite:', error);
      throw new Error(error.message || 'Lỗi lưu bạn đọc vào cơ sở dữ liệu trên máy.');
    }
  },

  async updateReader(updated: Reader): Promise<Reader> {
    const cleanId = updated.id.trim().toUpperCase();

    if (!isElectron()) {
      const readers = getLocalData<Reader[]>('readers', []);
      const idx = readers.findIndex((r) => r.id.toUpperCase() === cleanId);
      if (idx !== -1) {
        readers[idx] = { ...updated, id: cleanId };
        setLocalData('readers', readers);
      }
      return updated;
    }

    try {
      await window.electronAPI!.dbRun(
        `UPDATE readers
         SET name = ?, dob = ?, email = ?, avatar = ?, expiry_date = ?
         WHERE UPPER(id) = UPPER(?)`,
        [
          updated.name.trim(),
          updated.dob || null,
          updated.email ? updated.email.trim() : null,
          updated.avatar ? updated.avatar.trim() : null,
          updated.expiry_date || null,
          cleanId,
        ]
      );
      return updated;
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(error.message || 'Lỗi cập nhật bạn đọc.');
    }
  },

  async deleteReader(id: string): Promise<void> {
    const cleanId = id.trim().toUpperCase();

    const activeBorrows = await this.getActiveBorrowsByReader(cleanId);
    if (activeBorrows.length > 0) {
      throw new Error('Bạn đọc này đang mượn sách chưa trả, không thể xóa!');
    }

    if (!isElectron()) {
      const readers = getLocalData<Reader[]>('readers', []);
      setLocalData(
        'readers',
        readers.filter((r) => r.id.toUpperCase() !== cleanId)
      );
      return;
    }

    try {
      await window.electronAPI!.dbRun('DELETE FROM readers WHERE UPPER(id) = UPPER(?)', [cleanId]);
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(error.message || 'Lỗi xóa bạn đọc trên máy.');
    }
  },

  async cleanupExpiredReaders(): Promise<void> {
    const todayStr = new Date().toISOString().split('T')[0];

    if (!isElectron()) {
      const readers = getLocalData<Reader[]>('readers', []);
      const filtered = readers.filter((r) => !r.expiry_date || r.expiry_date >= todayStr);
      setLocalData('readers', filtered);
      return;
    }

    try {
      await window.electronAPI!.dbRun(
        `DELETE FROM readers
         WHERE expiry_date IS NOT NULL
           AND expiry_date != ''
           AND expiry_date < ?`,
        [todayStr]
      );
    } catch (err) {
      console.warn('Lỗi cleanup bạn đọc hết hạn:', err);
    }
  },

  // ==================== SÁCH (BOOKS) ====================
  async getBooks(): Promise<Book[]> {
    if (!isElectron()) {
      return getLocalData<Book[]>('books', []);
    }

    try {
      const rows = await window.electronAPI!.dbQuery<Book>(
        `SELECT id, title, owner, status,
                date(created_at) as created_at
         FROM books
         ORDER BY created_at DESC, id ASC`
      );

      return rows.map((b) => ({
        id: String(b.id),
        title: b.title || '',
        owner: b.owner || '',
        status: (b.status as 'AVAILABLE' | 'BORROWED') || 'AVAILABLE',
        created_at: b.created_at || '',
      }));
    } catch (err) {
      console.error('Lỗi lấy danh sách sách từ SQLite:', err);
      return [];
    }
  },

  async getBookById(id: string): Promise<Book | null> {
    const cleanId = id.trim().toUpperCase();

    if (!isElectron()) {
      const books = getLocalData<Book[]>('books', []);
      return books.find((b) => b.id.toUpperCase() === cleanId) || null;
    }

    try {
      const rows = await window.electronAPI!.dbQuery<Book>(
        `SELECT id, title, owner, status,
                date(created_at) as created_at
         FROM books
         WHERE UPPER(id) = UPPER(?)
         LIMIT 1`,
        [cleanId]
      );

      if (rows.length === 0) return null;
      return {
        ...rows[0],
        id: String(rows[0].id),
        status: (rows[0].status as 'AVAILABLE' | 'BORROWED') || 'AVAILABLE',
      };
    } catch (err) {
      console.error('Lỗi tìm sách theo ID từ SQLite:', err);
      return null;
    }
  },

  async addBook(book: Omit<Book, 'status' | 'created_at'>): Promise<Book> {
    const cleanId = book.id.trim().toUpperCase();
    const existing = await this.getBookById(cleanId);
    if (existing) {
      throw new Error(`Mã sách "${cleanId}" đã tồn tại trong hệ thống!`);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (!isElectron()) {
      const books = getLocalData<Book[]>('books', []);
      const newBook: Book = {
        ...book,
        id: cleanId,
        status: 'AVAILABLE',
        created_at: todayStr,
      };
      books.unshift(newBook);
      setLocalData('books', books);
      return newBook;
    }

    try {
      await window.electronAPI!.dbRun(
        `INSERT INTO books (id, title, owner, status)
         VALUES (?, ?, ?, 'AVAILABLE')`,
        [cleanId, book.title.trim(), book.owner ? book.owner.trim() : null]
      );

      const created = await this.getBookById(cleanId);
      return created!;
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Lỗi thêm sách vào SQLite:', error);
      throw new Error(error.message || 'Lỗi lưu sách vào cơ sở dữ liệu.');
    }
  },

  async updateBook(book: Book): Promise<Book> {
    const cleanId = book.id.trim().toUpperCase();

    if (!isElectron()) {
      const books = getLocalData<Book[]>('books', []);
      const idx = books.findIndex((b) => b.id.toUpperCase() === cleanId);
      if (idx !== -1) {
        books[idx] = { ...book, id: cleanId };
        setLocalData('books', books);
      }
      return book;
    }

    try {
      await window.electronAPI!.dbRun(
        `UPDATE books
         SET title = ?, owner = ?, status = ?
         WHERE UPPER(id) = UPPER(?)`,
        [cleanId, book.title.trim(), book.owner || null, book.status]
      );
      return book;
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(error.message || 'Lỗi cập nhật sách.');
    }
  },

  async deleteBook(id: string): Promise<void> {
    const cleanId = id.trim().toUpperCase();
    const activeBorrow = await this.getActiveBorrowByBook(cleanId);
    if (activeBorrow) {
      throw new Error('Sách này đang được mượn, không thể xóa!');
    }

    if (!isElectron()) {
      const books = getLocalData<Book[]>('books', []);
      setLocalData(
        'books',
        books.filter((b) => b.id.toUpperCase() !== cleanId)
      );
      return;
    }

    try {
      await window.electronAPI!.dbRun('DELETE FROM books WHERE UPPER(id) = UPPER(?)', [cleanId]);
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(error.message || 'Lỗi xóa sách.');
    }
  },

  // ==================== MƯỢN / TRẢ (BORROW & RETURN) ====================
  async getBorrowRecords(): Promise<BorrowRecord[]> {
    if (!isElectron()) {
      return getLocalData<BorrowRecord[]>('borrow_records', []);
    }

    try {
      const rows = await window.electronAPI!.dbQuery<BorrowRecord>(`
        SELECT br.id, br.book_id, br.reader_id,
               b.title as book_title, r.name as reader_name,
               date(br.borrow_date) as borrow_date,
               date(br.due_date) as due_date,
               date(br.return_date) as return_date,
               br.status, br.renew_count
        FROM borrow_records br
        LEFT JOIN books b ON UPPER(br.book_id) = UPPER(b.id)
        LEFT JOIN readers r ON UPPER(br.reader_id) = UPPER(r.id)
        ORDER BY br.id DESC
      `);

      return rows.map((r) => ({
        ...r,
        book_id: String(r.book_id),
        reader_id: String(r.reader_id),
        book_title: r.book_title || r.book_id,
        reader_name: r.reader_name || r.reader_id,
      }));
    } catch (err) {
      console.error('Lỗi lấy bản ghi mượn sách từ SQLite:', err);
      return [];
    }
  },

  async getActiveBorrowsByReader(readerId: string): Promise<BorrowRecord[]> {
    const cleanId = readerId.trim().toUpperCase();

    if (!isElectron()) {
      const all = getLocalData<BorrowRecord[]>('borrow_records', []);
      return all.filter((b) => b.reader_id.toUpperCase() === cleanId && b.status === 'BORROWED');
    }

    try {
      const rows = await window.electronAPI!.dbQuery<BorrowRecord>(
        `SELECT br.id, br.book_id, br.reader_id,
                b.title as book_title, r.name as reader_name,
                date(br.borrow_date) as borrow_date,
                date(br.due_date) as due_date,
                br.status, br.renew_count
         FROM borrow_records br
         LEFT JOIN books b ON UPPER(br.book_id) = UPPER(b.id)
         LEFT JOIN readers r ON UPPER(br.reader_id) = UPPER(r.id)
         WHERE UPPER(br.reader_id) = UPPER(?) AND br.status = 'BORROWED'
         ORDER BY br.id DESC`,
        [cleanId]
      );

      return rows.map((r) => ({
        ...r,
        book_id: String(r.book_id),
        reader_id: String(r.reader_id),
        book_title: r.book_title || r.book_id,
        reader_name: r.reader_name || r.reader_id,
      }));
    } catch (err) {
      console.error('Lỗi lấy sách mượn của độc giả:', err);
      return [];
    }
  },

  async getActiveBorrowByBook(bookId: string): Promise<BorrowRecord | null> {
    const cleanId = bookId.trim().toUpperCase();

    if (!isElectron()) {
      const all = getLocalData<BorrowRecord[]>('borrow_records', []);
      return (
        all.find((b) => b.book_id.toUpperCase() === cleanId && b.status === 'BORROWED') || null
      );
    }

    try {
      const rows = await window.electronAPI!.dbQuery<BorrowRecord>(
        `SELECT br.id, br.book_id, br.reader_id,
                b.title as book_title, r.name as reader_name,
                date(br.borrow_date) as borrow_date,
                date(br.due_date) as due_date,
                br.status, br.renew_count
         FROM borrow_records br
         LEFT JOIN books b ON UPPER(br.book_id) = UPPER(b.id)
         LEFT JOIN readers r ON UPPER(br.reader_id) = UPPER(r.id)
         WHERE UPPER(br.book_id) = UPPER(?) AND br.status = 'BORROWED'
         LIMIT 1`,
        [cleanId]
      );

      if (rows.length === 0) return null;
      return {
        ...rows[0],
        book_id: String(rows[0].book_id),
        reader_id: String(rows[0].reader_id),
        book_title: rows[0].book_title || rows[0].book_id,
        reader_name: rows[0].reader_name || rows[0].reader_id,
      };
    } catch (err) {
      console.error('Lỗi kiểm tra trạng thái mượn của sách:', err);
      return null;
    }
  },

  /**
   * Mượn sách
   */
  async borrowBook(
    readerId: string,
    bookId: string
  ): Promise<{ record: BorrowRecord; book: Book; reader: Reader }> {
    const cleanReaderId = readerId.trim().toUpperCase();
    const cleanBookId = bookId.trim().toUpperCase();

    const reader = await this.getReaderById(cleanReaderId);
    if (!reader) {
      throw new Error(`Không tìm thấy bạn đọc với mã: ${cleanReaderId}`);
    }

    if (reader.expiry_date) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (reader.expiry_date < todayStr) {
        throw new Error(`Thẻ của bạn đọc "${reader.name}" đã hết hạn vào ngày ${reader.expiry_date}!`);
      }
    }

    const settings = await this.getSettings();
    const activeBorrows = await this.getActiveBorrowsByReader(cleanReaderId);
    if (settings.max_books_per_reader > 0 && activeBorrows.length >= settings.max_books_per_reader) {
      throw new Error(
        `Bạn đọc đã mượn tối đa ${settings.max_books_per_reader} cuốn sách theo quy định!`
      );
    }

    const book = await this.getBookById(cleanBookId);
    if (!book) {
      throw new Error(`Không tìm thấy sách với mã: ${cleanBookId}`);
    }

    if (book.status === 'BORROWED') {
      const existingBorrow = await this.getActiveBorrowByBook(cleanBookId);
      throw new Error(
        `Sách "${book.title}" đang được mượn bởi bạn đọc ${
          existingBorrow?.reader_name || existingBorrow?.reader_id || 'khác'
        }!`
      );
    }

    const borrowDays = settings.borrow_days || 14;
    const now = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + borrowDays);

    const borrowDateStr = now.toISOString().split('T')[0];
    const dueDateStr = dueDate.toISOString().split('T')[0];

    let newRecordId: number | string = Date.now();

    if (!isElectron()) {
      const allBorrows = getLocalData<BorrowRecord[]>('borrow_records', []);
      const newRec: BorrowRecord = {
        id: newRecordId,
        book_id: book.id,
        reader_id: reader.id,
        book_title: book.title,
        reader_name: reader.name,
        borrow_date: borrowDateStr,
        due_date: dueDateStr,
        status: 'BORROWED',
        renew_count: 0,
      };
      allBorrows.unshift(newRec);
      setLocalData('borrow_records', allBorrows);

      // Cập nhật trạng thái sách
      const allBooks = getLocalData<Book[]>('books', []);
      const bookIdx = allBooks.findIndex((b) => b.id.toUpperCase() === cleanBookId);
      if (bookIdx !== -1) {
        allBooks[bookIdx].status = 'BORROWED';
        setLocalData('books', allBooks);
      }

      return { record: newRec, book: { ...book, status: 'BORROWED' }, reader };
    }

    const res = await window.electronAPI!.dbRun(
      `INSERT INTO borrow_records (book_id, reader_id, borrow_date, due_date, status, renew_count)
       VALUES (?, ?, ?, ?, 'BORROWED', 0)`,
      [cleanBookId, cleanReaderId, borrowDateStr, dueDateStr]
    );

    if (res && res.lastID) {
      newRecordId = res.lastID;
    }

    await window.electronAPI!.dbRun(
      "UPDATE books SET status = 'BORROWED' WHERE UPPER(id) = UPPER(?)",
      [cleanBookId]
    );

    const newRecord: BorrowRecord = {
      id: newRecordId,
      book_id: book.id,
      reader_id: reader.id,
      book_title: book.title,
      reader_name: reader.name,
      borrow_date: borrowDateStr,
      due_date: dueDateStr,
      status: 'BORROWED',
      renew_count: 0,
    };

    return { record: newRecord, book: { ...book, status: 'BORROWED' }, reader };
  },

  /**
   * Trả sách (Tự động theo mã sách)
   */
  async returnBook(
    bookId: string
  ): Promise<{ record: BorrowRecord; book: Book; readerName: string }> {
    const cleanBookId = bookId.trim().toUpperCase();
    const book = await this.getBookById(cleanBookId);
    if (!book) {
      throw new Error(`Không tìm thấy sách với mã: ${cleanBookId}`);
    }

    const activeBorrow = await this.getActiveBorrowByBook(cleanBookId);
    if (!activeBorrow) {
      throw new Error(`Sách "${book.title}" hiện không ở trạng thái được mượn!`);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (!isElectron()) {
      const allBorrows = getLocalData<BorrowRecord[]>('borrow_records', []);
      const bIdx = allBorrows.findIndex((b) => String(b.id) === String(activeBorrow.id));
      if (bIdx !== -1) {
        allBorrows[bIdx].status = 'RETURNED';
        allBorrows[bIdx].return_date = todayStr;
        setLocalData('borrow_records', allBorrows);
      }

      const allBooks = getLocalData<Book[]>('books', []);
      const bookIdx = allBooks.findIndex((b) => b.id.toUpperCase() === cleanBookId);
      if (bookIdx !== -1) {
        allBooks[bookIdx].status = 'AVAILABLE';
        setLocalData('books', allBooks);
      }

      return {
        record: { ...activeBorrow, status: 'RETURNED', return_date: todayStr },
        book: { ...book, status: 'AVAILABLE' },
        readerName: activeBorrow.reader_name || activeBorrow.reader_id,
      };
    }

    await window.electronAPI!.dbRun(
      `UPDATE borrow_records
       SET status = 'RETURNED', return_date = ?
       WHERE id = ?`,
      [todayStr, activeBorrow.id]
    );

    await window.electronAPI!.dbRun(
      "UPDATE books SET status = 'AVAILABLE' WHERE UPPER(id) = UPPER(?)",
      [cleanBookId]
    );

    return {
      record: {
        ...activeBorrow,
        status: 'RETURNED',
        return_date: todayStr,
      },
      book: { ...book, status: 'AVAILABLE' },
      readerName: activeBorrow.reader_name || activeBorrow.reader_id,
    };
  },

  /**
   * Gia hạn sách (Renew)
   */
  async renewBooks(recordIds: (string | number)[]): Promise<BorrowRecord[]> {
    const settings = await this.getSettings();
    const daysToAdd = settings.borrow_days || 14;

    if (!isElectron()) {
      const allBorrows = getLocalData<BorrowRecord[]>('borrow_records', []);
      for (const rid of recordIds) {
        const item = allBorrows.find((b) => String(b.id) === String(rid));
        if (item && item.status === 'BORROWED') {
          const d = new Date(item.due_date);
          d.setDate(d.getDate() + daysToAdd);
          item.due_date = d.toISOString().split('T')[0];
          item.renew_count = (item.renew_count || 0) + 1;
        }
      }
      setLocalData('borrow_records', allBorrows);
      return allBorrows.filter((b) => recordIds.map(String).includes(String(b.id)));
    }

    for (const rid of recordIds) {
      await window.electronAPI!.dbRun(
        `UPDATE borrow_records
         SET due_date = date(due_date, '+' || ? || ' days'),
             renew_count = COALESCE(renew_count, 0) + 1
         WHERE id = ? AND status = 'BORROWED'`,
        [daysToAdd, rid]
      );
    }

    return this.getBorrowRecords();
  },

  // ==================== DASHBOARD STATS ====================
  async getDashboardStats() {
    await this.cleanupExpiredReaders();

    const readers = await this.getReaders();
    const books = await this.getBooks();
    const borrows = await this.getBorrowRecords();
    const todayStr = new Date().toISOString().split('T')[0];

    const activeBorrows = borrows.filter((b) => b.status === 'BORROWED');
    const borrowedBooksCount = activeBorrows.length;
    const remainingBooksCount = books.filter((b) => b.status === 'AVAILABLE').length;
    const totalReadersCount = readers.length;

    const overdueReaderMap = new Map<string, OverdueReaderInfo>();

    activeBorrows.forEach((b) => {
      if (b.due_date && b.due_date < todayStr) {
        const reader = readers.find((r) => r.id.toUpperCase() === b.reader_id.toUpperCase());
        if (reader) {
          const diffDays = Math.ceil(
            (new Date(todayStr).getTime() - new Date(b.due_date).getTime()) / (1000 * 3600 * 24)
          );
          if (!overdueReaderMap.has(reader.id)) {
            overdueReaderMap.set(reader.id, {
              reader,
              overdue_books: [],
            });
          }
          overdueReaderMap.get(reader.id)!.overdue_books.push({
            record_id: b.id,
            book_id: b.book_id,
            book_title: b.book_title || b.book_id,
            due_date: b.due_date,
            days_overdue: diffDays,
          });
        }
      }
    });

    const overdueReadersList = Array.from(overdueReaderMap.values());
    const overdueReadersCount = overdueReadersList.length;

    const today = new Date();
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const monthPrefix = `${yyyy}-${mm}`;
      const monthLabel = `T${d.getMonth() + 1}/${yyyy.toString().slice(-2)}`;

      const borrowCount = borrows.filter(
        (b) => b.borrow_date && b.borrow_date.startsWith(monthPrefix)
      ).length;
      const returnCount = borrows.filter(
        (b) => b.return_date && b.return_date.startsWith(monthPrefix)
      ).length;

      chartData.push({
        name: monthLabel,
        borrowCount,
        returnCount,
      });
    }

    return {
      borrowed_books_count: borrowedBooksCount,
      remaining_books_count: remainingBooksCount,
      total_readers_count: totalReadersCount,
      overdue_readers_count: overdueReadersCount,
      overdue_readers_list: overdueReadersList,
      chart_data: chartData,
      recent_borrows: activeBorrows.slice(0, 5),
    };
  },

  // ==================== TỰ ĐỘNG GỬI EMAIL ====================
  async checkAndSendAutoEmails(): Promise<string[]> {
    try {
      const settings = await this.getSettings();
      if (settings.auto_email_enabled === false) {
        return [];
      }

      const activeBorrows = (await this.getBorrowRecords()).filter((b) => b.status === 'BORROWED');
      if (activeBorrows.length === 0) return [];

      const readers = await this.getReaders();
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const notificationsSent: string[] = [];

      for (const b of activeBorrows) {
        if (!b.due_date) continue;

        const reader = readers.find((r) => r.id.toUpperCase() === b.reader_id.toUpperCase());
        if (!reader || !reader.email) continue;

        const dueDateTime = new Date(b.due_date).getTime();
        const todayTime = new Date(todayStr).getTime();
        const diffDays = Math.round((dueDateTime - todayTime) / (1000 * 3600 * 24));

        let emailType: 'OVERDUE' | 'NEAR_DUE' | null = null;
        if (diffDays < 0) {
          emailType = 'OVERDUE';
        } else if (diffDays <= 2) {
          emailType = 'NEAR_DUE';
        }

        if (!emailType) continue;

        if (isElectron()) {
          const checkSent = await window.electronAPI!.dbQuery<{ id: number }>(
            `SELECT id FROM email_notifications
             WHERE reader_id = ? AND book_id = ? AND email_type = ? AND sent_date = ?
             LIMIT 1`,
            [reader.id, b.book_id, emailType, todayStr]
          );

          if (checkSent.length > 0) {
            continue;
          }
        }

        let result;
        if (emailType === 'OVERDUE') {
          result = await sendOverdueNotificationEmail(
            reader.name,
            reader.email,
            [b.book_title || b.book_id],
            b.due_date
          );
        } else {
          result = await sendNearDueNotificationEmail(
            reader.name,
            reader.email,
            [b.book_title || b.book_id],
            b.due_date,
            Math.max(0, diffDays)
          );
        }

        if (result.success) {
          if (isElectron()) {
            await window.electronAPI!.dbRun(
              `INSERT INTO email_notifications (record_id, reader_id, reader_email, book_id, email_type, sent_date)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [Number(b.id) || null, reader.id, reader.email, b.book_id, emailType, todayStr]
            );
          }

          const typeText = emailType === 'OVERDUE' ? 'quá hạn' : 'gần quá hạn';
          notificationsSent.push(
            `Đã tự động gửi email nhắc ${typeText} đến ${reader.name} (${reader.email}) cho cuốn "${
              b.book_title || b.book_id
            }"!`
          );
        }
      }

      return notificationsSent;
    } catch (err) {
      console.error('Lỗi khi tự động quét gửi email:', err);
      return [];
    }
  },

  /**
   * Xóa sạch toàn bộ dữ liệu trên máy tính cho tài khoản hiện tại
   */
  async clearAllData(): Promise<void> {
    if (!isElectron()) {
      setLocalData('readers', []);
      setLocalData('books', []);
      setLocalData('borrow_records', []);
      return;
    }

    try {
      await window.electronAPI!.dbClear();
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(error.message || 'Lỗi khi xóa dữ liệu cục bộ.');
    }
  },
};
