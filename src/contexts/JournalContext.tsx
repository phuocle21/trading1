// filepath: /Users/tinanpha/Desktop/trading/src/contexts/JournalContext.tsx
"use client";
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Journal, Trade } from '@/types';
import { generateDemoTrades } from '@/lib/demo-data';

interface JournalContextType {
  journals: Journal[];
  currentJournalId: string | null;
  addJournal: (journal: Omit<Journal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateJournal: (updatedJournal: Journal) => void;
  deleteJournal: (journalId: string) => void;
  switchJournal: (journalId: string) => void;
  getCurrentJournal: () => Journal | undefined;
  addTradeToJournal: (journalId: string, tradeData: Omit<Trade, 'id'>) => void;
  updateTradeInJournal: (journalId: string, updatedTrade: Trade) => void;
  deleteTradeFromJournal: (journalId: string, tradeId: string) => void;
  createTemplateJournal: (templateName: string) => Journal;
  isLoading: boolean;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'tradeInsightsJournals';
const CURRENT_JOURNAL_KEY = 'tradeInsightsCurrentJournal';

// Sample journal templates
const journalTemplates = {
  stockTrading: {
    name: "Stock Trading Journal",
    description: "A journal for tracking stock trades in the equity markets.",
    icon: "trending-up",
    color: "#4f46e5",
    isTemplate: true,
    settings: {
      currency: "USD",
      initialCapital: 10000,
      riskPercentage: 1,
      tradingHours: {
        start: "09:30",
        end: "16:00"
      },
      tradingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      preferredTimeframes: ["1D", "1H", "15M"]
    },
    trades: []
  },
  swingTrading: {
    name: "Swing Trading Journal",
    description: "A journal specifically for swing trading strategies with multi-day holds.",
    icon: "activity",
    color: "#16a34a",
    isTemplate: true,
    settings: {
      currency: "USD",
      initialCapital: 15000,
      riskPercentage: 1.5,
      tradingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      preferredTimeframes: ["1W", "1D", "4H"]
    },
    trades: []
  },
  cryptoTrading: {
    name: "Crypto Trading Journal",
    description: "For tracking cryptocurrency trades across multiple exchanges.",
    icon: "bitcoin",
    color: "#f59e0b",
    isTemplate: true,
    settings: {
      currency: "USDT",
      initialCapital: 5000,
      riskPercentage: 2,
      tradingDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      preferredTimeframes: ["1D", "4H", "1H", "15M"]
    },
    trades: []
  },
  forexTrading: {
    name: "Forex Trading Journal",
    description: "For tracking forex currency pair trades.",
    icon: "globe",
    color: "#0ea5e9",
    isTemplate: true,
    settings: {
      currency: "USD",
      initialCapital: 5000,
      riskPercentage: 1,
      tradingHours: {
        start: "00:00",
        end: "23:59"
      },
      tradingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      preferredTimeframes: ["1D", "4H", "1H"]
    },
    trades: []
  },
  optionsTrading: {
    name: "Options Trading Journal",
    description: "For tracking options trades, including strategies like spreads and iron condors.",
    icon: "timeline",
    color: "#8b5cf6",
    isTemplate: true,
    settings: {
      currency: "USD",
      initialCapital: 20000,
      riskPercentage: 1,
      tradingHours: {
        start: "09:30",
        end: "16:00"
      },
      tradingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      preferredTimeframes: ["1D", "1H"]
    },
    trades: []
  }
};

export function JournalProvider({ children }: { children: ReactNode }) {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [currentJournalId, setCurrentJournalId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize journals from localStorage
  useEffect(() => {
    setIsLoading(true);
    try {
      // Load journals
      const storedJournals = localStorage.getItem(LOCAL_STORAGE_KEY);
      let journalData: Journal[] = [];
      
      if (storedJournals) {
        journalData = JSON.parse(storedJournals);
      } else {
        // Create a default journal if none exists
        const defaultJournal: Journal = {
          id: crypto.randomUUID(),
          name: "My Trading Journal",
          description: "Your primary trading journal",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          icon: "chart",
          color: "#4f46e5",
          isDefault: true,
          trades: generateDemoTrades(10), // Add some demo trades to get started
          settings: {
            currency: "USD",
            initialCapital: 10000,
            riskPercentage: 1,
          }
        };
        journalData = [defaultJournal];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(journalData));
      }
      
      setJournals(journalData);
      
      // Load current journal ID
      const storedCurrentJournalId = localStorage.getItem(CURRENT_JOURNAL_KEY);
      if (storedCurrentJournalId && journalData.some(j => j.id === storedCurrentJournalId)) {
        setCurrentJournalId(storedCurrentJournalId);
      } else if (journalData.length > 0) {
        // Set the first journal as current if no valid current journal ID
        const defaultJournal = journalData.find(j => j.isDefault) || journalData[0];
        setCurrentJournalId(defaultJournal.id);
        localStorage.setItem(CURRENT_JOURNAL_KEY, defaultJournal.id);
      }
      
    } catch (error) {
      console.error("Failed to load journals from localStorage", error);
    }
    setIsLoading(false);
  }, []);

  // Save journals to localStorage when they change
  useEffect(() => {
    if (!isLoading) { 
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(journals));
      } catch (error) {
        console.error("Failed to save journals to localStorage", error);
      }
    }
  }, [journals, isLoading]);

  // Save current journal ID to localStorage when it changes
  useEffect(() => {
    if (currentJournalId && !isLoading) {
      localStorage.setItem(CURRENT_JOURNAL_KEY, currentJournalId);
    }
  }, [currentJournalId, isLoading]);

  const addJournal = useCallback((journalData: Omit<Journal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const timestamp = new Date().toISOString();
    const newJournal: Journal = {
      ...journalData,
      id: crypto.randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
      trades: journalData.trades || []
    };
    
    setJournals((prevJournals) => [...prevJournals, newJournal]);
    return newJournal;
  }, []);

  const updateJournal = useCallback((updatedJournal: Journal) => {
    setJournals((prevJournals) => 
      prevJournals.map(journal => 
        journal.id === updatedJournal.id 
          ? { ...updatedJournal, updatedAt: new Date().toISOString() } 
          : journal
      )
    );
  }, []);

  const deleteJournal = useCallback((journalId: string) => {
    setJournals((prevJournals) => {
      const filteredJournals = prevJournals.filter(journal => journal.id !== journalId);
      
      // If we're deleting the current journal, switch to another one
      if (journalId === currentJournalId && filteredJournals.length > 0) {
        const newCurrentJournal = filteredJournals[0];
        setCurrentJournalId(newCurrentJournal.id);
        localStorage.setItem(CURRENT_JOURNAL_KEY, newCurrentJournal.id);
      }
      
      return filteredJournals;
    });
  }, [currentJournalId]);

  const switchJournal = useCallback((journalId: string) => {
    if (journals.some(journal => journal.id === journalId)) {
      setCurrentJournalId(journalId);
    }
  }, [journals]);

  const getCurrentJournal = useCallback(() => {
    return journals.find(journal => journal.id === currentJournalId);
  }, [journals, currentJournalId]);

  const addTradeToJournal = useCallback((journalId: string, tradeData: Omit<Trade, 'id'>) => {
    const newTrade: Trade = {
      ...tradeData,
      id: crypto.randomUUID(),
    };
    
    setJournals(prevJournals => 
      prevJournals.map(journal => {
        if (journal.id === journalId) {
          return {
            ...journal,
            trades: [...journal.trades, newTrade],
            updatedAt: new Date().toISOString()
          };
        }
        return journal;
      })
    );
    
    return newTrade;
  }, []);

  const updateTradeInJournal = useCallback((journalId: string, updatedTrade: Trade) => {
    setJournals(prevJournals => 
      prevJournals.map(journal => {
        if (journal.id === journalId) {
          return {
            ...journal,
            trades: journal.trades.map(trade => 
              trade.id === updatedTrade.id ? updatedTrade : trade
            ),
            updatedAt: new Date().toISOString()
          };
        }
        return journal;
      })
    );
  }, []);

  const deleteTradeFromJournal = useCallback((journalId: string, tradeId: string) => {
    setJournals(prevJournals => 
      prevJournals.map(journal => {
        if (journal.id === journalId) {
          return {
            ...journal,
            trades: journal.trades.filter(trade => trade.id !== tradeId),
            updatedAt: new Date().toISOString()
          };
        }
        return journal;
      })
    );
  }, []);

  const createTemplateJournal = useCallback((templateName: string) => {
    // @ts-ignore
    const template = journalTemplates[templateName] || journalTemplates.stockTrading;
    
    const timestamp = new Date().toISOString();
    const newJournal: Journal = {
      ...template,
      id: crypto.randomUUID(),
      isTemplate: false,
      isDefault: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      trades: []
    };
    
    setJournals((prevJournals) => [...prevJournals, newJournal]);
    return newJournal;
  }, []);

  return (
    <JournalContext.Provider value={{ 
      journals, 
      currentJournalId, 
      addJournal, 
      updateJournal, 
      deleteJournal, 
      switchJournal, 
      getCurrentJournal,
      addTradeToJournal,
      updateTradeInJournal,
      deleteTradeFromJournal,
      createTemplateJournal,
      isLoading 
    }}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournals() {
  const context = useContext(JournalContext);
  if (context === undefined) {
    throw new Error('useJournals must be used within a JournalProvider');
  }
  return context;
}