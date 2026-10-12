// Dịch vụ gửi email thông báo qua Resend API
// API Key được đọc trực tiếp và bảo mật từ file .env (VITE_RESEND_API_KEY) theo đúng yêu cầu người dùng

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';
const RESEND_FROM_EMAIL = import.meta.env.VITE_RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export function isResendKeyConfigured(): boolean {
  return Boolean(RESEND_API_KEY && RESEND_API_KEY.trim().length > 0);
}

/**
 * Gửi email thông báo sách ĐÃ QUÁ HẠN
 */
export async function sendOverdueNotificationEmail(
  readerName: string,
  readerEmail: string,
  bookTitles: string[],
  dueDate: string
): Promise<{ success: boolean; message: string }> {
  if (!readerEmail) {
    return {
      success: false,
      message: `Bạn đọc "${readerName}" chưa có địa chỉ email!`,
    };
  }

  // Nếu người dùng chưa điền API Key trong file .env -> chạy chế độ mô phỏng và ghi log
  if (!RESEND_API_KEY) {
    console.log(`[Mô phỏng Email Resend] Gửi cảnh báo QUÁ HẠN đến: ${readerEmail}`);
    console.log(`Sách: [${bookTitles.join(', ')}], Hạn: ${dueDate}`);

    return {
      success: true,
      message: `Đã gửi email nhắc quá hạn đến ${readerEmail} (Chế độ mô phỏng - Điền VITE_RESEND_API_KEY trong .env để gửi thật)`,
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [readerEmail],
        subject: `[nam-libary] CẢNH BÁO: Sách mượn đã QUÁ HẠN cần hoàn trả`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #fecdd3; border-radius: 12px; padding: 24px; background-color: #fff1f2;">
            <h2 style="color: #e11d48; margin-top: 0;">⚠️ Thông Báo Sách Quá Hạn - Thư Viện nam-libary</h2>
            <p>Kính gửi bạn đọc <strong>${readerName}</strong>,</p>
            <p>Hệ thống ghi nhận cuốn sách bạn đang mượn hiện <strong>đã quá hạn trả</strong>:</p>
            <ul style="background: #ffffff; padding: 16px 24px; border-radius: 8px; border: 1px solid #fda4af;">
              ${bookTitles.map((t) => `<li style="margin-bottom: 8px;"><strong>${t}</strong> (Hạn trả: <span style="color: #dc2626; font-weight: bold;">${dueDate}</span>)</li>`).join('')}
            </ul>
            <p>Vui lòng nhanh chóng mang sách đến quầy thủ thư để hoàn trả hoặc gia hạn thêm theo quy định.</p>
            <hr style="border: none; border-top: 1px solid #fda4af; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">Hệ thống thông báo tự động nam-libary.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Lỗi HTTP ${response.status}`);
    }

    return {
      success: true,
      message: `Đã gửi email nhắc quá hạn thành công qua Resend đến ${readerEmail}!`,
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
 * Gửi email thông báo sách GẦN QUÁ HẠN (Sắp đến hạn trong 1-2 ngày)
 */
export async function sendNearDueNotificationEmail(
  readerName: string,
  readerEmail: string,
  bookTitles: string[],
  dueDate: string,
  daysLeft: number
): Promise<{ success: boolean; message: string }> {
  if (!readerEmail) {
    return {
      success: false,
      message: `Bạn đọc "${readerName}" chưa có địa chỉ email!`,
    };
  }

  if (!RESEND_API_KEY) {
    console.log(`[Mô phỏng Email Resend] Gửi thông báo GẦN ĐẾN HẠN đến: ${readerEmail} (Còn ${daysLeft} ngày)`);
    return {
      success: true,
      message: `Đã gửi email nhắc sắp đến hạn đến ${readerEmail} (Chế độ mô phỏng - Điền VITE_RESEND_API_KEY trong .env để gửi thật)`,
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [readerEmail],
        subject: `[nam-libary] Nhắc nhở: Sách sắp đến hạn trả (Còn ${daysLeft} ngày)`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #fef08a; border-radius: 12px; padding: 24px; background-color: #fefce8;">
            <h2 style="color: #b45309; margin-top: 0;">⏰ Nhắc Nhở Sách Sắp Đến Hạn Trả</h2>
            <p>Xin chào bạn đọc <strong>${readerName}</strong>,</p>
            <p>Các cuốn sách bạn đang mượn sắp đến hạn trả sau <strong>${daysLeft} ngày nữa</strong>:</p>
            <ul style="background: #ffffff; padding: 16px 24px; border-radius: 8px; border: 1px solid #fde047;">
              ${bookTitles.map((t) => `<li style="margin-bottom: 8px;"><strong>${t}</strong> (Hạn trả: <span style="color: #b45309; font-weight: bold;">${dueDate}</span>)</li>`).join('')}
            </ul>
            <p>Bạn có thể ghé thư viện để gia hạn thêm nếu chưa đọc xong hoặc hoàn trả đúng hạn nhé!</p>
            <hr style="border: none; border-top: 1px solid #fde047; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">Hệ thống thông báo tự động nam-libary.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Lỗi HTTP ${response.status}`);
    }

    return {
      success: true,
      message: `Đã gửi email nhắc sắp đến hạn đến ${readerEmail}!`,
    };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      success: false,
      message: `Gửi email thất bại: ${error.message || 'Lỗi mạng'}`,
    };
  }
}
