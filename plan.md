# Kế hoạch Phát triển Phần mềm: nam-libary

## 1. Tổng quan Dự án
- **Tên dự án**: nam-libary
- **Mục tiêu**: Xây dựng phần mềm quản lý thư viện trên hệ điều hành Windows, có giao diện trực quan, hỗ trợ thao tác nhanh qua phím tắt và quét mã vạch/mã số.
- **Nền tảng**: Ứng dụng Desktop Windows (Electron.js + React.js + Tailwind CSS).
- **Ngăn xếp Công nghệ**:
  - **Core Desktop**: Electron.js
  - **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Recharts
  - **Cơ sở dữ liệu**: SQLite (Cục bộ qua Electron) kết hợp Web Storage / Neon Cloud DB
  - **Email Service**: Resend API
  - **Âm thanh**: Web Audio API (phát tiếng tít ngắn / tít dài bằng code synth không cần tải file ngoài)

## 2. Thiết kế Giao diện (UI/UX)
- **Bố cục chính (Layout)**:
  - **Thanh bên (Sidebar)**: Cố định bên trái, có nút toggle để thu vào (chỉ hiện icon) hoặc mở ra (hiện cả icon và chữ).
    - Trang chủ (Dashboard)
    - Mượn sách (Borrow & Return)
    - Bạn đọc (Readers)
    - Sách (Books)
    - Cài đặt (Settings)
  - **Giao diện hiện đại, sạch sẽ**: Tông màu Indigo / Slate / Modern Library cao cấp, bo tròn nhẹ nhàng (`rounded-xl`), phân cấp trực quan, card đổ bóng tinh tế, font chữ rõ ràng, KHÔNG dùng màu vàng đất / beige cổ lỗ sĩ.
  - **Không có màn hình khóa PIN gây cản trở**: Mở app vào thẳng hệ thống với sidebar điều hướng đầy đủ.

---

## 3. Chi tiết Các Module và Tính năng

### 3.1. Trang chủ (Dashboard)
- **4 Thẻ thống kê (Metric Cards)**:
  1. Số sách đang được mượn
  2. Số sách còn lại trong thư viện
  3. Tổng số lượng bạn đọc
  4. Số bạn đọc đang mượn sách quá hạn
- **Danh sách Cảnh báo Bạn đọc Quá hạn**:
  - Nằm ngay dưới/bên cạnh số bạn đọc quá hạn.
  - Liệt kê chi tiết **Tên các bạn đọc đang quá hạn**, số sách quá hạn, số ngày quá hạn, nút liên hệ/gửi email.
- **Biểu đồ (Charts)**:
  - Biểu đồ xu hướng số lượng bạn đọc mượn sách tăng/giảm theo thời gian (theo tháng/tuần) sử dụng Recharts (AreaChart / BarChart mượt mà).
- **Thống kê nhanh khác**: Danh sách các sách được mượn nhiều nhất, hoạt động mượn trả gần nhất.

### 3.2. Mượn sách (Borrow & Return) - Module cốt lõi
- **Giao diện**:
  - **MỘT ô nhập mã đa năng** cực lớn, nổi bật ở trên cùng.
  - Hỗ trợ máy quét mã vạch và gõ phím.
  - Nút bấm và chỉ dẫn phím tắt rõ ràng.
- **Phím tắt toàn cục**:
  - **`F6`**: Focus ngay lập tức trỏ chuột vào ô nhập mã đa năng.
  - **`F9`**: Xóa thông tin bạn đọc đang hiển thị, làm mới trạng thái về ban đầu (kể cả khi con trỏ đang nằm trong ô nhập mã).
- **Luồng xử lý thông minh (Workflows)**:
  - **Trường hợp 1: Nhập Mã Bạn Đọc (Quy trình Mượn sách)**
    - Nhập mã khớp bạn đọc -> Hiển thị khối thông tin bạn đọc: Ảnh đại diện, Tên, Mã, Ngày sinh, Email, Thời hạn thẻ.
    - Tự động chuyển placeholder & trạng thái ô nhập mã sang chế độ: `Nhập mã sách để mượn...`
    - Nhập/quét mã sách -> Đánh dấu sách được mượn bởi bạn đọc này.
    - Sách ngay lập tức xuất hiện trong "Danh sách sách đã mượn" của bạn đọc kèm theo **Hạn trả sách** (= Ngày mượn + Số ngày quy định trong Cài đặt).
    - **Nút "Gia hạn sách" (Renew)**:
      - Đặt ngay dưới khối thông tin bạn đọc.
      - Bấm vào mở Popup modal ở giữa màn hình liệt kê các sách bạn đọc đang mượn.
      - Có checkbox chọn từng cuốn hoặc checkbox "Chọn tất cả", bấm Xác nhận gia hạn để cộng thêm số ngày mượn.
  - **Trường hợp 2: Nhập Mã Sách (Quy trình Trả sách tự động)**
    - Khi chưa chọn bạn đọc nào, nếu quét/nhập mã của một cuốn sách ĐANG ĐƯỢC MƯỢN:
    - Hệ thống tự động nhận diện đây là hành động **Trả sách** -> Tự động hoàn trả sách, cập nhật kho sách, thông báo tên bạn đọc vừa trả thành công.
- **Cảnh báo âm thanh (Smart Beep Synth)**:
  - Thao tác hợp lệ (Mượn/Trả/Gia hạn thành công): Kêu **Tít ngắn** vui tai (880Hz, 0.12s).
  - Thao tác không hợp lệ (Mã không tồn tại, hết lượt mượn, sách đã mượn,...): Kêu **Tít dài** cảnh báo (330Hz, 0.45s).
  - Tùy chọn Bật/Tắt trong Cài đặt.
- **Hệ thống gửi Email thông báo (Resend API)**:
  - Gửi email nhắc nhở khi sách quá hạn hoặc sắp đến hạn. Nút gửi email thủ công hoặc cấu hình gửi tự động.

### 3.3. Bạn đọc (Readers Management)
- Bảng danh sách bạn đọc hiện đại, có avatar, mã số, tên, ngày sinh, email, ngày hết hạn thẻ, trạng thái.
- Thanh tìm kiếm theo tên, mã hoặc email. Lọc theo trạng thái còn hạn/hết hạn.
- **Thêm Bạn đọc mới (Modal Popup)**:
  - Nhập: Tên bạn đọc (Bắt buộc), Ngày sinh, Địa chỉ Email, Ảnh bạn đọc (chọn ảnh/link/avatar mẫu), Thời hạn thẻ (chọn ngày hoặc bỏ trống).
  - **Quy tắc**: Bỏ trống Thời hạn = Vô thời hạn.
- **Sửa & Xóa bạn đọc**: Modal sửa thông tin đầy đủ.
- **Tự động hóa**: Cơ chế quét tự động xóa các bạn đọc hết hạn thẻ khỏi hệ thống theo đúng yêu cầu!

### 3.4. Sách (Books Management)
- Bảng danh sách sách: Mã sách (mã vạch), Tên sách, Chủ sở hữu / Tác giả, Trạng thái (Sẵn sàng / Đang mượn), Ngày tạo.
- Thanh tìm kiếm theo tên sách hoặc mã sách.
- **Thêm Sách mới (Modal Popup)**:
  - Nhập: Tên sách (Bắt buộc), Mã sách (Bắt buộc, duy nhất, có nút tự sinh mã vạch nếu cần), Chủ sở hữu (Không bắt buộc).
- Sửa & Xóa sách.

### 3.5. Cài đặt (Settings)
- **Bật / Tắt âm thanh**: Toggle chuyển đổi âm thanh tít ngắn/dài. Nút nghe thử âm thanh.
- **Số ngày được mượn**: Ô nhập số (mặc định ví dụ 14 ngày).
- **Số sách tối đa mỗi bạn đọc được mượn**: Ô nhập số (bỏ trống hoặc 0 = Vô hạn).
- **Cấu hình Resend API**: API Key, Email người gửi để sẵn sàng gửi thông báo mượn/trả/quá hạn.
- **Quản lý dữ liệu**: Nút reset dữ liệu mẫu, sao lưu.
