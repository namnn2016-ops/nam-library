// Dịch vụ gửi email thông báo qua Resend API
// Bảo mật: Thực hiện qua Electron IPC Main Process (Node.js) để tránh lộ API Key trên Web bundle
import type { EmailBookItem } from '../types';

export type { EmailBookItem };

function normalizeBooks(
  books: (string | EmailBookItem)[],
  fallbackDueDate?: string
): EmailBookItem[] {
  return books.map((b) => {
    if (typeof b === 'string') {
      return {
        title: b,
        dueDate: fallbackDueDate || 'Chưa xác định',
      };
    }
    return {
      title: b.title,
      dueDate: b.dueDate || fallbackDueDate || 'Chưa xác định',
      daysDiff: b.daysDiff,
    };
  });
}

/**
 * Kiểm tra xem Resend API Key đã được cấu hình hay chưa
 */
export async function isResendKeyConfigured(customApiKey?: string): Promise<boolean> {
  if (customApiKey && customApiKey.trim().length > 0) return true;

  if (window.electronAPI?.getEmailStatus) {
    try {
      const status = await window.electronAPI.getEmailStatus(customApiKey);
      return status.isConfigured;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Gửi email an toàn qua Electron IPC (hoặc API Key đã lưu trong CSDL)
 */
async function dispatchEmail(options: {
  to: string;
  subject: string;
  html: string;
  apiKey?: string;
  fromEmail?: string;
}): Promise<{ success: boolean; message: string }> {
  // 1. Ưu tiên gửi qua Electron Main Process (Node.js) - Bảo mật tuyệt đối, không lộ mã
  if (window.electronAPI?.sendEmail) {
    return await window.electronAPI.sendEmail(options);
  }

  // 2. Chạy trên Web: Chỉ gửi nếu có API Key người dùng tự lưu trong CSDL SQLite/Local
  const activeKey = (options.apiKey || '').trim();
  if (!activeKey) {
    return {
      success: false,
      message:
        'Chưa cấu hình Resend API Key! Vui lòng thiết lập API Key trong phần Cài đặt hoặc khởi chạy ứng dụng Desktop.',
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeKey}`,
      },
      body: JSON.stringify({
        from: options.fromEmail || 'nam-library@hellootis.cloud-ip.cc',
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      let msg = errData.message || `Lỗi HTTP ${response.status}`;
      if (typeof msg === 'string' && msg.includes('only send testing emails')) {
        msg = `Resend đang ở chế độ thử nghiệm (${options.fromEmail || 'onboarding@resend.dev'}): Chỉ cho phép gửi đến email chính chủ tài khoản Resend. Để gửi đến các email khác (${options.to}), cần xác minh tên miền tại resend.com/domains hoặc nhập email bạn đọc trùng email tài khoản Resend.`;
      }
      return {
        success: false,
        message: msg,
      };
    }

    return {
      success: true,
      message: `Đã gửi email thành công qua Resend đến ${options.to}!`,
    };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      success: false,
      message: `Gửi email thất bại: ${error.message || 'Lỗi mạng'}`,
    };
  }
}

/**
 * Gửi email thông báo sách ĐÃ QUÁ HẠN (hỗ trợ hiển thị riêng ngày đến hạn cho từng cuốn sách)
 */
export async function sendOverdueNotificationEmail(
  readerName: string,
  readerEmail: string,
  books: (string | EmailBookItem)[],
  fallbackDueDate?: string,
  config?: { apiKey?: string; fromEmail?: string }
): Promise<{ success: boolean; message: string }> {
  if (!readerEmail) {
    return {
      success: false,
      message: `Bạn đọc "${readerName}" chưa có địa chỉ email trong hồ sơ!`,
    };
  }

  const items = normalizeBooks(books, fallbackDueDate);
  if (items.length === 0) {
    return {
      success: false,
      message: 'Không có danh sách sách quá hạn để gửi thông báo!',
    };
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #fecdd3; border-radius: 14px; padding: 26px; background-color: #fff1f2;">
      <h2 style="color: #e11d48; margin-top: 0; font-size: 20px; display: flex; align-items: center; gap: 8px;">
        ⚠️ Thông Báo Sách Quá Hạn - Thư Viện Nam Library
      </h2>
      <p style="font-size: 15px;">Kính gửi bạn đọc <strong>${readerName}</strong>,</p>
      <p style="font-size: 14px; color: #334155;">
        Hệ thống thư viện ghi nhận các cuốn sách dưới đây bạn đang mượn hiện <strong>đã quá hạn trả</strong>. Chi tiết từng cuốn sách:
      </p>
      <ul style="background: #ffffff; padding: 14px 18px; border-radius: 10px; border: 1px solid #fda4af; list-style: none; margin: 16px 0;">
        ${items
          .map(
            (b) => `
          <li style="margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px dashed #fecdd3;">
            <div style="font-weight: bold; color: #0f172a; font-size: 14px;">📖 ${b.title}</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 3px;">
              Hạn trả: <span style="color: #dc2626; font-weight: bold;">${b.dueDate}</span>
              ${
                typeof b.daysDiff === 'number' && b.daysDiff > 0
                  ? `<span style="color: #b91c1c; font-weight: 600; margin-left: 8px;">(Đã quá hạn ${b.daysDiff} ngày)</span>`
                  : ''
              }
            </div>
          </li>
        `
          )
          .join('')}
      </ul>
      <p style="font-size: 13px; color: #475569;">
        Vui lòng nhanh chóng mang sách đến quầy thư viện để hoàn trả hoặc làm thủ tục gia hạn theo quy định.
      </p>
      <hr style="border: none; border-top: 1px solid #fda4af; margin: 20px 0;" />
      <p style="font-size: 11px; color: #94a3b8; margin-bottom: 0;">
        Email thông báo tự động từ Hệ thống Quản lý Thư viện Nam Library.
      </p>
    </div>
  `;

  return await dispatchEmail({
    to: readerEmail,
    subject: `[Nam Library] CẢNH BÁO: Bạn có ${items.length} cuốn sách đã QUÁ HẠN cần hoàn trả`,
    html,
    apiKey: config?.apiKey,
    fromEmail: config?.fromEmail,
  });
}

/**
 * Gửi email thông báo sách GẦN QUÁ HẠN (Sắp đến hạn trong 1-2 ngày)
 */
export async function sendNearDueNotificationEmail(
  readerName: string,
  readerEmail: string,
  books: (string | EmailBookItem)[],
  fallbackDueDate?: string,
  daysLeft?: number,
  config?: { apiKey?: string; fromEmail?: string }
): Promise<{ success: boolean; message: string }> {
  if (!readerEmail) {
    return {
      success: false,
      message: `Bạn đọc "${readerName}" chưa có địa chỉ email trong hồ sơ!`,
    };
  }

  const items = normalizeBooks(books, fallbackDueDate);
  if (items.length === 0) {
    return {
      success: false,
      message: 'Không có danh sách sách gần đến hạn để gửi thông báo!',
    };
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #fef08a; border-radius: 14px; padding: 26px; background-color: #fefce8;">
      <h2 style="color: #b45309; margin-top: 0; font-size: 20px;">
        ⏰ Nhắc Nhở Sách Sắp Đến Hạn Trả - Thư Viện Nam Library
      </h2>
      <p style="font-size: 15px;">Xin chào bạn đọc <strong>${readerName}</strong>,</p>
      <p style="font-size: 14px; color: #334155;">
        Các cuốn sách bạn đang mượn dưới đây sắp đến hạn trả. Chi tiết thời hạn từng cuốn sách:
      </p>
      <ul style="background: #ffffff; padding: 14px 18px; border-radius: 10px; border: 1px solid #fde047; list-style: none; margin: 16px 0;">
        ${items
          .map(
            (b) => `
          <li style="margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px dashed #fef08a;">
            <div style="font-weight: bold; color: #0f172a; font-size: 14px;">📖 ${b.title}</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 3px;">
              Hạn trả: <span style="color: #b45309; font-weight: bold;">${b.dueDate}</span>
              ${
                typeof b.daysDiff === 'number' && b.daysDiff >= 0
                  ? `<span style="color: #d97706; font-weight: 600; margin-left: 8px;">(Còn ${b.daysDiff} ngày nữa đến hạn)</span>`
                  : typeof daysLeft === 'number'
                  ? `<span style="color: #d97706; font-weight: 600; margin-left: 8px;">(Còn ${daysLeft} ngày nữa đến hạn)</span>`
                  : ''
              }
            </div>
          </li>
        `
          )
          .join('')}
      </ul>
      <p style="font-size: 13px; color: #475569;">
        Bạn có thể ghé quầy thư viện để gia hạn thêm nếu chưa đọc xong hoặc hoàn trả sách đúng hạn nhé!
      </p>
      <hr style="border: none; border-top: 1px solid #fde047; margin: 20px 0;" />
      <p style="font-size: 11px; color: #94a3b8; margin-bottom: 0;">
        Email thông báo tự động từ Hệ thống Quản lý Thư viện Nam Library.
      </p>
    </div>
  `;

  return await dispatchEmail({
    to: readerEmail,
    subject: `[Nam Library] Nhắc nhở: Bạn có ${items.length} cuốn sách sắp đến hạn hoàn trả`,
    html,
    apiKey: config?.apiKey,
    fromEmail: config?.fromEmail,
  });
}
