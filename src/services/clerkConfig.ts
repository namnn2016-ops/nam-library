// Quản lý cấu hình Clerk API Keys (Publishable Key & Secret Key)
const STORAGE_PUB_KEY = 'nam_library_clerk_pub_key';
const STORAGE_SECRET_KEY = 'nam_library_clerk_secret';

// Khóa mặc định từ .env (nếu có)
const ENV_PUB_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
const ENV_SECRET_KEY =
  import.meta.env.CLERK_SECRET_KEY ||
  import.meta.env.VITE_CLERK_SECRET_KEY ||
  '';

/**
 * Kiểm tra xem một Publishable Key có phải định dạng hợp lệ của Clerk hay không
 */
export function isValidClerkPubKey(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  // Key Clerk chuẩn bắt đầu bằng pk_test_ hoặc pk_live_ và có độ dài hợp lý
  return (
    (trimmed.startsWith('pk_test_') || trimmed.startsWith('pk_live_')) &&
    trimmed.length >= 25 &&
    !trimmed.includes('xxxxxxxx') &&
    !trimmed.includes('placeholder')
  );
}

/**
 * Kiểm tra xem một Secret Key có phải định dạng hợp lệ của Clerk hay không
 */
export function isValidClerkSecretKey(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return (
    (trimmed.startsWith('sk_test_') || trimmed.startsWith('sk_live_')) &&
    trimmed.length >= 25 &&
    !trimmed.includes('xxxxxxxx') &&
    !trimmed.includes('placeholder')
  );
}

/**
 * Lấy Publishable Key hiện tại (ưu tiên localStorage người dùng nhập, sau đó tới .env)
 */
export function getClerkPublishableKey(): string {
  try {
    const saved = localStorage.getItem(STORAGE_PUB_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // fallback
  }
  return ENV_PUB_KEY.trim();
}

/**
 * Lưu Publishable Key vào localStorage
 */
export function setClerkPublishableKey(key: string): void {
  try {
    if (!key || !key.trim()) {
      localStorage.removeItem(STORAGE_PUB_KEY);
    } else {
      localStorage.setItem(STORAGE_PUB_KEY, key.trim());
    }
  } catch (err) {
    console.error('Lỗi lưu Clerk Publishable Key:', err);
  }
}

/**
 * Lấy Secret Key hiện tại
 */
export function getClerkSecretKey(): string {
  try {
    const saved = localStorage.getItem(STORAGE_SECRET_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // fallback
  }
  return ENV_SECRET_KEY.trim();
}

/**
 * Lưu Secret Key vào localStorage
 */
export function setClerkSecretKey(key: string): void {
  try {
    if (!key || !key.trim()) {
      localStorage.removeItem(STORAGE_SECRET_KEY);
    } else {
      localStorage.setItem(STORAGE_SECRET_KEY, key.trim());
    }
  } catch (err) {
    console.error('Lỗi lưu Clerk Secret Key:', err);
  }
}
