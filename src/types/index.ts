export interface Trade {
  id: string;
  symbol: string;  // Changed from stockSymbol to match demo data
  entryDate: string; // ISO string date (e.g., "2023-10-26")
  exitDate?: string; // ISO string date, optional
  tradeType: 'buy' | 'sell'; // 'buy' for long, 'sell' for short entry
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  fees?: number;
  notes?: string;
  strategy?: string; // Added for advanced analytics
  riskRewardRatio?: number; // Added for risk/reward analysis
}

export interface TradeWithProfit extends Trade {
  profitOrLoss?: number | null; // null if trade is open
}
