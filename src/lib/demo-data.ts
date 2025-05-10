import { v4 as uuidv4 } from 'uuid';
import { Trade } from '@/types';

// Danh sách các cặp tiền tệ phổ biến
const symbols = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF',
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT', 'XRPUSDT',
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META'
];

// Các kỹ thuật/setup phổ biến
const setups = [
  'Breakout', 'Support/Resistance', 'Double Top', 'Double Bottom',
  'Head and Shoulders', 'Inverse H&S', 'Trend Following', 'Moving Average Crossover',
  'RSI Divergence', 'MACD Crossover', 'Fibonacci Retracement', 'Engulfing Pattern',
  'Pin Bar', 'Doji', 'Hammer'
];

// Các chiến lược giao dịch
const strategies = [
  'Swing Trading', 'Day Trading', 'Position Trading', 'Scalping',
  'Trend Following', 'Mean Reversion', 'Breakout Trading', 'Counter-Trend',
  'Momentum Trading', 'Range Trading'
];

// Các tâm trạng khi giao dịch
const moods = ['calm', 'excited', 'anxious', 'confident', 'unsure'];

// Các loại rủi ro
const risks = ['low', 'medium', 'high'];

// Các trạng thái giao dịch
const statuses = ['planned', 'open', 'closed', 'canceled'];

// Tạo một ngày ngẫu nhiên trong khoảng thời gian
function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0]; // Định dạng YYYY-MM-DD
}

// Tạo thời gian ngẫu nhiên
function randomTime(): string {
  const hours = Math.floor(Math.random() * 24).toString().padStart(2, '0');
  const minutes = Math.floor(Math.random() * 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:00`;
}

// Lấy giá trị ngẫu nhiên từ mảng
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Tạo số ngẫu nhiên trong khoảng
function randomNumber(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Tạo số nguyên ngẫu nhiên trong khoảng
function randomInt(min: number, max: number): number {
  return Math.floor(randomNumber(min, max));
}

// Tạo giao dịch mẫu
export function generateDemoTrades(count: number): Trade[] {
  const trades: Trade[] = [];
  
  // Tạo một danh sách 5 playbook IDs để có thể tạo thống kê
  const playbookIds = Array(5).fill(0).map(() => uuidv4());
  
  // Thời gian bắt đầu từ 6 tháng trước đến hiện tại
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  
  for (let i = 0; i < count; i++) {
    // Tạo ngày bắt đầu và kết thúc giao dịch
    const entryDate = randomDate(startDate, endDate);
    
    // Tính ngày kết thúc (có thể là 1-5 ngày sau ngày bắt đầu)
    const exitDateObj = new Date(entryDate);
    exitDateObj.setDate(exitDateObj.getDate() + randomInt(0, 5));
    const exitDate = exitDateObj <= endDate ? 
      exitDateObj.toISOString().split('T')[0] : 
      endDate.toISOString().split('T')[0];
    
    // Xác định các thông số giao dịch
    const symbol = randomItem(symbols);
    const entryPrice = parseFloat(randomNumber(10, 1000).toFixed(2));
    
    // Tính giá thoát (thay đổi khoảng -10% đến +15%)
    const priceChange = randomNumber(-0.1, 0.15);
    const exitPrice = parseFloat((entryPrice * (1 + priceChange)).toFixed(2));
    
    // Xác định hướng giao dịch dựa trên giá entry/exit
    const direction = exitPrice > entryPrice ? 'long' : 'short';
    
    // Tính lợi nhuận/lỗ
    const returnValue = direction === 'long' ? 
      exitPrice - entryPrice : 
      entryPrice - exitPrice;
    
    // Tính phần trăm lợi nhuận/lỗ
    const returnPercent = (returnValue / entryPrice) * 100;
    
    // Số lượng/kích thước giao dịch
    const quantity = randomInt(1, 100);
    const size = quantity * entryPrice;
    
    // Tạo một giao dịch
    const trade: Trade = {
      id: uuidv4(),
      entryDate,
      entryTime: randomTime(),
      exitDate,
      exitTime: randomTime(),
      symbol,
      tradeType: direction === 'long' ? 'buy' : 'sell',
      direction: direction as 'long' | 'short',
      quantity,
      size,
      entryPrice,
      exitPrice,
      stopLoss: direction === 'long' ? 
        parseFloat((entryPrice * 0.95).toFixed(2)) : 
        parseFloat((entryPrice * 1.05).toFixed(2)),
      takeProfit: direction === 'long' ? 
        parseFloat((entryPrice * 1.1).toFixed(2)) : 
        parseFloat((entryPrice * 0.9).toFixed(2)),
      returnValue,
      returnPercent,
      fees: parseFloat((size * 0.001).toFixed(2)), // Phí giao dịch 0.1%
      setup: randomItem(setups),
      strategy: randomItem(strategies),
      playbook: randomItem(playbookIds), // Gán một playbook ngẫu nhiên
      risk: randomItem(risks) as 'low' | 'medium' | 'high',
      mood: randomItem(moods) as 'calm' | 'excited' | 'anxious' | 'confident' | 'unsure',
      rating: randomInt(1, 5),
      notes: `Demo trade for ${symbol} using ${randomItem(strategies)} strategy.`,
      tags: [randomItem(strategies), randomItem(setups)],
      status: randomItem(statuses) as 'planned' | 'open' | 'closed' | 'canceled',
      mistakes: Math.random() > 0.7 ? ['Entered too early', 'Exited too late'] : [],
      emotions: {
        before: Math.random() > 0.5 ? 'Feeling optimistic about this setup' : 'Uncertain about market conditions',
        during: Math.random() > 0.5 ? 'Confident in my analysis' : 'Nervous about price action',
        after: returnValue > 0 ? 'Satisfied with the result' : 'Disappointed but learning'
      }
    };
    
    trades.push(trade);
  }
  
  // Sắp xếp giao dịch theo ngày từ cũ đến mới
  return trades.sort((a, b) => {
    const dateA = new Date(`${a.entryDate} ${a.entryTime}`).getTime();
    const dateB = new Date(`${b.entryDate} ${b.entryTime}`).getTime();
    return dateA - dateB;
  });
}