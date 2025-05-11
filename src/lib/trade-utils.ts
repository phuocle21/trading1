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

  const fees = trade.fees || 0;

  if (trade.tradeType === 'buy') {
    // Long trade: (Exit Price - Entry Price) * Quantity - Fees
    return (trade.exitPrice - trade.entryPrice) * trade.quantity - fees;
  } else {
    // Short trade: (Entry Price - Exit Price) * Quantity - Fees
    return (trade.entryPrice - trade.exitPrice) * trade.quantity - fees;
  }
}

export function formatCurrency(amount: number | null | undefined, currency: string = 'USD', compact: boolean = false): string {
  if (amount === null || amount === undefined) {
    return 'N/A';
  }
  
  // Xử lý các số cực lớn
  // Nếu số quá lớn (lớn hơn 1 tỷ) hoặc yêu cầu compact, sử dụng định dạng rút gọn
  const absAmount = Math.abs(amount);
  const mustCompact = absAmount >= 1000000000 || compact;
  
  const options: Intl.NumberFormatOptions = { 
    style: 'currency', 
    currency 
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

  return new Intl.NumberFormat('en-US', options).format(amount);
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
