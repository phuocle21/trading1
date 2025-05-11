# Hướng Dẫn GitHub Copilot Cho Nền Tảng Giao Dịch

Tài liệu này cung cấp hướng dẫn cho GitHub Copilot khi hỗ trợ với dự án Nền Tảng Giao Dịch.

## Tổng Quan Dự Án

Đây là ứng dụng Next.js 15 với App Router, hoạt động như một nền tảng giao dịch toàn diện. Nó giúp các nhà giao dịch theo dõi, phân tích và cải thiện hiệu suất giao dịch của họ thông qua nhật ký, phân tích và quản lý chiến lược.

## Công Nghệ Chính

- **Frontend**: Next.js 15 với App Router, React 18
- **Styling**: Tailwind CSS với các components shadcn/ui (dựa trên Radix UI)
- **Cơ Sở Dữ Liệu**: PostgreSQL thông qua Supabase
- **Xác Thực**: Supabase Auth
- **Quản Lý State**: React Context API, React Query
- **Xử Lý Form**: React Hook Form với Zod validation
- **Trực Quan Hóa Dữ Liệu**: Recharts
- **Tính Năng AI**: Tích hợp GenKit

## Quy Ước Cấu Trúc Mã Nguồn

- **Tổ Chức Component**: 
  - UI components cơ bản trong `/src/components/ui/`
  - Components cho tính năng cụ thể trong các thư mục riêng như `/src/components/trade/`
  - Layout components trong `/src/components/layout/`

- **Sử Dụng Context**:
  - Trạng thái xác thực qua `AuthContext`
  - Dữ liệu giao dịch qua `TradeContext`
  - Mục nhật ký qua `JournalContext`
  - Quản lý sổ tay chiến lược qua `PlaybookContext`
  - Quản lý ngôn ngữ qua `LanguageContext`

- **API Routes**:
  - Tuân theo quy ước RESTful
  - Sử dụng Next.js API routes trong `/src/app/api/`
  - Tương tác với Supabase cho các hoạt động dữ liệu

## Kiến Trúc Cơ Sở Dữ Liệu

Cơ sở dữ liệu Supabase bao gồm các bảng chính sau:
- `users`: Thông tin xác thực và hồ sơ người dùng
- `trades`: Bản ghi giao dịch cá nhân với các chỉ số hiệu suất
- `journals`: Mục nhập nhật ký của nhà giao dịch để phản ánh và ghi chú
- `playbooks`: Chiến lược giao dịch và bộ quy tắc
- `assets`: Thông tin về các công cụ giao dịch

## Các Nhiệm Vụ Thường Gặp

Khi hỗ trợ với mã nguồn này, ưu tiên:

1. **An Toàn Kiểu**: Đảm bảo tất cả các components và functions duy trì kiểu TypeScript phù hợp
2. **Quản Lý State**: Sử dụng context providers thích hợp cho state toàn cục
3. **Tích Hợp API**: Đối với hoạt động dữ liệu, sử dụng Supabase client từ `/src/lib/supabase.ts`
4. **Tái Sử Dụng Component**: Tận dụng các UI components hiện có từ `/src/components/ui/`
5. **Xử Lý Form**: Sử dụng React Hook Form với Zod cho validation
6. **Thiết Kế Responsive**: Đảm bảo UI hoạt động trên cả desktop và thiết bị di động

## Các Tiêu Chuẩn Thực Hành

- **Xác Thực**: Luôn kiểm tra trạng thái xác thực người dùng trước khi truy cập các routes được bảo vệ
- **Xử Lý Lỗi**: Thực hiện xử lý lỗi phù hợp cho các hoạt động Supabase
- **Trạng Thái Loading**: Sử dụng các chỉ báo loading trong quá trình các hoạt động bất đồng bộ
- **Tìm Nạp Dữ Liệu**: Ưu tiên React Query cho việc tìm nạp và lưu trữ dữ liệu
- **Props Component**: Xác định rõ ràng các interfaces cho component props
- **Triển Khai Tính Năng**: Chia các tính năng phức tạp thành các components nhỏ hơn, có thể tái sử dụng

## Các Mẫu Thông Dụng

Khi đề xuất mã cho dự án này, hãy tuân theo các mẫu sau:

### Tìm Nạp Dữ Liệu
```tsx
// Ví dụ về tìm nạp dữ liệu giao dịch
import { useQuery } from '@tanstack/react-query';
import supabase from '@/lib/supabase';

const fetchTrades = async () => {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export function useTrades() {
  return useQuery({
    queryKey: ['trades'],
    queryFn: fetchTrades,
  });
}
```

### Xử Lý Form
```tsx
// Ví dụ mẫu form sử dụng React Hook Form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const tradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol là bắt buộc'),
  entryPrice: z.number().positive('Giá vào lệnh phải là số dương'),
  exitPrice: z.number().positive('Giá ra lệnh phải là số dương'),
  // Thêm các trường khác nếu cần
});

type TradeFormValues = z.infer<typeof tradeSchema>;

export function TradeForm() {
  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      symbol: '',
      entryPrice: 0,
      exitPrice: 0,
    },
  });
  
  // Logic xử lý form
}
```

## Quy Ước Đặt Tên File

- **File Component**: Sử dụng PascalCase (ví dụ: `TradeForm.tsx`)
- **File Tiện Ích**: Sử dụng kebab-case (ví dụ: `trade-utils.ts`)
- **File Context**: Sử dụng PascalCase với hậu tố "Context" (ví dụ: `TradeContext.tsx`)
- **File Hook**: Sử dụng camelCase với tiền tố "use" (ví dụ: `useTradeData.ts`)

## Ghi Chú Bổ Sung

- Dự án sử dụng Next.js server components khi thích hợp
- Xác thực được quản lý thông qua Supabase, không phải Next Auth
- Biểu đồ và trực quan hóa sử dụng thư viện Recharts
- UI hỗ trợ chuyển đổi giữa giao diện tối/sáng
- Cấu trúc thư mục tuân theo thiết kế rõ ràng với các tính năng được tổ chức theo từng module