import sql from '../lib/neon';
import type { Book, Reader, BorrowRecord, AppSettings, OverdueReaderInfo } from '../types';
import { sendOverdueNotificationEmail, sendNearDueNotificationEmail } from './email';

const DEFAULT_SETTINGS: AppSettings = {
  sound_enabled: true,
  borrow_days: 14,
  max_books_per_reader: 3,
  auto_email_enabled: true,
};

export const dbService = {
  // ==================== CÀI ĐẶT (SETTINGS) ====================
  async getSettings(): Promise<AppSettings> {
    try {
      const rows = (await sql.query(
        'SELECT setting_key, setting_value FROM app_settings'
      )) as Array<{ setting_key: string; setting_value: string }>;

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
      console.warn('Lỗi đọc settings từ Neon, dùng mặc định:', err);
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...newSettings };

    try {
      const pairs = [
        ['sound_enabled', String(updated.sound_enabled)],
        ['borrow_days', String(updated.borrow_days)],
        ['max_borrow_days', String(updated.borrow_days)],
        ['max_books_per_reader', String(updated.max_books_per_reader)],
        ['auto_email_enabled', String(updated.auto_email_enabled ?? true)],
      ];

      for (const [key, val] of pairs) {
        await sql.query(
          `INSERT INTO app_settings (setting_key, setting_value)
           VALUES ($1, $2)
           ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2`,
          [key, val]
        );
      }
    } catch (err) {
      console.error('Lỗi lưu settings lên Neon:', err);
      throw new Error('Không thể lưu cài đặt lên cơ sở dữ liệu Neon.');
    }

    return updated;
  },

  // ==================== BẠN ĐỌC (READERS) ====================
  async getReaders(): Promise<Reader[]> {
    // Tự động quét và dọn dẹp bạn đọc hết hạn trước khi tải danh sách
    await this.cleanupExpiredReaders();

    try {
      const rows = (await sql.query(
        `SELECT id, name, dob, email, avatar, expiry_date,
                to_char(created_at, 'YYYY-MM-DD') as created_at
         FROM readers
         ORDER BY created_at DESC, id ASC`
      )) as Reader[];

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
      console.error('Lỗi lấy danh sách bạn đọc từ Neon:', err);
      return [];
    }
  },

  async getReaderById(id: string): Promise<Reader | null> {
    const cleanId = id.trim().toUpperCase();
    try {
      const rows = (await sql.query(
        `SELECT id, name, dob, email, avatar, expiry_date,
                to_char(created_at, 'YYYY-MM-DD') as created_at
         FROM readers
         WHERE UPPER(id) = UPPER($1)
         LIMIT 1`,
        [cleanId]
      )) as Reader[];

      if (rows.length === 0) return null;
      return {
        ...rows[0],
        id: String(rows[0].id),
      };
    } catch (err) {
      console.error('Lỗi tìm bạn đọc theo ID từ Neon:', err);
      return null;
    }
  },

  async addReader(reader: Omit<Reader, 'created_at'>): Promise<Reader> {
    const cleanId = reader.id.trim().toUpperCase();
    const existing = await this.getReaderById(cleanId);
    if (existing) {
      throw new Error(`Mã bạn đọc "${cleanId}" đã tồn tại trong hệ thống!`);
    }

    try {
      await sql.query(
        `INSERT INTO readers (id, name, dob, email, avatar, expiry_date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
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
      console.error('Lỗi thêm bạn đọc vào Neon:', error);
      throw new Error(error.message || 'Lỗi lưu bạn đọc lên Neon.');
    }
  },

  async updateReader(updated: Reader): Promise<Reader> {
    const cleanId = updated.id.trim().toUpperCase();
    try {
      await sql.query(
        `UPDATE readers
         SET name = $2, dob = $3, email = $4, avatar = $5, expiry_date = $6
         WHERE UPPER(id) = UPPER($1)`,
        [
          cleanId,
          updated.name.trim(),
          updated.dob || null,
          updated.email ? updated.email.trim() : null,
          updated.avatar ? updated.avatar.trim() : null,
          updated.expiry_date || null,
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
    try {
      // Kiểm tra xem bạn đọc có đang mượn sách chưa trả không
      const activeBorrows = await this.getActiveBorrowsByReader(cleanId);
      if (activeBorrows.length > 0) {
        throw new Error('Bạn đọc này đang mượn sách chưa trả, không thể xóa!');
      }

      await sql.query('DELETE FROM readers WHERE UPPER(id) = UPPER($1)', [cleanId]);
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(error.message || 'Lỗi xóa bạn đọc trên Neon.');
    }
  },

  /**
   * Tự động xóa các bạn đọc hết hạn thẻ theo ngày hiện tại
   */
  async cleanupExpiredReaders(): Promise<void> {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await sql.query(
        `DELETE FROM readers
         WHERE expiry_date IS NOT NULL
           AND expiry_date != ''
           AND expiry_date < $1`,
        [todayStr]
      );
    } catch (err) {
      console.warn('Lỗi cleanup bạn đọc hết hạn:', err);
    }
  },

  // ==================== SÁCH (BOOKS) ====================
  async getBooks(): Promise<Book[]> {
    try {
      const rows = (await sql.query(
        `SELECT id, title, owner, status,
                to_char(created_at, 'YYYY-MM-DD') as created_at
         FROM books
         ORDER BY created_at DESC, id ASC`
      )) as Book[];

      return rows.map((b) => ({
        id: String(b.id),
        title: b.title || '',
        owner: b.owner || '',
        status: (b.status as 'AVAILABLE' | 'BORROWED') || 'AVAILABLE',
        created_at: b.created_at || '',
      }));
    } catch (err) {
      console.error('Lỗi lấy danh sách sách từ Neon:', err);
      return [];
    }
  },

  async getBookById(id: string): Promise<Book | null> {
    const cleanId = id.trim().toUpperCase();
    try {
      const rows = (await sql.query(
        `SELECT id, title, owner, status,
                to_char(created_at, 'YYYY-MM-DD') as created_at
         FROM books
         WHERE UPPER(id) = UPPER($1)
         LIMIT 1`,
        [cleanId]
      )) as Book[];

      if (rows.length === 0) return null;
      return {
        ...rows[0],
        id: String(rows[0].id),
        status: (rows[0].status as 'AVAILABLE' | 'BORROWED') || 'AVAILABLE',
      };
    } catch (err) {
      console.error('Lỗi tìm sách theo ID từ Neon:', err);
      return null;
    }
  },

  async addBook(book: Omit<Book, 'status' | 'created_at'>): Promise<Book> {
    const cleanId = book.id.trim().toUpperCase();
    const existing = await this.getBookById(cleanId);
    if (existing) {
      throw new Error(`Mã sách "${cleanId}" đã tồn tại trong hệ thống!`);
    }

    try {
      await sql.query(
        `INSERT INTO books (id, title, owner, status)
         VALUES ($1, $2, $3, 'AVAILABLE')`,
        [cleanId, book.title.trim(), book.owner ? book.owner.trim() : null]
      );

      const created = await this.getBookById(cleanId);
      return created!;
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(error.message || 'Lỗi thêm sách vào Neon.');
    }
  },

  async updateBook(book: Book): Promise<Book> {
    const cleanId = book.id.trim().toUpperCase();
    try {
      await sql.query(
        `UPDATE books
         SET title = $2, owner = $3, status = $4
         WHERE UPPER(id) = UPPER($1)`,
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
    try {
      const activeBorrow = await this.getActiveBorrowByBook(cleanId);
      if (activeBorrow) {
        throw new Error('Sách này đang được mượn, không thể xóa!');
      }

      await sql.query('DELETE FROM books WHERE UPPER(id) = UPPER($1)', [cleanId]);
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(error.message || 'Lỗi xóa sách.');
    }
  },

  // ==================== MƯỢN / TRẢ (BORROW & RETURN) ====================
  async getBorrowRecords(): Promise<BorrowRecord[]> {
    try {
      const rows = (await sql.query(`
        SELECT br.id, br.book_id, br.reader_id,
               b.title as book_title, r.name as reader_name,
               to_char(br.borrow_date, 'YYYY-MM-DD') as borrow_date,
               to_char(br.due_date, 'YYYY-MM-DD') as due_date,
               to_char(br.return_date, 'YYYY-MM-DD') as return_date,
               br.status, br.renew_count
        FROM borrow_records br
        LEFT JOIN books b ON UPPER(br.book_id) = UPPER(b.id)
        LEFT JOIN readers r ON UPPER(br.reader_id) = UPPER(r.id)
        ORDER BY br.id DESC
      `)) as BorrowRecord[];

      return rows.map((r) => ({
        ...r,
        book_id: String(r.book_id),
        reader_id: String(r.reader_id),
        book_title: r.book_title || r.book_id,
        reader_name: r.reader_name || r.reader_id,
      }));
    } catch (err) {
      console.error('Lỗi lấy bản ghi mượn sách:', err);
      return [];
    }
  },

  async getActiveBorrowsByReader(readerId: string): Promise<BorrowRecord[]> {
    const cleanId = readerId.trim().toUpperCase();
    try {
      const rows = (await sql.query(
        `SELECT br.id, br.book_id, br.reader_id,
                b.title as book_title, r.name as reader_name,
                to_char(br.borrow_date, 'YYYY-MM-DD') as borrow_date,
                to_char(br.due_date, 'YYYY-MM-DD') as due_date,
                br.status, br.renew_count
         FROM borrow_records br
         LEFT JOIN books b ON UPPER(br.book_id) = UPPER(b.id)
         LEFT JOIN readers r ON UPPER(br.reader_id) = UPPER(r.id)
         WHERE UPPER(br.reader_id) = UPPER($1) AND br.status = 'BORROWED'
         ORDER BY br.id DESC`,
        [cleanId]
      )) as BorrowRecord[];

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
    try {
      const rows = (await sql.query(
        `SELECT br.id, br.book_id, br.reader_id,
                b.title as book_title, r.name as reader_name,
                to_char(br.borrow_date, 'YYYY-MM-DD') as borrow_date,
                to_char(br.due_date, 'YYYY-MM-DD') as due_date,
                br.status, br.renew_count
         FROM borrow_records br
         LEFT JOIN books b ON UPPER(br.book_id) = UPPER(b.id)
         LEFT JOIN readers r ON UPPER(br.reader_id) = UPPER(r.id)
         WHERE UPPER(br.book_id) = UPPER($1) AND br.status = 'BORROWED'
         LIMIT 1`,
        [cleanId]
      )) as BorrowRecord[];

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
  async borrowBook(readerId: string, bookId: string): Promise<{ record: BorrowRecord; book: Book; reader: Reader }> {
    const cleanReaderId = readerId.trim().toUpperCase();
    const cleanBookId = bookId.trim().toUpperCase();

    // 1. Kiểm tra bạn đọc
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

    // Kiểm tra giới hạn số lượng sách mượn
    const settings = await this.getSettings();
    const activeBorrows = await this.getActiveBorrowsByReader(cleanReaderId);
    if (settings.max_books_per_reader > 0 && activeBorrows.length >= settings.max_books_per_reader) {
      throw new Error(`Bạn đọc đã mượn tối đa ${settings.max_books_per_reader} cuốn sách theo quy định!`);
    }

    // 2. Kiểm tra sách
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

    // 3. Tính hạn trả
    const borrowDays = settings.borrow_days || 14;
    const now = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + borrowDays);

    const borrowDateStr = now.toISOString().split('T')[0];
    const dueDateStr = dueDate.toISOString().split('T')[0];

    // Thêm bản ghi vào Neon
    const insertRes = (await sql.query(
      `INSERT INTO borrow_records (book_id, reader_id, borrow_date, due_date, status, renew_count)
       VALUES ($1, $2, $3::timestamp, $4::timestamp, 'BORROWED', 0)
       RETURNING id`,
      [cleanBookId, cleanReaderId, borrowDateStr, dueDateStr]
    )) as Array<{ id: number }>;

    // Cập nhật trạng thái sách thành BORROWED
    await sql.query(
      "UPDATE books SET status = 'BORROWED' WHERE UPPER(id) = UPPER($1)",
      [cleanBookId]
    );

    const newRecord: BorrowRecord = {
      id: insertRes[0]?.id || Date.now(),
      book_id: book.id,
      reader_id: reader.id,
      book_title: book.title,
      reader_name: reader.name,
      borrow_date: borrowDateStr,
      due_date: dueDateStr,
      status: 'BORROWED',
      renew_count: 0,
    };

    return { record: newRecord, book, reader };
  },

  /**
   * Trả sách (Tự động theo mã sách)
   */
  async returnBook(bookId: string): Promise<{ record: BorrowRecord; book: Book; readerName: string }> {
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

    // Cập nhật bản ghi mượn sang RETURNED
    await sql.query(
      `UPDATE borrow_records
       SET status = 'RETURNED', return_date = $2::timestamp
       WHERE id = $1`,
      [activeBorrow.id, todayStr]
    );

    // Cập nhật sách sang AVAILABLE
    await sql.query(
      "UPDATE books SET status = 'AVAILABLE' WHERE UPPER(id) = UPPER($1)",
      [cleanBookId]
    );

    return {
      record: {
        ...activeBorrow,
        status: 'RETURNED',
        return_date: todayStr,
      },
      book,
      readerName: activeBorrow.reader_name || activeBorrow.reader_id,
    };
  },

  /**
   * Gia hạn sách
   */
  async renewBooks(recordIds: (string | number)[]): Promise<BorrowRecord[]> {
    const settings = await this.getSettings();
    const daysToAdd = settings.borrow_days || 14;
    const renewed: BorrowRecord[] = [];

    for (const rid of recordIds) {
      await sql.query(
        `UPDATE borrow_records
         SET due_date = due_date + ($2 || ' days')::interval,
             renew_count = COALESCE(renew_count, 0) + 1
         WHERE id = $1 AND status = 'BORROWED'`,
        [rid, daysToAdd]
      );
    }

    return renewed;
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

    // Xác định bạn đọc quá hạn
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

    // Dữ liệu biểu đồ 6 tháng gần nhất từ dữ liệu thực tế
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

  /**
   * Tự động quét và gửi email khi sách GẦN QUÁ HẠN hoặc ĐÃ QUÁ HẠN
   * Theo đúng yêu cầu: "gần quá hạn hoặc quá là tự động gửi mail luôn"
   */
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

        // Kiểm tra xem đã gửi email hôm nay cho bạn đọc/sách này chưa
        const checkSent = (await sql.query(
          `SELECT id FROM email_notifications
           WHERE reader_id = $1 AND book_id = $2 AND email_type = $3 AND sent_date = $4
           LIMIT 1`,
          [reader.id, b.book_id, emailType, todayStr]
        )) as Array<{ id: number }>;

        if (checkSent.length > 0) {
          continue; // Đã gửi hôm nay rồi, không gửi trùng lặp
        }

        // Tiến hành gửi email tự động
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
          // Lưu vết vào Neon để không spam lại trong ngày
          await sql.query(
            `INSERT INTO email_notifications (record_id, reader_id, reader_email, book_id, email_type, sent_date)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [Number(b.id) || null, reader.id, reader.email, b.book_id, emailType, todayStr]
          );

          const typeText = emailType === 'OVERDUE' ? 'quá hạn' : 'gần quá hạn';
          notificationsSent.push(
            `Đã tự động gửi email nhắc ${typeText} đến ${reader.name} (${reader.email}) cho cuốn "${b.book_title || b.book_id}"!`
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
   * Xóa sạch toàn bộ dữ liệu trên Neon
   */
  async clearAllData(): Promise<void> {
    try {
      await sql.query('DELETE FROM email_notifications');
      await sql.query('DELETE FROM borrow_records');
      await sql.query('DELETE FROM books');
      await sql.query('DELETE FROM readers');
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(error.message || 'Lỗi khi xóa dữ liệu trên Neon.');
    }
  },
};
