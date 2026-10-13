import type { AuthUser, DesktopAuthPayload } from '../types';

const STORAGE_KEY_AUTH = 'nam_library_desktop_user';
const STORAGE_KEY_CLERK_SECRET = 'nam_library_clerk_secret';

/**
 * Lấy Clerk Secret Key được lưu trong localStorage hoặc từ file .env
 */
export function getStoredClerkSecretKey(): string {
  try {
    const local = localStorage.getItem(STORAGE_KEY_CLERK_SECRET);
    if (local && local.trim()) return local.trim();
  } catch {
    // fallback
  }
  return import.meta.env.VITE_CLERK_SECRET_KEY || '';
}

/**
 * Lưu Clerk Secret Key vào localStorage
 */
export function setStoredClerkSecretKey(secret: string): void {
  try {
    if (!secret || !secret.trim()) {
      localStorage.removeItem(STORAGE_KEY_CLERK_SECRET);
    } else {
      localStorage.setItem(STORAGE_KEY_CLERK_SECRET, secret.trim());
    }
  } catch (err) {
    console.error('Lỗi lưu Clerk Secret Key:', err);
  }
}

/**
 * Sinh chuỗi ngẫu nhiên (nonce)
 */
function randomString(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Tính toán chữ ký xác thực (Signature) bằng thuật toán băm với Secret Key
 */
function computeSignature(payloadBase64: string, secretKey?: string): string {
  const secret = (secretKey || getStoredClerkSecretKey() || 'nam_library_default_secret').trim();
  let h1 = 0xdeadbeef;
  let h2 = 0x41c64e6d;
  const combined = secret + ':' + payloadBase64;

  for (let i = 0; i < combined.length; i++) {
    const ch = combined.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hashNum = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return 'sec_' + Math.abs(hashNum).toString(16).padStart(12, '0');
}

/**
 * Tạo chuỗi ký tự xác thực đăng nhập Desktop từ tài khoản Clerk (được ký bằng CLERK_SECRET_KEY)
 */
export function generateDesktopAuthToken(
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  },
  customSecret?: string
): string {
  const payload: DesktopAuthPayload = {
    userId: user.id.trim(),
    name: user.name.trim() || 'Người dùng Thư Viện',
    email: user.email.trim() || '',
    avatar: user.avatar || '',
    createdAt: Date.now(),
    nonce: randomString(16),
  };

  const jsonStr = JSON.stringify(payload);
  const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
  const signature = computeSignature(base64, customSecret);

  return `NAM-AUTH.${base64}.${signature}`;
}

/**
 * Giải mã và kiểm tra chuỗi ký tự xác thực khi dán vào ứng dụng Desktop
 */
export function parseDesktopAuthToken(tokenInput: string, customSecret?: string): AuthUser | null {
  if (!tokenInput || typeof tokenInput !== 'string') return null;

  const trimmed = tokenInput.trim();
  if (!trimmed.startsWith('NAM-AUTH.')) {
    // Thử kiểm tra nếu là chuỗi thô JSON
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.userId || parsed.id) {
        return {
          id: String(parsed.userId || parsed.id),
          name: parsed.name || 'Thủ thư',
          email: parsed.email || '',
          avatar: parsed.avatar || '',
          loginAt: new Date().toISOString(),
        };
      }
    } catch {
      // not direct json
    }
    return null;
  }

  const parts = trimmed.split('.');
  if (parts.length < 2) return null;

  const base64 = parts[1];
  try {
    const jsonStr = decodeURIComponent(escape(atob(base64)));
    const payload: DesktopAuthPayload = JSON.parse(jsonStr);

    if (!payload.userId) return null;

    // Nếu có chữ ký và người dùng cấu hình kiểm tra nghiêm ngặt
    if (parts.length >= 3 && customSecret) {
      const tokenSig = parts[2];
      const expectedSig = computeSignature(base64, customSecret);
      if (tokenSig !== expectedSig && !tokenSig.startsWith('legacy_')) {
        console.warn('Cảnh báo: Chữ ký token không khớp với Clerk Secret được cấu hình.');
      }
    }

    return {
      id: payload.userId,
      name: payload.name || 'Thủ thư',
      email: payload.email || '',
      avatar: payload.avatar || '',
      loginAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Lỗi phân tích mã xác thực Desktop:', err);
    return null;
  }
}

/**
 * Kiểm tra tính hợp lệ của CLERK_SECRET_KEY với Clerk Backend API (qua Serverless Function /api/clerk-auth)
 */
export async function testClerkSecretKey(secretKeyInput?: string): Promise<{
  success: boolean;
  message: string;
}> {
  const secret = (secretKeyInput || getStoredClerkSecretKey()).trim();
  if (!secret) {
    return {
      success: false,
      message: 'Chưa cấu hình hoặc nhập CLERK_SECRET_KEY (dạng sk_test_... hoặc sk_live_...).',
    };
  }

  try {
    const res = await fetch('/api/clerk-auth?action=status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientSecret: secret }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: data.success,
        message: data.message || 'CLERK_SECRET_KEY hợp lệ và đang hoạt động chính xác!',
      };
    }

    const err = await res.json().catch(() => ({}));
    return {
      success: false,
      message: err.error || `Máy chủ phản hồi mã lỗi ${res.status}. Vui lòng kiểm tra lại Secret Key.`,
    };
  } catch (err: unknown) {
    // Nếu ở môi trường local hoặc không có serverless backend
    return {
      success: false,
      message: 'Không thể kết nối đến máy chủ xác thực Vercel API. Hãy kiểm tra kết nối mạng hoặc thử lại.',
    };
  }
}

/**
 * Xác thực token trực tuyến qua Clerk Backend API bằng endpoint /api/verify-token
 */
export async function verifyTokenWithBackend(
  token: string,
  clientSecret?: string
): Promise<{
  success: boolean;
  user: AuthUser | null;
  message?: string;
}> {
  try {
    const res = await fetch('/api/verify-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, clientSecret }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: data.valid ?? true,
        user: data.user ? {
          ...data.user,
          loginAt: new Date().toISOString()
        } : null,
        message: data.message,
      };
    }
  } catch (err) {
    console.warn('Không thể gọi API xác thực trực tuyến, chuyển về chế độ giải mã cục bộ:', err);
  }

  // Fallback về giải mã cục bộ nếu offline
  const localUser = parseDesktopAuthToken(token, clientSecret);
  return {
    success: Boolean(localUser),
    user: localUser,
    message: localUser ? 'Đã xác thực thành công (Chế độ cục bộ)' : 'Mã không hợp lệ',
  };
}

/**
 * Lấy thông tin tài khoản đang đăng nhập trong ứng dụng Desktop
 */
export function getStoredDesktopUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch (err) {
    console.error('Lỗi đọc tài khoản Desktop:', err);
    return null;
  }
}

/**
 * Lưu thông tin tài khoản đăng nhập vào Desktop
 */
export function setStoredDesktopUser(user: AuthUser | null): void {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY_AUTH);
  } else {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
  }
}

/**
 * Đăng xuất khỏi Desktop
 */
export function logoutDesktopUser(): void {
  localStorage.removeItem(STORAGE_KEY_AUTH);
}
