// filepath: /Users/tinanpha/Desktop/trading/src/contexts/JournalContext.tsx
"use client";
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Journal, Trade } from '@/types';

// Hàm trợ giúp để xử lý fetch API và phân tích JSON an toàn
async function safeFetch(url: string, options?: RequestInit) {
  try {
    console.log(`Fetching ${options?.method || 'GET'} ${url}`);
    const response = await fetch(url, options);
    
    // Kiểm tra content-type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`Expected JSON but got ${contentType || 'unknown content type'}`);
      throw new Error(`API returned non-JSON response: ${contentType}`);
    }
    
    // Kiểm tra status code
    if (!response.ok) {
      const errorText = await response.text();
      let errorInfo;
      try {
        errorInfo = JSON.parse(errorText);
      } catch (e) {
        console.error(`Non-JSON error from API: ${errorText}`);
        errorInfo = { error: `Status ${response.status}: ${response.statusText}` };
      }
      throw new Error(errorInfo.error || `API error: ${response.status}`);
    }
    
    // Parse JSON
    try {
      const data = await response.json();
      return { data, response };
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      const rawText = await response.text();
      console.error('Raw response:', rawText);
      throw new Error('Invalid JSON response from server');
    }
  } catch (error) {
    console.error(`API request failed: ${url}`, error);
    throw error;
  }
}

// Thêm hàm fetchTradesForJournal để lấy dữ liệu giao dịch từ API
const fetchTradesForJournal = async (journalId: string) => {
  try {
    const { data } = await safeFetch('/api/trades');
    return data.trades || [];
  } catch (error) {
    console.error('Error fetching trades:', error);
    return [];
  }
};

interface JournalContextType {
  journals: Journal[];
  currentJournalId: string | null;
  addJournal: (journal: Omit<Journal, 'id' | 'createdAt' | 'updatedAt'>) => Journal;
  updateJournal: (updatedJournal: Journal) => void;
  deleteJournal: (journalId: string) => void;
  switchJournal: (journalId: string) => Promise<void>;
  getCurrentJournal: () => Journal | undefined;
  addTradeToJournal: (journalId: string, tradeData: Omit<Trade, 'id'>) => Promise<Trade>;
  updateTradeInJournal: (journalId: string, updatedTrade: Trade) => Promise<Trade>;
  deleteTradeFromJournal: (journalId: string, tradeId: string) => Promise<void>;
  createTemplateJournal: (templateName: string) => Journal;
  refreshJournalData: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

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
  const [error, setError] = useState<string | null>(null);

  // Initialize journals from server
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    const fetchJournals = async () => {
      try {
        const { data } = await safeFetch('/api/journals');
        
        if (data.journals && Array.isArray(data.journals)) {
          console.log(`Loaded ${data.journals.length} journals from server`);
          setJournals(data.journals);
          
          // Set current journal ID
          if (data.currentJournalId && data.journals.some(j => j.id === data.currentJournalId)) {
            console.log(`Setting current journal to ${data.currentJournalId}`);
            setCurrentJournalId(data.currentJournalId);
          } else if (data.journals.length > 0) {
            // Set the first journal as current if no valid current journal ID
            const defaultJournal = data.journals.find(j => j.isDefault) || data.journals[0];
            console.log(`No current journal set, defaulting to ${defaultJournal.id}`);
            setCurrentJournalId(defaultJournal.id);
            
            // Update the current journal ID on the server
            await safeFetch('/api/journals', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ journalId: defaultJournal.id })
            });
          }
        } else if (!data.journals || data.journals.length === 0) {
          console.log('No journals found, creating default journal');
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
            trades: [], // Remove demo trades
            settings: {
              currency: "USD",
              initialCapital: 10000,
              riskPercentage: 1,
            }
          };
          
          const { data: createData } = await safeFetch('/api/journals', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ journal: defaultJournal })
          });
          
          console.log('Default journal created', createData.journal.id);
          setJournals([createData.journal]);
          setCurrentJournalId(createData.journal.id);
          
          // Set the current journal ID on the server
          await safeFetch('/api/journals', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ journalId: createData.journal.id })
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Failed to load journals from server", errorMessage);
        setError(`Failed to load journals: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJournals();
  }, []);

  // No need to watch for changes in journals as we now update the server
  // when changes are made via the methods below

  const addJournal = useCallback(async (journalData: Omit<Journal, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data } = await safeFetch('/api/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ journal: journalData })
      });
      
      const newJournal = data.journal;
      console.log('Journal added successfully', newJournal.id);
      
      setJournals(prevJournals => [...prevJournals, newJournal]);
      return newJournal;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error adding journal:', errorMessage);
      throw new Error(`Failed to add journal: ${errorMessage}`);
    }
  }, []);

  const updateJournal = useCallback(async (updatedJournal: Journal) => {
    try {
      const { data } = await safeFetch('/api/journals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: updatedJournal.id, journal: updatedJournal })
      });
      
      console.log('Journal updated successfully', updatedJournal.id);
      
      setJournals(prevJournals => 
        prevJournals.map(journal => 
          journal.id === updatedJournal.id ? data.journal : journal
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error updating journal:', errorMessage);
      throw new Error(`Failed to update journal: ${errorMessage}`);
    }
  }, []);

  const deleteJournal = useCallback(async (journalId: string) => {
    try {
      await safeFetch(`/api/journals?id=${journalId}`, {
        method: 'DELETE'
      });
      
      console.log('Journal deleted successfully', journalId);
      
      setJournals(prevJournals => {
        const filteredJournals = prevJournals.filter(journal => journal.id !== journalId);
        
        // If we're deleting the current journal, switch to another one
        if (journalId === currentJournalId && filteredJournals.length > 0) {
          const newCurrentJournal = filteredJournals[0];
          setCurrentJournalId(newCurrentJournal.id);
          
          // Update the current journal ID on the server
          safeFetch('/api/journals', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ journalId: newCurrentJournal.id })
          }).catch(error => {
            console.error('Error updating current journal after delete:', error);
          });
        }
        
        return filteredJournals;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error deleting journal:', errorMessage);
      throw new Error(`Failed to delete journal: ${errorMessage}`);
    }
  }, [currentJournalId]);

  const switchJournal = useCallback(async (journalId: string) => {
    if (journals.some(journal => journal.id === journalId)) {
      try {
        await safeFetch('/api/journals', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ journalId })
        });
        
        console.log('Switched to journal', journalId);
        setCurrentJournalId(journalId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error switching journal:', errorMessage);
        throw new Error(`Failed to switch journal: ${errorMessage}`);
      }
    }
  }, [journals]);

  const getCurrentJournal = useCallback(() => {
    return journals.find(journal => journal.id === currentJournalId);
  }, [journals, currentJournalId]);

  const addTradeToJournal = useCallback(async (journalId: string, tradeData: Omit<Trade, 'id'>) => {
    try {
      // Thay đổi: Sử dụng API /api/trades để thêm giao dịch thay vì lưu vào journal
      const { data } = await safeFetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trade: tradeData })
      });
      
      console.log('Trade added successfully via /api/trades', data.trade.id);
      
      // Cập nhật updateAt của journal để biết là có thay đổi
      const journal = journals.find(j => j.id === journalId);
      if (journal) {
        const updatedJournal = {
          ...journal,
          updatedAt: new Date().toISOString()
        };
        
        await safeFetch('/api/journals', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: journalId, journal: updatedJournal })
        });
      }
      
      return data.trade;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error adding trade:', errorMessage);
      throw new Error(`Failed to add trade: ${errorMessage}`);
    }
  }, [journals]);

  const updateTradeInJournal = useCallback(async (journalId: string, updatedTrade: Trade) => {
    try {
      // Thay đổi: Sử dụng API /api/trades để cập nhật giao dịch 
      const { data } = await safeFetch('/api/trades', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: updatedTrade.id, trade: updatedTrade })
      });
      
      console.log('Trade updated successfully via /api/trades', updatedTrade.id);
      
      // Cập nhật updateAt của journal để biết là có thay đổi
      const journal = journals.find(j => j.id === journalId);
      if (journal) {
        const updatedJournal = {
          ...journal,
          updatedAt: new Date().toISOString()
        };
        
        await safeFetch('/api/journals', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: journalId, journal: updatedJournal })
        });
      }
      
      return data.trade;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error updating trade:', errorMessage);
      throw new Error(`Failed to update trade: ${errorMessage}`);
    }
  }, [journals]);

  const deleteTradeFromJournal = useCallback(async (journalId: string, tradeId: string) => {
    try {
      // Thay đổi: Sử dụng API /api/trades để xóa giao dịch
      await safeFetch(`/api/trades?id=${tradeId}`, {
        method: 'DELETE'
      });
      
      console.log('Trade deleted successfully via /api/trades', tradeId);
      
      // Cập nhật updateAt của journal để biết là có thay đổi
      const journal = journals.find(j => j.id === journalId);
      if (journal) {
        const updatedJournal = {
          ...journal,
          updatedAt: new Date().toISOString()
        };
        
        const { data } = await safeFetch('/api/journals', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: journalId, journal: updatedJournal })
        });
        
        setJournals(prevJournals => 
          prevJournals.map(j => j.id === journalId ? data.journal : j)
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error deleting trade:', errorMessage);
      throw new Error(`Failed to delete trade: ${errorMessage}`);
    }
  }, [journals]);

  const createTemplateJournal = useCallback(async (templateName: string) => {
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
    
    try {
      const { data } = await safeFetch('/api/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ journal: newJournal })
      });
      
      const createdJournal = data.journal;
      console.log('Template journal created successfully', createdJournal.id);
      
      setJournals(prevJournals => [...prevJournals, createdJournal]);
      return createdJournal;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating template journal:', errorMessage);
      throw new Error(`Failed to create journal from template: ${errorMessage}`);
    }
  }, []);

  const refreshJournalData = useCallback(async () => {
    console.log("Refreshing journal data...");
    setIsLoading(true);
    try {
      // Tải lại dữ liệu journal từ server
      const { data } = await safeFetch('/api/journals', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (data.journals && Array.isArray(data.journals)) {
        console.log(`Refreshed ${data.journals.length} journals from server`);
        setJournals(data.journals);
        
        // Cập nhật currentJournalId nếu cần
        if (data.currentJournalId && data.journals.some(j => j.id === data.currentJournalId)) {
          setCurrentJournalId(data.currentJournalId);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Failed to refresh journals", errorMessage);
      setError(`Failed to refresh journals: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
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
      refreshJournalData,
      isLoading,
      error
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