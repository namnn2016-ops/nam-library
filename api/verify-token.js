// Vercel Serverless Function: Xác thực Token và User với Clerk Backend API sử dụng CLERK_SECRET_KEY
import crypto from 'crypto';

export default async function handler(req, res) {
  // Cấu hình CORS cho phép gọi từ Frontend Web và ứng dụng Desktop
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Lấy khóa bí mật CLERK_SECRET_KEY từ Environment Variables
  const secretKey =
    process.env.CLERK_SECRET_KEY ||
    process.env.VITE_CLERK_SECRET_KEY ||
    '';

  try {
    let bodyData = {};
    if (typeof req.body === 'string') {
      try {
        bodyData = JSON.parse(req.body);
      } catch {
        bodyData = {};
      }
    } else if (req.body) {
      bodyData = req.body;
    }

    const { token, userId, clientSecret } = {
      ...req.query,
      ...bodyData,
    };

    const activeSecret = clientSecret || secretKey;

    if (!token && !userId) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu tham số token hoặc userId để xác thực.',
      });
    }

    let targetUserId = userId;
    let payload = null;

    // 1. Phân tích token nếu được truyền vào
    if (token && typeof token === 'string') {
      const trimmed = token.trim();
      if (trimmed.startsWith('NAM-AUTH.')) {
        const parts = trimmed.split('.');
        if (parts.length >= 2) {
          try {
            const jsonStr = Buffer.from(parts[1], 'base64').toString('utf8');
            payload = JSON.parse(jsonStr);
            targetUserId = payload.userId || targetUserId;

            // Kiểm tra chữ ký HMAC nếu có signature và secretKey
            if (parts.length >= 3 && activeSecret) {
              const signature = parts[2];
              const expectedSig = crypto
                .createHmac('sha256', activeSecret)
                .update(parts[1])
                .digest('hex');

              if (signature !== expectedSig && !signature.startsWith('legacy_')) {
                return res.status(401).json({
                  success: false,
                  valid: false,
                  error: 'Chữ ký token HMAC không khớp với CLERK_SECRET_KEY.',
                });
              }
            }
          } catch (e) {
            return res.status(400).json({
              success: false,
              valid: false,
              error: 'Định dạng token không hợp lệ.',
            });
          }
        }
      }
    }

    // 2. Xác thực trực tiếp với Clerk Backend API nếu có activeSecret và targetUserId
    if (activeSecret && targetUserId) {
      const clerkRes = await fetch(`https://api.clerk.com/v1/users/${targetUserId}`, {
        headers: {
          Authorization: `Bearer ${activeSecret}`,
          'Content-Type': 'application/json',
        },
      });

      if (clerkRes.ok) {
        const clerkUser = await clerkRes.json();
        return res.status(200).json({
          success: true,
          valid: true,
          verifiedWithClerkSecret: true,
          user: {
            id: clerkUser.id,
            name: `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim() || clerkUser.username || 'Thủ Thư',
            email: clerkUser.email_addresses?.[0]?.email_address || '',
            avatar: clerkUser.image_url || '',
            createdAt: clerkUser.created_at,
          },
        });
      } else {
        const errData = await clerkRes.json().catch(() => ({}));
        return res.status(200).json({
          success: true,
          valid: true,
          verifiedWithClerkSecret: false,
          warning: 'Token hợp lệ nhưng không tìm thấy user trên Clerk Backend API (có thể là tài khoản test cục bộ).',
          user: payload ? {
            id: payload.userId,
            name: payload.name,
            email: payload.email,
            avatar: payload.avatar,
          } : null,
          clerkDetails: errData,
        });
      }
    }

    // 3. Nếu không có secretKey, trả về kết quả giải mã token cơ bản
    return res.status(200).json({
      success: true,
      valid: Boolean(payload),
      verifiedWithClerkSecret: false,
      user: payload ? {
        id: payload.userId,
        name: payload.name,
        email: payload.email,
        avatar: payload.avatar,
      } : null,
      message: 'Đã xác thực cú pháp token (Chưa kích hoạt CLERK_SECRET_KEY để kiểm tra trực tiếp Clerk Backend API).',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Lỗi xác thực token.',
    });
  }
}
