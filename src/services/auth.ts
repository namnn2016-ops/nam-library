import type { AuthUser, DesktopAuthPayload } from '../types';

const STORAGE_KEY_AUTH = 'nam_library_desktop_user';

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
 * Tạo chuỗi ký tự ngẫu nhiên / mã xác thực đăng nhập Desktop từ tài khoản Clerk
 */
export function generateDesktopAuthToken(user: {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}): string {
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
  const shortChecksum = Math.abs(
    jsonStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ).toString(16);

  return `NAM-AUTH.${base64}.${shortChecksum}`;
}

/**
 * Giải mã và kiểm tra chuỗi ký tự xác thực khi dán vào ứng dụng Desktop
 */
export function parseDesktopAuthToken(tokenInput: string): AuthUser | null {
  if (!tokenInput || typeof tokenInput !== 'string') return null;

  const trimmed = tokenInput.trim();
  if (!trimmed.startsWith('NAM-AUTH.')) {
    // Thử kiểm tra nếu là chuỗi thô json
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
