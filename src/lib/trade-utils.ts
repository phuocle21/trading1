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

// Hàm tính hệ số lợi nhuận (trung bình lãi chia cho trung bình lỗ)
export function calculateRMultiple(trades: Trade[]): number {
  if (!trades || trades.length === 0) return 0;
  
  // Arrays to store profit and loss values
  const profitValues: number[] = [];
  const lossValues: number[] = [];
  
  // Separate profitable trades and losing trades
  trades.forEach(trade => {
    const pnl = calculateProfitLoss(trade);
    if (pnl === null) return;
    
    if (pnl > 0) {
      profitValues.push(pnl);
    } else if (pnl < 0) {
      lossValues.push(Math.abs(pnl)); // Store absolute value of loss
    }
  });
  
  // Calculate average profit and average loss
  const avgProfit = profitValues.length > 0 
    ? profitValues.reduce((sum, profit) => sum + profit, 0) / profitValues.length 
    : 0;
    
  const avgLoss = lossValues.length > 0 
    ? lossValues.reduce((sum, loss) => sum + loss, 0) / lossValues.length 
    : 0;
  
  // Handle edge cases
  if (avgLoss === 0) {
    if (avgProfit > 0) {
      return 10; // If no losses but have profits, return a high value (can be customized)
    }
    return 0; // No profits and no losses
  }
  
  // Calculate R-multiple as ratio of average profit to average loss
  return avgProfit / avgLoss;
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
