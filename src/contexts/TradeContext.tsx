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
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'tradeInsightsTrades';

export function TradeProvider({ children }: { children: ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    try {
      const storedTrades = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedTrades) {
        setTrades(JSON.parse(storedTrades));
      }
    } catch (error) {
      console.error("Failed to load trades from localStorage", error);
      // Optionally, clear corrupted data: localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) { 
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trades));
      } catch (error) {
        console.error("Failed to save trades to localStorage", error);
      }
    }
  }, [trades, isLoading]);

  const addTrade = useCallback((tradeData: Omit<Trade, 'id'>) => {
    const newTrade: Trade = {
      ...tradeData,
      id: crypto.randomUUID(),
    };
    setTrades((prevTrades) => [...prevTrades, newTrade]);
  }, []);

  const updateTrade = useCallback((updatedTrade: Trade) => {
    setTrades((prevTrades) => 
      prevTrades.map(trade => trade.id === updatedTrade.id ? updatedTrade : trade)
    );
  }, []);

  const deleteTrade = useCallback((tradeId: string) => {
    setTrades((prevTrades) => prevTrades.filter(trade => trade.id !== tradeId));
  }, []);

  const loadDemoData = useCallback(() => {
    setIsLoading(true);
    // Generate 150 demo trades
    const demoTrades = generateDemoTrades(150);
    setTrades(demoTrades);
    setIsLoading(false);
    
    // Optional: Save to localStorage
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(demoTrades));
    } catch (error) {
      console.error("Failed to save demo trades to localStorage", error);
    }
  }, []);

  return (
    <TradeContext.Provider value={{ trades, addTrade, updateTrade, deleteTrade, isLoading, loadDemoData }}>
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
