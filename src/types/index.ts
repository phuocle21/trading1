export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  createdAt: number;
  lastLogin: number;
}

export interface Trade {
  id: string;
  journalId?: string;
  date?: string;
  entryDate?: string;
  entryTime?: string;
  exitDate?: string;
  exitTime?: string;
  symbol: string;
  tradeType: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  fees?: number;
  playbook?: string;
  risk?: 'low' | 'medium' | 'high';
  mood?: 'calm' | 'excited' | 'anxious' | 'confident' | 'unsure' | 'greedy' | 'fearful' | 'tired' | 'confused';
  rating?: number;
  notes?: string;
  screenshots?: string[];
  direction?: 'long' | 'short';
  size?: number;
  returnValue?: number;
  returnPercent?: number;
  strategy?: string;
  setup?: string;
  images?: string[];
  tags?: string[];
  status?: 'planned' | 'open' | 'closed' | 'canceled';
  emotions?: {
    before?: string;
    during?: string;
    after?: string;
  };
  mistakes?: string[];
}

export interface TradeWithProfit extends Trade {
  profitOrLoss?: number | null;
  stockSymbol?: string;
}

export interface Journal {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  trades: Trade[];
  icon?: string;
  color?: string;
  isDefault?: boolean;
  settings?: {
    currency?: string;
    initialCapital?: number;
    riskPercentage?: number;
    tradingHours?: {
      start: string;
      end: string;
    };
    tradingDays?: string[];
    preferredTimeframes?: string[];
  };
}

export interface Playbook {
  id: string;
  name: string;
  strategy: string;
  timeframe?: string;
  setupCriteria: string;
  entryTriggers: string;
  exitRules: string;
  riskManagement?: string;
  notes?: string;
  winRate?: number;
  avgProfit?: number;
  totalTrades?: number;
  profitFactor?: number;
  consecutiveWins?: number;
  consecutiveLosses?: number;
  averageHoldingTime?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordResetRequest {
  email: string;
  requestedAt: number;
  token: string;
  used: boolean;
}
