import { useState, useEffect } from 'react';
import { 
  Library, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  BookOpen, 
  Sparkles,
  Barcode,
  CheckCircle2,
  Clock,
  RefreshCw
} from 'lucide-react';
import { dbService } from '../services/db';
import { playSuccessBeep } from '../services/audio';
import { useToast } from '../context/ToastContext';
import type { Book } from '../types';

export default function Books() {
  const { showToast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formOwner, setFormOwner] = useState('');
  const [formError, setFormError] = useState('');

  const loadBooks = async () => {
    try {
      const list = await dbService.getBooks();
      setBooks(list);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Lỗi tải kho sách', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const openAddModal = () => {
    setEditingBook(null);
    const count = books.length + 1;
    const generatedId = `MS${String(count).padStart(3, '0')}`;
    setFormId(generatedId);
    setFormTitle('');
    setFormOwner('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (b: Book) => {
    setEditingBook(b);
    setFormId(b.id);
    setFormTitle(b.title);
    setFormOwner(b.owner || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim()) {
      setFormError('Vui lòng nhập tên cuốn sách!');
      return;
    }
    if (!formId.trim()) {
      setFormError('Vui lòng nhập mã sách!');
      return;
    }

    setSubmitting(true);
    try {
      if (editingBook) {
        await dbService.updateBook({
          ...editingBook,
          id: formId.trim().toUpperCase(),
          title: formTitle.trim(),
          owner: formOwner.trim() || undefined,
        });
        showToast(`Đã cập nhật cuốn sách "${formTitle.trim()}"!`, 'success');
      } else {
        await dbService.addBook({
          id: formId.trim().toUpperCase(),
          title: formTitle.trim(),
          owner: formOwner.trim() || undefined,
        });
        showToast(`Đã thêm cuốn sách "${formTitle.trim()}" (${formId.trim().toUpperCase()})!`, 'success');
      }

      await loadBooks();
      setIsModalOpen(false);
      playSuccessBeep();
    } catch (err: unknown) {
      const error = err as Error;
      setFormError(error.message || 'Lỗi khi lưu sách');
      showToast(error.message || 'Lỗi khi lưu sách', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa cuốn sách "${title}" (Mã: ${id})?`)) {
      try {
        await dbService.deleteBook(id);
        await loadBooks();
        playSuccessBeep();
        showToast(`Đã xóa cuốn sách "${title}" (${id}) khỏi hệ thống!`, 'success');
      } catch (err: unknown) {
        const error = err as Error;
        showToast(error.message || 'Không thể xóa cuốn sách này!', 'error');
      }
    }
  };

  const filteredBooks = books.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      (b.owner && b.owner.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <Sparkles className="w-4 h-4" />
            Quản Lý Danh Mục & Kho Sách
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Kho Sách Thư Viện
          </h1>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm sách mới</span>
        </button>
      </div>

      {/* Search & Stats Filter */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên sách, mã sách, chủ sở hữu..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white focus:border-indigo-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Sẵn sàng: {books.filter((b) => b.status === 'AVAILABLE').length} cuốn</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span>Đang mượn: {books.filter((b) => b.status === 'BORROWED').length} cuốn</span>
          </div>
        </div>
      </div>

      {/* Bảng danh sách sách */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">Mã sách</th>
                <th className="py-4 px-6">Tên cuốn sách</th>
                <th className="py-4 px-6">Chủ sở hữu</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6">Ngày thêm</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 mx-auto text-indigo-500 mb-2 animate-spin" />
                    <p className="font-medium text-slate-600">Đang tải kho sách từ cơ sở dữ liệu máy tính...</p>
                  </td>
                </tr>
              ) : filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">Không tìm thấy cuốn sách nào</p>
                  </td>
                </tr>
              ) : (
                filteredBooks.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Barcode className="w-4 h-4 text-slate-400" />
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {b.id}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-900">{b.title}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-600">
                      {b.owner || <span className="text-slate-400 italic">Thư viện</span>}
                    </td>

                    <td className="py-4 px-6">
                      {b.status === 'AVAILABLE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Sẵn sàng trong kho
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                          <Clock className="w-3 h-3" /> Đang được mượn
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-slate-500 text-xs">
                      {b.created_at || 'Trước đó'}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(b)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Sửa thông tin sách"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id, b.title)}
                          disabled={b.status === 'BORROWED'}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                          title={b.status === 'BORROWED' ? 'Không thể xóa sách đang mượn' : 'Xóa cuốn sách'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL THÊM / SỬA SÁCH THEO ĐÚNG YÊU CẦU PLAN.MD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Library className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingBook ? 'Chỉnh Sửa Cuốn Sách' : 'Thêm Sách Mới Vào Kho'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mã sách (Mã vạch) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  disabled={editingBook !== null}
                  placeholder="VD: MS008, 978604..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold outline-none focus:bg-white focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên cuốn sách <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Nhập tựa đề sách..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-indigo-600 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chủ sở hữu <span className="text-slate-400 font-normal">(Không bắt buộc)</span>
                </label>
                <input
                  type="text"
                  value={formOwner}
                  onChange={(e) => setFormOwner(e.target.value)}
                  placeholder="VD: Khoa CNTT, Thư viện Trung tâm..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : editingBook ? 'Lưu thay đổi' : 'Thêm sách'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
