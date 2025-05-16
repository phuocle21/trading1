import type { Trade } from '@/types';

export function calculateProfitLoss(trade: Trade): number | null {
  if (
    trade.exitPrice === undefined ||
    trade.exitPrice === null ||
    trade.exitPrice <= 0 || // Exit price must be positive for a closed trade
    trade.quantity <= 0 ||
    trade.entryPrice <= 0
  ) {
    return null; // Trade is open or data is invalid for P/L calculation
  }

  if (trade.tradeType === 'buy') {
    // Long trade: (Exit Price - Entry Price) * Quantity
    return (trade.exitPrice - trade.entryPrice) * trade.quantity;
  } else {
    // Short trade: (Entry Price - Exit Price) * Quantity
    return (trade.entryPrice - trade.exitPrice) * trade.quantity;
  }
}

// Hàm tính hệ số lợi nhuận (Profit Factor)
// Công thức: Tổng lợi nhuận / Tổng thua lỗ
export function calculateRMultiple(trades: Trade[]): number {
  if (!trades || trades.length === 0) return 0;
  
  let totalGain = 0;
  let totalLoss = 0;
  
  // Tính tổng lợi nhuận và tổng thua lỗ
  trades.forEach(trade => {
    const pnl = calculateProfitLoss(trade);
    if (pnl === null) return;
    
    if (pnl > 0) {
      // Lợi nhuận
      totalGain += pnl;
    } else if (pnl < 0) {
      // Thua lỗ (lưu giá trị tuyệt đối)
      totalLoss += Math.abs(pnl);
    }
  });
  
  // Xử lý trường hợp đặc biệt
  if (totalLoss === 0) {
    if (totalGain > 0) {
      return 10; // Nếu không có thua lỗ nhưng có lợi nhuận, trả về giá trị cao (có thể tùy chỉnh)
    }
    return 0; // Không có lợi nhuận và không có thua lỗ
  }
  
  // Tính hệ số lợi nhuận (Profit Factor)
  return totalGain / totalLoss;
}

export function formatCurrency(amount: number | null | undefined, currency: string = 'USD', compact: boolean = false, showNegativeSign: boolean = true): string {
  if (amount === null || amount === undefined) {
    return 'N/A';
  }
  
  // Xử lý các số cực lớn
  // Nếu số quá lớn (lớn hơn 1 tỷ) hoặc yêu cầu compact, sử dụng định dạng rút gọn
  const absAmount = Math.abs(amount);
  const mustCompact = absAmount >= 1000000000 || compact;
  const isNegative = amount < 0;
  
  const options: Intl.NumberFormatOptions = { 
    style: 'currency', 
    currency,
    signDisplay: showNegativeSign ? 'auto' : 'never' // Ẩn dấu âm nếu không yêu cầu hiển thị
  };
  
  if (mustCompact) {
    options.notation = "compact";
    options.compactDisplay = "short";
    options.minimumFractionDigits = 1;
    options.maximumFractionDigits = 1;
  } else {
    // Cho các số nhỏ hơn, giới hạn số chữ số thập phân
    options.minimumFractionDigits = 0;
    options.maximumFractionDigits = 2;
  }

  return new Intl.NumberFormat('en-US', options).format(Math.abs(amount));
}

export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    // Check if it's already in a user-friendly format or just needs parsing
    // Assuming dateString is 'YYYY-MM-DD'
    const date = new Date(dateString + 'T00:00:00'); // Ensure parsing as local date
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  } catch (e) {
    return dateString; // Fallback to original string if parsing fails
  }
}
