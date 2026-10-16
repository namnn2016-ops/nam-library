// Cấu hình Clerk API Keys: Sử dụng khóa kết nối ổn định (tránh lỗi SSL handshake do tên miền vercel.app không hỗ trợ CNAME cho pk_live)
export const DEFAULT_CLERK_PUBLISHABLE_KEY =
  'pk_test_c21pbGluZy1sb2JzdGVyLTk2MTkuY2xlcmsuYWNjb3VudHMuZGV2JA';

export const CLERK_PUBLISHABLE_KEY = DEFAULT_CLERK_PUBLISHABLE_KEY;

/**
 * Lấy Publishable Key kết nối Clerk
 */
export function getClerkPublishableKey(): string {
  const envKey = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '').trim();
  // Nếu envKey là pk_live của vercel.app (bị lỗi SSL không tải được) -> dùng key test ổn định
  if (envKey && envKey.startsWith('pk_') && !envKey.includes('Y2xlcmsubmFtLWxpYnJhcnkudmVyY2VsLmFwcCQ')) {
    return envKey;
  }
  return DEFAULT_CLERK_PUBLISHABLE_KEY;
}
