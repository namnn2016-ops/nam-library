// Vercel Serverless Function: Xác thực và quản lý tài khoản qua Clerk Backend API bằng CLERK_SECRET_KEY

export default async function handler(req, res) {
  // Cấu hình CORS cho phép gọi từ Frontend Web và ứng dụng Desktop
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Lấy khóa bí mật CLERK_SECRET_KEY từ request hoặc biến môi trường Vercel
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

  const { action, userId, sessionToken, clientSecret } = {
    ...req.query,
    ...bodyData,
  };

  const secretKey =
    clientSecret ||
    process.env.CLERK_SECRET_KEY ||
    process.env.VITE_CLERK_SECRET_KEY ||
    '';

  if (!secretKey) {
    return res.status(400).json({
      success: false,
      error: 'Chưa cấu hình CLERK_SECRET_KEY trên máy chủ (Vercel Environment Variables) hoặc chưa cung cấp mã Secret.',
    });
  }

  try {
    // 1. Kiểm tra trạng thái Secret Key
    if (action === 'status' || action === 'check') {
      const testRes = await fetch('https://api.clerk.com/v1/users?limit=1', {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!testRes.ok) {
        return res.status(401).json({
          success: false,
          error: 'CLERK_SECRET_KEY không hợp lệ hoặc đã hết hạn trên Clerk Dashboard.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'CLERK_SECRET_KEY hợp lệ và đang hoạt động chính xác!',
      });
    }

    // 2. Lấy thông tin chi tiết người dùng từ Clerk Backend API bằng Secret Key
    if (action === 'get-user' || userId) {
      if (!userId) {
        return res.status(400).json({ success: false, error: 'Thiếu userId cần xác thực.' });
      }

      const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          error: 'Không tìm thấy người dùng trên Clerk Backend API.',
          details: errJson,
        });
      }

      const data = await response.json();
      return res.status(200).json({
        success: true,
        user: {
          id: data.id,
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.username || 'Thủ Thư',
          email: data.email_addresses?.[0]?.email_address || '',
          avatar: data.image_url || '',
          createdAt: data.created_at,
          lastSignInAt: data.last_sign_in_at,
        },
      });
    }

    // 3. Xác thực session token nếu được cung cấp
    if (action === 'verify-session' && sessionToken) {
      const response = await fetch(`https://api.clerk.com/v1/sessions/${sessionToken}/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const sessionData = await response.json();
      return res.status(response.ok ? 200 : 400).json({
        success: response.ok,
        session: sessionData,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Clerk Secret Backend API ready. Action: "get-user" or "status".',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Lỗi nội bộ máy chủ khi gọi Clerk API.',
    });
  }
}
