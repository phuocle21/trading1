// src/contexts/TradeContext.tsx
"use client";
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Trade } from '@/types';
import { generateDemoTrades } from '@/lib/demo-data';

interface TradeContextType {
  trades: Trade[];
  addTrade: (tradeData: Omit<Trade, 'id'>) => void;
  updateTrade: (updatedTrade: Trade) => void;
  deleteTrade: (tradeId: string) => void;
  isLoading: boolean;
  loadDemoData: () => void;
  refreshTrades: () => Promise<void>; // Thêm hàm refresh
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export function TradeProvider({ children }: { children: ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tạo hàm fetchTrades để có thể tái sử dụng
  const fetchTrades = async () => {
    setIsLoading(true);
    try {
      console.log("Đang tải TẤT CẢ dữ liệu giao dịch của người dùng...");
      // Thêm tham số allJournals=true để lấy tất cả giao dịch từ tất cả journal của người dùng
      // Thêm timestamp để tránh cache
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/trades?allJournals=true&_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch trades');
      }
      
      const data = await response.json();
      if (data.trades && Array.isArray(data.trades)) {
        console.log(`Đã tải ${data.trades.length} giao dịch từ TẤT CẢ các journal`);
        setTrades(data.trades);
      } else {
        console.log("Không có dữ liệu giao dịch hoặc dữ liệu không phải mảng");
        setTrades([]);
      }
    } catch (error) {
      console.error('Error loading trades from server', error);
      setTrades([]); // Đặt mảng rỗng nếu có lỗi
    } finally {
      setIsLoading(false);
    }
  };

  // Tải dữ liệu giao dịch khi component được mount
  useEffect(() => {
    fetchTrades();
  }, []);

  const addTrade = useCallback(async (tradeData: Omit<Trade, 'id'>) => {
    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trade: tradeData })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create trade');
      }
      
      const data = await response.json();
      setTrades((prevTrades) => [...prevTrades, data.trade]);
    } catch (error) {
      console.error('Error adding trade:', error);
      throw error;
    }
  }, []);

  const updateTrade = useCallback(async (updatedTrade: Trade) => {
    try {
      const response = await fetch('/api/trades', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: updatedTrade.id, trade: updatedTrade })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update trade');
      }
      
      const data = await response.json();
      
      setTrades((prevTrades) => 
        prevTrades.map(trade => trade.id === updatedTrade.id ? data.trade : trade)
      );
    } catch (error) {
      console.error('Error updating trade:', error);
      throw error;
    }
  }, []);

  const deleteTrade = useCallback(async (tradeId: string) => {
    try {
      const response = await fetch(`/api/trades?id=${tradeId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete trade');
      }
      
      setTrades((prevTrades) => prevTrades.filter(trade => trade.id !== tradeId));
    } catch (error) {
      console.error('Error deleting trade:', error);
      throw error;
    }
  }, []);

  const loadDemoData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Generate 150 demo trades
      const demoTrades = generateDemoTrades(150);
      
      // Remove all existing trades first
      await fetch('/api/trades', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trades: [] })
      });
      
      // Add each demo trade to the server
      for (const trade of demoTrades) {
        await fetch('/api/trades', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ trade })
        });
      }
      
      // Fetch all trades again to update the state
      const response = await fetch('/api/trades');
      if (response.ok) {
        const data = await response.json();
        setTrades(data.trades);
      }
    } catch (error) {
      console.error('Error loading demo data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <TradeContext.Provider value={{ trades, addTrade, updateTrade, deleteTrade, isLoading, loadDemoData, refreshTrades: fetchTrades }}>
      {children}
    </TradeContext.Provider>
  );
}

export function useTrades() {
  const context = useContext(TradeContext);
  if (context === undefined) {
    throw new Error('useTrades must be used within a TradeProvider');
  }
  return context;
}
