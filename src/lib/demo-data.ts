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

// Generate a random time between 9:30 and 16:00 (market hours)
function getRandomMarketTime(): string {
  const hour = getRandomNumber(9, 15);
  const minute = getRandomNumber(0, 59);
  // Add special case for 9:30+ (market open)
  if (hour === 9 && minute < 30) {
    return `09:${30 + getRandomNumber(0, 29)}`;
  }
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

// List of common stock symbols
const stockSymbols = [
  'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 
  'TSLA', 'NVDA', 'AMD', 'INTC', 'JPM',
  'BAC', 'WMT', 'DIS', 'NFLX', 'V', 
  'JNJ', 'PG', 'KO', 'PEP', 'MCD'
];

// Trading setups
const tradingSetups = [
  'breakout', 'pullback', 'trend_following', 'reversal', 
  'gap_fill', 'support_resistance', 'earnings_play', 'news_event'
];

// Mood options
const moodOptions = ['calm', 'excited', 'anxious', 'confident', 'unsure'];

// Risk levels
const riskLevels = ['low', 'medium', 'high'];

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
  
  // Sometimes have open trades (about 20% of the time)
  const hasExitInfo = Math.random() > 0.2;
  
  // Sometimes include stop loss and take profit (about 70% of the time)
  const hasStopLoss = Math.random() > 0.3;
  const hasTakeProfit = Math.random() > 0.3;
  
  // Calculate stop loss and take profit based on entry price and direction
  let stopLoss = null;
  let takeProfit = null;
  
  if (hasStopLoss) {
    if (tradeType === 'buy') {
      stopLoss = entryPrice * (1 - getRandomFloat(0.05, 0.15));
    } else {
      stopLoss = entryPrice * (1 + getRandomFloat(0.05, 0.15));
    }
  }
  
  if (hasTakeProfit) {
    if (tradeType === 'buy') {
      takeProfit = entryPrice * (1 + getRandomFloat(0.1, 0.3));
    } else {
      takeProfit = entryPrice * (1 - getRandomFloat(0.1, 0.3));
    }
  }
  
  // Generate random trade rating (1-5)
  const hasRating = Math.random() > 0.3;
  const rating = hasRating ? getRandomNumber(1, 5) : undefined;
  
  // Generate random setup, risk and mood (30% chance of no data)
  const hasSetup = Math.random() > 0.3;
  const hasRisk = Math.random() > 0.3;
  const hasMood = Math.random() > 0.3;
  
  return {
    id,
    symbol,
    tradeType,
    quantity,
    entryDate: getPastDate(daysAgo),
    entryTime: getRandomMarketTime(),
    exitDate: hasExitInfo ? getPastDate(daysAgo - holdingPeriod) : undefined,
    exitTime: hasExitInfo ? getRandomMarketTime() : undefined,
    entryPrice,
    exitPrice: hasExitInfo ? exitPrice : undefined,
    stopLoss: hasStopLoss ? stopLoss : undefined,
    takeProfit: hasTakeProfit ? takeProfit : undefined,
    fees: getRandomFloat(5, 15),
    setup: hasSetup ? tradingSetups[getRandomNumber(0, tradingSetups.length - 1)] : undefined,
    risk: hasRisk ? riskLevels[getRandomNumber(0, riskLevels.length - 1)] : undefined,
    mood: hasMood ? moodOptions[getRandomNumber(0, moodOptions.length - 1)] : undefined,
    rating,
    notes: Math.random() > 0.5 ? `${tradeType === 'buy' ? 'Long' : 'Short'} trade on ${symbol} based on ${hasSetup ? tradingSetups[getRandomNumber(0, tradingSetups.length - 1)].replace('_', ' ') : 'technical analysis'}` : undefined,
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