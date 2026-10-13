import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  Calendar, 
  Mail, 
  CheckCircle2, 
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Upload,
  Camera
} from 'lucide-react';
import { dbService } from '../services/db';
import { playSuccessBeep } from '../services/audio';
import { useToast } from '../context/ToastContext';
import type { Reader } from '../types';

export default function Readers() {
  const { showToast } = useToast();
  const [readers, setReaders] = useState<Reader[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReader, setEditingReader] = useState<Reader | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [formExpiry, setFormExpiry] = useState('');
  const [formError, setFormError] = useState('');
  const todayStr = new Date().toISOString().split('T')[0];

  const loadReaders = async () => {
    try {
      const list = await dbService.getReaders();
      setReaders(list);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Lỗi tải danh sách bạn đọc', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReaders();
  }, []);

  const openAddModal = () => {
    setEditingReader(null);
    // Tự sinh mã bạn đọc tiếp theo
    const count = readers.length + 1;
    const generatedId = `BD${String(count).padStart(3, '0')}`;
    setFormId(generatedId);
    setFormName('');
    setFormDob('');
    setFormEmail('');
    setFormAvatar('');
    setFormExpiry('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (r: Reader) => {
    setEditingReader(r);
    setFormId(r.id);
    setFormName(r.name);
    setFormDob(r.dob || '');
    setFormEmail(r.email || '');
    setFormAvatar(r.avatar || '');
    setFormExpiry(r.expiry_date || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Xử lý upload ảnh trực tiếp từ máy tính (nén tối ưu hóa client-side)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn tệp hình ảnh (PNG, JPG, WEBP)!', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Nén và điều chỉnh kích thước ảnh phù hợp cho avatar (tối đa 300x300)
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          setFormAvatar(compressedBase64);
          showToast('Đã tải ảnh lên thành công!', 'success');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Vui lòng nhập họ và tên bạn đọc!');
      return;
    }
    if (!formId.trim()) {
      setFormError('Vui lòng nhập mã bạn đọc!');
      return;
    }

    setSubmitting(true);
    try {
      if (editingReader) {
        await dbService.updateReader({
          id: formId.trim().toUpperCase(),
          name: formName.trim(),
          dob: formDob || undefined,
          email: formEmail.trim() || undefined,
          avatar: formAvatar.trim() || undefined,
          expiry_date: formExpiry || null,
        });
        showToast(`Đã cập nhật bạn đọc "${formName.trim()}" thành công!`, 'success');
      } else {
        await dbService.addReader({
          id: formId.trim().toUpperCase(),
          name: formName.trim(),
          dob: formDob || undefined,
          email: formEmail.trim() || undefined,
          avatar: formAvatar.trim() || undefined,
          expiry_date: formExpiry || null,
        });
        showToast(`Đã thêm bạn đọc "${formName.trim()}" (${formId.trim().toUpperCase()})!`, 'success');
      }

      await loadReaders();
      setIsModalOpen(false);
      playSuccessBeep();
    } catch (err: unknown) {
      const error = err as Error;
      setFormError(error.message || 'Lỗi khi lưu bạn đọc');
      showToast(error.message || 'Lỗi khi lưu bạn đọc', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa bạn đọc "${name}" (Mã: ${id}) khỏi hệ thống?`)) {
      try {
        await dbService.deleteReader(id);
        await loadReaders();
        playSuccessBeep();
        showToast(`Đã xóa bạn đọc "${name}" (${id}) khỏi hệ thống!`, 'success');
      } catch (err: unknown) {
        const error = err as Error;
        showToast(error.message || 'Lỗi khi xóa bạn đọc', 'error');
      }
    }
  };

  const handleManualCleanup = async () => {
    try {
      await dbService.cleanupExpiredReaders();
      await loadReaders();
      showToast('Đã kiểm tra và dọn dẹp các bạn đọc hết hạn thẻ!', 'info');
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Lỗi khi quét dọn bạn đọc hết hạn', 'error');
    }
  };

  // Lọc theo tìm kiếm
  const filteredReaders = readers.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      (r.email && r.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <Sparkles className="w-4 h-4" />
            Quản Lý Hội Viên & Thẻ Thư Viện
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Danh Sách Bạn Đọc
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualCleanup}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs"
            title="Kiểm tra & tự động xóa bạn đọc quá hạn thẻ"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Quét thẻ hết hạn</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm bạn đọc mới</span>
          </button>
        </div>
      </div>

      {/* Search & Info Banner */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên bạn đọc, mã thẻ, email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white focus:border-indigo-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>
            Quy định: Bạn đọc để trống thời hạn sẽ là <strong>Vô thời hạn</strong>. Khi hết hạn thẻ hệ thống sẽ tự động xóa.
          </span>
        </div>
      </div>

      {/* Bảng danh sách bạn đọc */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">Bạn đọc</th>
                <th className="py-4 px-6">Mã thẻ</th>
                <th className="py-4 px-6">Ngày sinh</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Thời hạn thẻ</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 mx-auto text-indigo-500 mb-2 animate-spin" />
                    <p className="font-medium text-slate-600">Đang tải dữ liệu từ cơ sở dữ liệu máy tính...</p>
                  </td>
                </tr>
              ) : filteredReaders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">Không tìm thấy bạn đọc nào</p>
                  </td>
                </tr>
              ) : (
                filteredReaders.map((r) => {
                  const isExpiringSoon =
                    r.expiry_date &&
                    r.expiry_date >= todayStr &&
                    new Date(r.expiry_date).getTime() - new Date(todayStr).getTime() <
                      1000 * 3600 * 24 * 30;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {r.avatar ? (
                            <img
                              src={r.avatar}
                              alt={r.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
                              {r.name.trim().charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 block">{r.name}</span>
                            <span className="text-[11px] text-slate-400">Tham gia: {r.created_at || 'Mới'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {r.id}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-slate-600">
                        {r.dob ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{r.dob}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa cập nhật</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-slate-600">
                        {r.email ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{r.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa cập nhật</span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        {!r.expiry_date ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Vô thời hạn
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            <ShieldAlert className="w-3 h-3" /> Hết hạn: {r.expiry_date}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            Hạn đến: {r.expiry_date}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(r)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Sửa thông tin"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id, r.name)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Xóa bạn đọc"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL THÊM / SỬA BẠN ĐỌC THEO ĐÚNG YÊU CẦU PLAN.MD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingReader ? 'Chỉnh Sửa Bạn Đọc' : 'Thêm Bạn Đọc Mới'}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mã bạn đọc <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    disabled={editingReader !== null}
                    placeholder="VD: BD005"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold outline-none focus:bg-white focus:border-indigo-600"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tên bạn đọc <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Họ và tên..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-indigo-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Địa chỉ Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Khối Tải Lên Ảnh Đại Diện */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Ảnh đại diện bạn đọc
                </label>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  {/* Khung xem trước ảnh */}
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-200 border-2 border-indigo-200 shadow-xs shrink-0 flex items-center justify-center">
                    {formAvatar ? (
                      <img
                        src={formAvatar}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-slate-400 flex flex-col items-center">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Nút bấm chọn ảnh từ máy tính */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer transition-colors shadow-2xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tải ảnh từ máy tính</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>

                      {formAvatar && (
                        <button
                          type="button"
                          onClick={() => setFormAvatar('')}
                          className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-xs border border-rose-200 transition-colors"
                        >
                          Xóa ảnh
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Hỗ trợ PNG, JPG, WEBP. Ảnh tự động tối ưu hóa và lưu an toàn.
                    </p>
                  </div>
                </div>

                {/* Tùy chọn mở rộng: nhập URL ảnh nếu muốn */}
                <details className="mt-2 text-[11px] text-slate-500">
                  <summary className="cursor-pointer hover:text-indigo-600 font-medium select-none">
                    Hoặc nhập URL ảnh trực tuyến...
                  </summary>
                  <div className="mt-1.5">
                    <input
                      type="text"
                      value={formAvatar.startsWith('data:') ? '' : formAvatar}
                      onChange={(e) => setFormAvatar(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 outline-none focus:border-indigo-600 font-mono text-[11px]"
                    />
                  </div>
                </details>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Thời hạn thẻ
                </label>
                <input
                  type="date"
                  value={formExpiry}
                  onChange={(e) => setFormExpiry(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-indigo-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 <strong>Lưu ý:</strong> Nếu bỏ trống thời hạn =&gt; Thẻ sẽ có giá trị <strong>Vô thời hạn</strong>. Khi thẻ hết hạn, hệ thống sẽ tự động xóa bạn đọc khỏi cơ sở dữ liệu.
                </p>
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
                  {submitting ? 'Đang lưu...' : editingReader ? 'Lưu thay đổi' : 'Thêm bạn đọc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
