// Cấu hình Clerk API Keys: Ưu tiên lấy từ biến môi trường VITE_CLERK_PUBLISHABLE_KEY
// Có giá trị dự phòng hợp lệ để tránh tình trạng sập web màn hình trắng khi deploy Vercel
export const DEFAULT_CLERK_PUBLISHABLE_KEY =
  'pk_test_c21pbGluZy1sb2JzdGVyLTk2MTkuY2xlcmsuYWNjb3VudHMuZGV2JA';

export const CLERK_PUBLISHABLE_KEY =
  (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || DEFAULT_CLERK_PUBLISHABLE_KEY).trim();

/**
 * Lấy Publishable Key (ưu tiên .env, fallback về khóa mặc định hợp lệ)
 */
export function getClerkPublishableKey(): string {
  const envKey = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '').trim();
  if (envKey && envKey.startsWith('pk_')) {
    return envKey;
  }
  return (CLERK_PUBLISHABLE_KEY || DEFAULT_CLERK_PUBLISHABLE_KEY).trim();
}
