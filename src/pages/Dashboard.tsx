import { useState, useEffect } from 'react';
import { 
  BookUp, 
  Library, 
  Users, 
  AlertTriangle, 
  Mail, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { dbService } from '../services/db';
import { sendOverdueNotificationEmail } from '../services/email';
import { useToast } from '../context/ToastContext';
import type { OverdueReaderInfo, BorrowRecord, EmailBookItem } from '../types';

export default function Dashboard() {
  const { showToast } = useToast();
  const [stats, setStats] = useState({
    borrowed_books_count: 0,
    remaining_books_count: 0,
    total_readers_count: 0,
    overdue_readers_count: 0,
    overdue_readers_list: [] as OverdueReaderInfo[],
    chart_data: [] as Array<{ name: string; borrowCount: number; returnCount: number }>,
    recent_borrows: [] as BorrowRecord[],
  });

  const [borrowDays, setBorrowDays] = useState(14);
  const [emailStatus, setEmailStatus] = useState<{ [readerId: string]: string }>({});
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [emailedToday, setEmailedToday] = useState<Set<string>>(new Set());

  const loadData = async () => {
    try {
      const [data, settings, emailedList] = await Promise.all([
        dbService.getDashboardStats(),
        dbService.getSettings(),
        dbService.getReadersEmailedToday(),
      ]);
      setStats(data);
      setBorrowDays(settings.borrow_days || 14);
      setEmailedToday(new Set(emailedList));
    } catch (err) {
      console.error('Lỗi tải dashboard:', err);
    }
  };

  useEffect(() => {
    loadData();
    // Tự động làm mới mỗi 15 giây
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSendReminder = async (item: OverdueReaderInfo) => {
    setSendingEmail(item.reader.id);

    // Chuyển danh sách sách quá hạn kèm chính xác ngày đến hạn của từng cuốn
    const books: EmailBookItem[] = item.overdue_books.map((b) => ({
      title: b.book_title || b.book_id,
      dueDate: b.due_date,
      daysDiff: b.days_overdue,
    }));

    const settings = await dbService.getSettings();

    const res = await sendOverdueNotificationEmail(
      item.reader.name,
      item.reader.email || '',
      books,
      undefined,
      {
        apiKey: settings.resend_api_key,
        fromEmail: settings.resend_from_email,
      }
    );

    setEmailStatus((prev) => ({
      ...prev,
      [item.reader.id]: res.message,
    }));
    setSendingEmail(null);

    if (res.success) {
      // Ghi nhận vào lịch sử CSDL để luồng tự động không gửi lặp lại trong ngày
      await dbService.recordEmailSent(
        item.reader.id,
        item.reader.email || '',
        'OVERDUE',
        books.map((b) => b.title).join(', ')
      );
      setEmailedToday((prev) => new Set(prev).add(item.reader.id.toUpperCase()));
      showToast(`Đã gửi email nhắc quá hạn đến ${item.reader.name}!`, 'success');
    } else {
      showToast(res.message || 'Lỗi gửi email nhắc nhở', 'error');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4 text-amber-300" />
            Bảng điều khiển quản lý thư viện
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Chào mừng trở lại, Thủ thư! 📚
          </h1>
          <p className="text-sm text-indigo-200/90 max-w-xl">
            Theo dõi thống kê mượn trả thời gian thực, quản lý cảnh báo quá hạn và xu hướng độc giả dễ dàng.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 shrink-0">
          <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-300" />
            <span>Hạn mượn chuẩn: {borrowDays} ngày</span>
          </div>
        </div>
      </div>

      {/* 4 THẺ THỐNG KÊ (CARDS) THEO YÊU CẦU TRONG PLAN.MD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Số sách đang mượn */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Đang được mượn
            </span>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookUp className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.borrowed_books_count}
            </span>
            <span className="text-xs text-indigo-600 font-medium">cuốn sách</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Lưu thông ngoài kho
          </p>
        </div>

        {/* Card 2: Số sách còn lại */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sách còn trong kho
            </span>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Library className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.remaining_books_count}
            </span>
            <span className="text-xs text-emerald-600 font-medium">sẵn sàng</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Sẵn sàng cho mượn ngay
          </p>
        </div>

        {/* Card 3: Tổng số lượng bạn đọc */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tổng số bạn đọc
            </span>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.total_readers_count}
            </span>
            <span className="text-xs text-blue-600 font-medium">thành viên</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            Độc giả hợp lệ còn hạn thẻ
          </p>
        </div>

        {/* Card 4: Số bạn đọc đang mượn quá hạn */}
        <div className="bg-white rounded-2xl p-6 border border-rose-200/90 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden bg-rose-50/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
              Bạn đọc quá hạn
            </span>
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600">
              {stats.overdue_readers_count}
            </span>
            <span className="text-xs text-rose-500 font-medium">người trễ hạn</span>
          </div>
          <p className="text-xs text-rose-500 font-medium mt-2 flex items-center gap-1">
            Cần thông báo thu hồi sách
          </p>
        </div>
      </div>

      {/* DANH SÁCH CẢNH BÁO BẠN ĐỌC QUÁ HẠN (YÊU CẦU ĐẶC BIỆT TRONG PLAN.MD: "ngay bên dưới số bạn quá hạn nêu rõ tên bạn đọc") */}
      <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Danh sách cảnh báo Bạn đọc mượn quá hạn
              </h2>
              <p className="text-xs text-slate-500">
                Liệt kê chi tiết tên bạn đọc và các đầu sách chưa hoàn trả đúng hạn
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
            {stats.overdue_readers_list.length} trường hợp cần xử lý
          </span>
        </div>

        {stats.overdue_readers_list.length === 0 ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="font-semibold text-slate-700 text-sm">Tuyệt vời! Hiện tại không có bạn đọc nào bị quá hạn.</p>
            <p className="text-xs text-slate-400">Tất cả sách mượn đều đang trong thời hạn quy định.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.overdue_readers_list.map((item) => (
              <div
                key={item.reader.id}
                className="p-5 rounded-2xl border border-rose-200/70 bg-gradient-to-br from-rose-50/40 via-white to-white flex flex-col justify-between gap-4 hover:border-rose-300 transition-colors shadow-2xs"
              >
                <div className="flex items-start gap-3.5">
                  {item.reader.avatar ? (
                    <img
                      src={item.reader.avatar}
                      alt={item.reader.name}
                      className="w-12 h-12 rounded-xl object-cover border border-rose-200 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 font-bold flex items-center justify-center text-base shrink-0">
                      {item.reader.name.trim().charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base truncate">
                        {item.reader.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-100 text-rose-700 font-semibold shrink-0">
                        {item.reader.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      Email: {item.reader.email || 'Chưa cập nhật'}
                    </p>

                    <div className="mt-2.5 space-y-1.5">
                      {item.overdue_books.map((b) => (
                        <div
                          key={b.record_id}
                          className="flex items-center justify-between text-xs bg-rose-50/80 px-2.5 py-1.5 rounded-lg border border-rose-100"
                        >
                          <span className="font-medium text-slate-800 truncate mr-2">
                            📖 {b.book_title}
                          </span>
                          <span className="text-rose-600 font-bold shrink-0">
                            Quá {b.days_overdue} ngày
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-rose-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500">
                    {emailedToday.has(item.reader.id.toUpperCase()) ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Đã gửi nhắc hôm nay (Tối đa 1 email/ngày)
                      </span>
                    ) : emailStatus[item.reader.id] ? (
                      <span className="text-indigo-600 font-medium">
                        {emailStatus[item.reader.id]}
                      </span>
                    ) : (
                      <span>Nhấn gửi email cảnh báo trực tiếp qua Resend API</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleSendReminder(item)}
                    disabled={sendingEmail === item.reader.id}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 shadow-xs cursor-pointer disabled:opacity-50 ${
                      emailedToday.has(item.reader.id.toUpperCase())
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                        : 'bg-rose-600 text-white hover:bg-rose-700'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>
                      {sendingEmail === item.reader.id
                        ? 'Đang gửi...'
                        : emailedToday.has(item.reader.id.toUpperCase())
                        ? 'Gửi lại email'
                        : 'Gửi email nhắc'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BIỂU ĐỒ (CHARTS) XU HƯỚNG MƯỢN TRẢ THEO THỜI GIAN THEO YÊU CẦU TRONG PLAN.MD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ diện tích xu hướng mượn sách */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Xu hướng số lượng bạn đọc mượn & trả sách
                </h2>
                <p className="text-xs text-slate-500">
                  Thống kê lưu lượng mượn sách tăng/giảm theo từng tháng
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-indigo-600">
                <span className="w-3 h-3 rounded-full bg-indigo-600" />
                <span>Số lượt mượn</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Số lượt trả</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBorrow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorReturn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="borrowCount"
                  name="Mượn sách"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorBorrow)"
                />
                <Area
                  type="monotone"
                  dataKey="returnCount"
                  name="Trả sách"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReturn)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ phân bổ hoạt động */}
        <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Cường độ hoạt động</h2>
            <p className="text-xs text-slate-500">So sánh chỉ số mượn theo quý</p>
            <div className="h-52 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chart_data.slice(2)} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="borrowCount" name="Lượt mượn" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tỷ lệ hoàn trả đúng hạn:</span>
            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              {stats.borrowed_books_count > 0
                ? `${Math.max(
                    0,
                    Math.round(
                      ((stats.borrowed_books_count - stats.overdue_readers_count) /
                        stats.borrowed_books_count) *
                        100
                    )
                  )}%`
                : '100%'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
