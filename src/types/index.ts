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
  date: string;
  symbol: string;
  direction: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  size: number;
  fees?: number;
  returnValue?: number;
  returnPercent?: number;
  strategy?: string;
  setup?: string;
  notes?: string;
  images?: string[];
  tags?: string[];
  status: 'planned' | 'open' | 'closed' | 'canceled';
  emotions?: {
    before?: string;
    during?: string;
    after?: string;
  };
  mistakes?: string[];
  rating?: number;
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

export interface PasswordResetRequest {
  email: string;
  requestedAt: number;
  token: string;
  used: boolean;
}
