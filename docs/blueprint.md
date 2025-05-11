# **Tên Ứng Dụng**: Trade Insights (Thông Tin Giao Dịch)

## Tính Năng Chính:

- Nhập Giao Dịch Thủ Công: Cho phép người dùng nhập thủ công chi tiết giao dịch (ngày, cổ phiếu, số lượng, giá, phí).
- Xem Lịch Sử Giao Dịch: Hiển thị các giao dịch dưới dạng bảng với các cột có thể sắp xếp (ngày, cổ phiếu, lợi nhuận/thua lỗ, v.v.).
- Bảng Điều Khiển Hiệu Suất: Cung cấp bảng điều khiển để xem thống kê tổng thể như tổng lợi nhuận/thua lỗ, tỷ lệ thắng và thời gian giao dịch trung bình.

## Hướng Dẫn Phong Cách:

- Màu chính: Xanh đậm (#1A237E) cho cảm giác chuyên nghiệp và đáng tin cậy.
- Màu phụ: Xám nhạt (#EEEEEE) cho nền và các phần tử trung tính.
- Màu nhấn: Xanh ngọc (#00ACC1) cho các phần tử tương tác và điểm nhấn.
- Bố cục sạch sẽ và tổ chức tốt để dễ dàng điều hướng.
- Sử dụng biểu tượng rõ ràng và nhất quán để đại diện cho các điểm dữ liệu khác nhau.

## Mục Tiêu Dự Án:

- Tạo ra một nền tảng trực quan và dễ sử dụng để các nhà giao dịch có thể theo dõi và phân tích hoạt động giao dịch của họ.
- Cung cấp thông tin chi tiết hữu ích để cải thiện chiến lược giao dịch.
- Xây dựng một hệ thống mở rộng được để thêm các tính năng mới trong tương lai.

## Đối Tượng Người Dùng:

- Nhà giao dịch cá nhân muốn theo dõi hiệu suất của mình.
- Nhà đầu tư dài hạn muốn phân tích lịch sử mua/bán.
- Người mới bắt đầu học cách giao dịch và muốn ghi chép lại quá trình học tập.

## Lộ Trình Phát Triển:

### Giai Đoạn 1 - Cơ Bản:
- Thiết lập xác thực người dùng
- Nhập và quản lý giao dịch cơ bản
- Xem lịch sử giao dịch
- Tổng quan thống kê đơn giản

### Giai Đoạn 2 - Phân Tích:
- Biểu đồ và trực quan hóa hiệu suất
- Tính năng nhật ký giao dịch 
- Lọc và tìm kiếm nâng cao
- Xuất báo cáo

### Giai Đoạn 3 - Nâng Cao:
- Tích hợp dữ liệu thị trường thời gian thực
- Phân tích nâng cao và chỉ số hiệu suất
- Thông báo và cảnh báo
- Chia sẻ và tương tác xã hội

## Công Nghệ Được Chọn:

- **Frontend**: Next.js với App Router và React 18
- **Styling**: Tailwind CSS và shadcn/ui
- **Backend**: Supabase cho xác thực và lưu trữ dữ liệu
- **Xử Lý Dữ Liệu**: React Query cho tìm nạp dữ liệu
- **Biểu Đồ**: Recharts cho trực quan hóa dữ liệu
- **Triển Khai**: Vercel