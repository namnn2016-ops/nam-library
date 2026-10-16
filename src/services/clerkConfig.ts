// Cấu hình Clerk API Keys: Lấy trực tiếp từ biến môi trường VITE_CLERK_PUBLISHABLE_KEY
export const DEFAULT_CLERK_PUBLISHABLE_KEY =
  (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
   'pk_live_Y2xlcmsubmFtLWxpYnJhcnkudmVyY2VsLmFwcCQ').trim();

export const CLERK_PUBLISHABLE_KEY = DEFAULT_CLERK_PUBLISHABLE_KEY;

/**
 * Lấy Publishable Key (ưu tiên trực tiếp từ .env, fallback về khóa mặc định)
 */
export function getClerkPublishableKey(): string {
  const envKey = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '').trim();
  if (envKey && envKey.startsWith('pk_')) {
    return envKey;
  }
  return DEFAULT_CLERK_PUBLISHABLE_KEY;
}
