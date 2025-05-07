// Mock trade data for better analytics visualization
import { Trade } from '@/types';

// Generate a date in the past with a specified offset in days
function getPastDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

// Generate a random number between min and max (inclusive)
function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random float with specified precision
function getRandomFloat(min: number, max: number, precision: number = 2): number {
  const random = Math.random() * (max - min) + min;
  return parseFloat(random.toFixed(precision));
}

// List of common stock symbols
const stockSymbols = [
  'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 
  'TSLA', 'NVDA', 'AMD', 'INTC', 'JPM',
  'BAC', 'WMT', 'DIS', 'NFLX', 'V', 
  'JNJ', 'PG', 'KO', 'PEP', 'MCD'
];

// Generate a single random trade
function generateRandomTrade(id: string, daysAgo: number): Trade {
  const symbol = stockSymbols[getRandomNumber(0, stockSymbols.length - 1)];
  const tradeType = Math.random() > 0.5 ? 'buy' : 'sell';
  const quantity = getRandomNumber(1, 100) * 10;
  
  const entryPrice = getRandomFloat(50, 500);
  // Create more winning trades than losing for better visualization
  const isWinning = Math.random() > 0.4;
  
  // For winning trades in longs, exit price is higher; for shorts, it's lower
  let exitPriceChange = isWinning ? 
    getRandomFloat(0.01, 0.15) : getRandomFloat(-0.15, -0.01);
    
  // Reverse for short trades
  if (tradeType === 'sell') {
    exitPriceChange = -exitPriceChange;
  }
  
  const exitPrice = entryPrice * (1 + exitPriceChange);
  
  // Generate random holding period between 1-14 days
  const holdingPeriod = getRandomNumber(1, 14);
  
  return {
    id,
    symbol,
    tradeType,
    quantity,
    entryDate: getPastDate(daysAgo),
    exitDate: getPastDate(daysAgo - holdingPeriod),
    entryPrice,
    exitPrice,
    fees: getRandomFloat(5, 15),
    notes: `${tradeType === 'buy' ? 'Long' : 'Short'} trade on ${symbol}`,
    strategy: getRandomStrategy(),
    riskRewardRatio: getRandomFloat(0.5, 4, 1)
  };
}

// Get a random trading strategy
function getRandomStrategy(): string {
  const strategies = [
    'Trend Following', 
    'Breakout', 
    'Pullback', 
    'Gap Trading',
    'Momentum',
    'Reversal',
    'Support/Resistance'
  ];
  
  return strategies[getRandomNumber(0, strategies.length - 1)];
}

// Generate multiple trades over the past year
export function generateDemoTrades(count: number = 150): Trade[] {
  const trades: Trade[] = [];
  
  // Generate trades spread across the past year (365 days)
  for (let i = 0; i < count; i++) {
    const daysAgo = getRandomNumber(1, 365);
    trades.push(generateRandomTrade(`demo-${i}`, daysAgo));
  }
  
  // Sort trades by entry date (newest first)
  return trades.sort((a, b) => 
    new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
  );
}