# Nền Tảng Quản Lý và Nhật Ký Giao Dịch

Một nền tảng giao dịch toàn diện được xây dựng bằng Next.js 15, Supabase và Tailwind CSS, được thiết kế để giúp các nhà giao dịch theo dõi, phân tích và cải thiện hiệu suất giao dịch của họ.

## Tính Năng

- **Nhật Ký Giao Dịch**: Ghi lại chi tiết các giao dịch với các chỉ số và ghi chú toàn diện
- **Bảng Điều Khiển Phân Tích**: Xem các chỉ số hiệu suất, tăng trưởng tài khoản và mô hình giao dịch
- **Lịch Sử Giao Dịch**: Theo dõi tất cả các giao dịch lịch sử với khả năng lọc và sắp xếp
- **Biểu Đồ Hiệu Suất**: Trực quan hóa hiệu suất giao dịch với tích hợp Recharts
- **Sổ Tay Chiến Lược**: Tạo và lưu trữ chiến lược và thiết lập giao dịch
- **Xem Lịch**: Trực quan hóa hoạt động giao dịch trên lịch hàng tháng
- **Phân Tích Nâng Cao**: Thu thập thông tin chi tiết về mô hình giao dịch và chỉ số hiệu suất
- **Xác Thực Người Dùng**: Đăng nhập an toàn và quản lý tài khoản thông qua Supabase

## Công Nghệ Sử Dụng

- **Frontend**: Next.js 15, React 18, Tailwind CSS
- **UI Components**: shadcn/ui (dựa trên Radix UI + Tailwind)
- **Quản Lý State**: React Context API, React Query
- **Backend**: Next.js API Routes, Supabase
- **Cơ Sở Dữ Liệu**: PostgreSQL (thông qua Supabase)
- **Xác Thực**: Supabase Auth
- **Biểu Đồ & Trực Quan Hóa**: Recharts
- **Quản Lý Form**: React Hook Form + Zod validation
- **Tích Hợp AI**: GenKit cho các tính năng AI

## Yêu Cầu Hệ Thống

- Node.js 18+ và npm/yarn
- Tài khoản và dự án Supabase

## Biến Môi Trường

Tạo một file `.env.local` trong thư mục gốc với các biến sau:

```
NEXT_PUBLIC_SUPABASE_URL=supabase_url_của_bạn
NEXT_PUBLIC_SUPABASE_ANON_KEY=supabase_anon_key_của_bạn
```

## Cài Đặt

```bash
# Clone repository
git clone [url-repository]

# Di chuyển vào thư mục dự án
cd trading

# Cài đặt dependencies
npm install

# Khởi động server phát triển
npm run dev
```

Ứng dụng sẽ chạy tại http://localhost:9002

## Cấu Trúc Dự Án

```
trading/
├── docs/                      # Tài liệu dự án
│   └── blueprint.md           # Blueprint cho dự án
├── src/                       # Mã nguồn chính
│   ├── ai/                    # Tích hợp AI với GenKit
│   │   ├── dev.ts             # Cấu hình phát triển AI
│   │   └── genkit.ts          # Cấu hình GenKit
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── admin/         # API quản trị
│   │   │   ├── journals/      # API nhật ký
│   │   │   ├── playbooks/     # API sổ tay chiến lược
│   │   │   ├── trades/        # API giao dịch
│   │   │   └── user/          # API người dùng
│   │   ├── auth/              # Trang xác thực
│   │   ├── dashboard/         # Trang bảng điều khiển
│   │   ├── history/           # Trang lịch sử giao dịch 
│   │   ├── journals/          # Trang nhật ký
│   │   ├── playbooks/         # Trang sổ tay chiến lược
│   │   ├── account/           # Trang tài khoản
│   │   ├── add-trade/         # Trang thêm giao dịch
│   │   ├── edit-trade/        # Trang chỉnh sửa giao dịch
│   │   └── admin/             # Trang quản trị
│   ├── components/            # Components UI
│   │   ├── auth/              # Components xác thực
│   │   ├── dashboard/         # Components bảng điều khiển
│   │   ├── layout/            # Components bố cục
│   │   ├── playbook/          # Components sổ tay chiến lược
│   │   ├── trade/             # Components giao dịch
│   │   └── ui/                # Components UI cơ bản (shadcn/ui)
│   ├── contexts/              # React Contexts
│   │   ├── AuthContext.tsx    # Context xác thực
│   │   ├── JournalContext.tsx # Context nhật ký
│   │   ├── PlaybookContext.tsx # Context sổ tay
│   │   ├── TradeContext.tsx   # Context giao dịch
│   │   └── LanguageContext.tsx # Context ngôn ngữ
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Thư viện và tiện ích
│   │   ├── server/            # Mã phía server
│   │   └── utils.ts           # Các hàm tiện ích
│   ├── middleware.ts          # Next.js middleware
│   ├── playbooks/             # Dữ liệu sổ tay
│   └── types/                 # TypeScript định nghĩa kiểu
├── public/                    # Tài nguyên tĩnh
└── config files               # Các file cấu hình (next.config.ts, etc.)
```

## Các Tính Năng Chính

### Nhật Ký Giao Dịch
Nhật ký giao dịch cho phép các nhà giao dịch ghi lại thông tin chi tiết về các giao dịch của họ, bao gồm điểm vào/ra, lợi nhuận/thua lỗ, chiến lược sử dụng và ghi chú cá nhân. Điều này giúp duy trì hồ sơ toàn diện về các hoạt động giao dịch.

### Bảng Điều Khiển Phân Tích
Bảng điều khiển cung cấp tổng quan trực quan về hiệu suất giao dịch với các chỉ số như tỷ lệ thắng, lợi nhuận/thua lỗ trung bình, tăng trưởng tài khoản và nhiều hơn nữa. Biểu đồ và thống kê giúp các nhà giao dịch hiểu xu hướng hiệu suất của họ.

### Sổ Tay Chiến Lược
Các nhà giao dịch có thể tạo và lưu trữ chiến lược giao dịch, thiết lập và quy tắc của họ trong sổ tay chiến lược. Tính năng này giúp duy trì tính nhất quán trong phương pháp giao dịch và học hỏi từ kinh nghiệm trong quá khứ.

## Triển Khai

Ứng dụng này có thể được triển khai trên Vercel, Netlify hoặc bất kỳ dịch vụ lưu trữ nào khác hỗ trợ ứng dụng Next.js.

## Đóng Góp

Các đóng góp đều được hoan nghênh! Vui lòng tạo Pull Request.

## Giấy Phép

[Chỉ định giấy phép của bạn tại đây]