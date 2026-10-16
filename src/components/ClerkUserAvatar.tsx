import { useState, useMemo } from 'react';

interface ClerkUserAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  email?: string;
  id?: string;
  size?: number; // size in px, default 36
  className?: string;
}

/**
 * Danh sách bảng màu mô phỏng chuẩn xác hệ thống Identicon Retro của Clerk
 * Màu nền nhạt (pastel) kết hợp với màu pixel đậm tương phản
 */
const CLERK_PALETTES = [
  { bg: '#DCFCE7', fg: '#16A34A', border: '#86EFAC' }, // Green (giống ảnh của Clerk trong image copy 5)
  { bg: '#E0F2FE', fg: '#0284C7', border: '#7DD3FC' }, // Sky Blue
  { bg: '#F3E8FF', fg: '#9333EA', border: '#D8B4FE' }, // Purple
  { bg: '#FEF3C7', fg: '#D97706', border: '#FDE68A' }, // Amber
  { bg: '#FFE4E6', fg: '#E11D48', border: '#FDA4AF' }, // Rose
  { bg: '#CCFBF1', fg: '#0D9488', border: '#5EEAD4' }, // Teal
  { bg: '#EEF2FF', fg: '#4F46E5', border: '#A5B4FC' }, // Indigo
];

/**
 * Thuật toán băm chuỗi để sinh mã màu và cấu hình pixel 5x5 đối xứng
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Component hiển thị ảnh đại diện chuẩn Clerk:
 * 1. Nếu có `avatarUrl` (ảnh thật từ Clerk CDN hoặc Google), tải với `referrerPolicy="no-referrer"`
 * 2. Nếu không có hoặc ảnh lỗi, tự động render SVG Identicon 5x5 đối xứng đúng chất Clerk
 */
export default function ClerkUserAvatar({
  avatarUrl,
  name = 'Người dùng',
  email = '',
  id = '',
  size = 36,
  className = '',
}: ClerkUserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  // Sinh Identicon 5x5 đối xứng dựa trên ID hoặc Tên người dùng
  const identicon = useMemo(() => {
    const seed = (id || email || name || 'clerk_user').trim().toLowerCase();
    const hash = hashString(seed);

    // Chọn palette màu (ưu tiên palette màu xanh Clerk nếu tên chứa nam/nhat)
    const paletteIndex = hash % CLERK_PALETTES.length;
    const palette = CLERK_PALETTES[paletteIndex];

    // Lưới 5x5 với đối xứng gương qua trục giữa (cột 0=4, cột 1=3, cột 2 ở giữa)
    // Cần 5 hàng x 3 cột = 15 ô quyết định
    const grid: boolean[][] = [];
    for (let r = 0; r < 5; r++) {
      const row: boolean[] = [];
      const col0 = Boolean((hash >> (r * 3 + 0)) & 1);
      const col1 = Boolean((hash >> (r * 3 + 1)) & 1);
      const col2 = Boolean((hash >> (r * 3 + 2)) & 1);

      row[0] = col0;
      row[1] = col1;
      row[2] = col2;
      row[3] = col1; // đối xứng
      row[4] = col0; // đối xứng
      grid.push(row);
    }

    return { palette, grid };
  }, [id, email, name]);

  const hasValidAvatarUrl = Boolean(avatarUrl && avatarUrl.trim() && !imgError);

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full overflow-hidden shrink-0 select-none flex items-center justify-center ring-2 ring-indigo-500/30 bg-slate-800 ${className}`}
      title={name}
    >
      {hasValidAvatarUrl ? (
        <img
          src={avatarUrl!}
          alt={name}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        /* SVG Identicon đối xứng 5x5 chuẩn phong cách Clerk */
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full rounded-full"
          style={{ backgroundColor: identicon.palette.bg }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Vòng viền mềm bên trong */}
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke={identicon.palette.border}
            strokeWidth="2"
          />

          {/* Lưới 5x5: Mỗi ô kích thước 16x16, bắt đầu tại x=10, y=10 */}
          {identicon.grid.map((row, rIdx) =>
            row.map((filled, cIdx) => {
              if (!filled) return null;
              return (
                <rect
                  key={`${rIdx}-${cIdx}`}
                  x={10 + cIdx * 16}
                  y={10 + rIdx * 16}
                  width="16"
                  height="16"
                  rx="2"
                  fill={identicon.palette.fg}
                />
              );
            })
          )}
        </svg>
      )}
    </div>
  );
}
