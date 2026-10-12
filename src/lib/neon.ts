import { neon } from '@neondatabase/serverless';

// Lấy connection string từ biến môi trường của Vite
// Bạn cần tạo file .env trong thư mục gốc (nam-libary) và thêm:
// VITE_NEON_DB_URL=postgres://user:password@hostname/dbname?sslmode=require
const sql = neon(import.meta.env.VITE_NEON_DB_URL || 'postgres://placeholder_so_it_wont_crash');

export default sql;
