// Cấu hình Clerk API Keys: Lấy trực tiếp từ file .env (VITE_CLERK_PUBLISHABLE_KEY)
export const CLERK_PUBLISHABLE_KEY =
  (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '').trim();

/**
 * Lấy Publishable Key trực tiếp từ biến môi trường .env
 */
export function getClerkPublishableKey(): string {
  return (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || CLERK_PUBLISHABLE_KEY).trim();
}
