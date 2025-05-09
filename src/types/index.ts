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
  stopLoss?: number;
  takeProfit?: number;
  fees?: number;
  playbook?: string;
  risk?: 'low' | 'medium' | 'high';
  mood?: 'calm' | 'excited' | 'anxious' | 'confident' | 'unsure';
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

export interface Journal {
  id: string;
  name: string;
  userId?: string;
  description?: string;
  createdAt: number;
  isDefault?: boolean;
  settings?: {
    initialCapital?: number;
  };
}

export interface Playbook {
  id: string;
  name: string;
  strategy: string;
  timeframe: string;
  setupCriteria: string;
  entryTriggers: string;
  exitRules: string;
  riskManagement: string;
  notes?: string;
  winRate: number;
  avgProfit: number;
  totalTrades: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PasswordResetRequest {
  email: string;
  requestedAt: number;
  token: string;
  used: boolean;
}
