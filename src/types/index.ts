export interface Trade {
  id: string;
  symbol: string;  // Changed from stockSymbol to match demo data
  entryDate: string; // ISO string date (e.g., "2023-10-26")
  entryTime?: string; // Time string (e.g., "09:30")
  exitDate?: string; // ISO string date, optional
  exitTime?: string; // Time string, optional
  tradeType: 'buy' | 'sell'; // 'buy' for long, 'sell' for short entry
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number; // Target stop loss price
  takeProfit?: number; // Target take profit price
  fees?: number;
  setup?: string; // Trading pattern/setup used
  playbook?: string; // Added playbook reference for trade strategy
  risk?: 'low' | 'medium' | 'high'; // Risk level assessment
  mood?: 'calm' | 'excited' | 'anxious' | 'confident' | 'unsure'; // Emotional state
  rating?: number; // Trade quality rating (1-5)
  notes?: string;
  strategy?: string; // Added for advanced analytics
  riskRewardRatio?: number; // Added for risk/reward analysis
}

export interface TradeWithProfit extends Trade {
  profitOrLoss?: number | null; // null if trade is open
}
