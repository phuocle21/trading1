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

// Journal types for managing multiple journals
export interface Journal {
  id: string;
  name: string;
  description?: string;
  createdAt: string; // ISO string date
  updatedAt: string; // ISO string date
  icon?: string; // Icon identifier
  color?: string; // Color for UI
  isTemplate?: boolean; // If true, this is a template journal
  isDefault?: boolean; // If true, this is the default journal
  trades: Trade[]; // Trade entries in this journal
  settings?: JournalSettings; // Journal-specific settings
}

export interface JournalSettings {
  currency?: string; // Default currency for this journal
  initialCapital?: number; // Starting capital for this journal
  riskPercentage?: number; // Default risk percentage
  tradingFees?: number; // Default trading fees
  tradingHours?: {
    start: string; // Time string (e.g., "09:30")
    end: string; // Time string (e.g., "16:00")
  };
  tradingDays?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[]; // Trading days
  preferredTimeframes?: string[]; // Preferred chart timeframes
}
