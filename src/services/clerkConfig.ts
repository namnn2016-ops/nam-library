// Cấu hình Clerk API Keys: Ưu tiên lấy từ biến môi trường VITE_CLERK_PUBLISHABLE_KEY
// Khóa hợp lệ kết nối Clerk API ổn định (tránh lỗi SSL handshake do tên miền vercel.app không tạo được CNAME)
export const DEFAULT_CLERK_PUBLISHABLE_KEY =
  'pk_test_c21pbGluZy1sb2JzdGVyLTk2MTkuY2xlcmsuYWNjb3VudHMuZGV2JA';

// Khóa pk_live liên kết với clerk.nam-library.vercel.app bị lỗi SSL (do Vercel không cho cấu hình DNS CNAME trên subdomain *.vercel.app)
const BROKEN_VERCEL_LIVE_KEY =
  'pk_live_Y2xlcmsubmFtLWxpYnJhcnkudmVyY2VsLmFwcCQ';

export const CLERK_PUBLISHABLE_KEY =
  (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || DEFAULT_CLERK_PUBLISHABLE_KEY).trim();

/**
 * Lấy Publishable Key (ưu tiên .env nếu hợp lệ, loại trừ key lỗi SSL, fallback về khóa an toàn)
 */
export function getClerkPublishableKey(): string {
  const envKey = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '').trim();
  // Nếu biến môi trường là khóa live trỏ về vercel.app bị lỗi SSL -> tự động fallback về khóa hoạt động ổn định
  if (envKey && envKey !== BROKEN_VERCEL_LIVE_KEY && envKey.startsWith('pk_')) {
    return envKey;
  }
  return DEFAULT_CLERK_PUBLISHABLE_KEY;
}
