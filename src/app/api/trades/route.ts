import { NextRequest, NextResponse } from 'next/server';
import { getTrades, saveTrade, saveTrades, deleteTrade, getAllTrades } from '@/lib/server/data-store';
import { Trade } from '@/types';
import { requireAuth } from '@/lib/server/middleware/auth';

// GET /api/trades - Lấy tất cả trades
export async function GET(request: NextRequest) {
  return requireAuth(async () => {
    try {
      console.log('GET /api/trades: Processing request');
      const url = new URL(request.url);
      const allJournals = url.searchParams.get('allJournals') === 'true';
      const journalId = url.searchParams.get('journalId');
      
      let trades;
      if (allJournals) {
        console.log('GET /api/trades: Fetching trades from all journals');
        trades = await getAllTrades();
      } else if (journalId) {
        console.log(`GET /api/trades: Fetching trades for specific journal: ${journalId}`);
        // Lấy tất cả giao dịch rồi lọc theo journalId
        const allTrades = await getAllTrades();
        trades = allTrades.filter(trade => trade.journalId === journalId);
      } else {
        console.log('GET /api/trades: Fetching trades from current journal only');
        trades = await getTrades();
      }
      
      console.log(`GET /api/trades: Found ${trades.length} trades`);
      return NextResponse.json({ trades });
    } catch (error) {
      console.error('Error retrieving trades:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ 
        error: 'Failed to fetch trades',
        details: errorMessage
      }, { status: 500 });
    }
  });
}

// POST /api/trades - Tạo trade mới
export async function POST(request: NextRequest) {
  return requireAuth(async () => {
    try {
      console.log('POST /api/trades: Processing request');
      const body = await request.json();
      console.log('POST /api/trades: Request body parsed', { body });
      
      if (!body.trade) {
        return NextResponse.json({ 
          error: 'Trade data is required',
          receivedData: body 
        }, { status: 400 });
      }
      
      const newTrade: Omit<Trade, 'id'> = body.trade;
      
      // Kiểm tra và đảm bảo tradeType có giá trị hợp lệ
      if (!newTrade.tradeType || !['buy', 'sell'].includes(newTrade.tradeType)) {
        console.error('POST /api/trades: Invalid tradeType:', newTrade.tradeType);
        return NextResponse.json({ 
          error: 'tradeType must be either "buy" or "sell"',
          receivedTradeType: newTrade.tradeType
        }, { status: 400 });
      }
      
      // Tạo ID mới nếu không có
      const completeTrade: Trade = {
        ...newTrade,
        id: crypto.randomUUID(),
      };
      
      console.log('POST /api/trades: Saving trade to database', {
        id: completeTrade.id,
        journalId: completeTrade.journalId,
        symbol: completeTrade.symbol,
        tradeType: completeTrade.tradeType
      });
      
      // Lưu trade mới vào database
      const success = await saveTrade(completeTrade);
      
      if (!success) {
        console.error('POST /api/trades: Failed to save trade to database');
        return NextResponse.json({ error: 'Failed to save trade to database' }, { status: 500 });
      }
      
      console.log('POST /api/trades: Trade created successfully', { id: completeTrade.id });
      return NextResponse.json({ trade: completeTrade });
    } catch (error) {
      console.error('Error creating trade:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ 
        error: 'Failed to create trade',
        details: errorMessage
      }, { status: 500 });
    }
  });
}

// PUT /api/trades - Cập nhật trade
export async function PUT(request: NextRequest) {
  return requireAuth(async () => {
    try {
      console.log('PUT /api/trades: Processing request');
      const body = await request.json();
      console.log('PUT /api/trades: Request body parsed', { bodyKeys: Object.keys(body) });
      
      // Special case for bulk update (used by loadDemoData)
      if (body.trades !== undefined) {
        console.log('PUT /api/trades: Bulk update detected');
        const success = await saveTrades(body.trades);
        if (!success) {
          return NextResponse.json({ error: 'Failed to save trades to database' }, { status: 500 });
        }
        return NextResponse.json({ success: true, count: body.trades.length });
      }
      
      if (!body.id || !body.trade) {
        return NextResponse.json({ 
          error: 'Trade ID and trade data are required',
          receivedKeys: Object.keys(body)
        }, { status: 400 });
      }
      
      const { id, trade } = body;
      
      // Đảm bảo trade có ID chính xác
      const tradeToUpdate: Trade = {
        ...trade,
        id,
      };
      
      // Lưu trade cập nhật vào database
      const success = await saveTrade(tradeToUpdate);
      
      if (!success) {
        return NextResponse.json({ error: 'Failed to update trade in database' }, { status: 500 });
      }
      
      console.log('PUT /api/trades: Trade updated successfully', { id });
      return NextResponse.json({ trade: tradeToUpdate });
    } catch (error) {
      console.error('Error updating trade:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ 
        error: 'Failed to update trade',
        details: errorMessage
      }, { status: 500 });
    }
  });
}

// DELETE /api/trades - Xóa trade
export async function DELETE(request: NextRequest) {
  return requireAuth(async () => {
    try {
      console.log('DELETE /api/trades: Processing request');
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      
      if (!id) {
        return NextResponse.json({ error: 'Trade ID is required' }, { status: 400 });
      }
      
      console.log('DELETE /api/trades: Deleting trade', { id });
      
      // Xóa trade từ database
      const success = await deleteTrade(id);
      
      if (!success) {
        return NextResponse.json({ error: 'Failed to delete trade from database' }, { status: 500 });
      }
      
      console.log('DELETE /api/trades: Trade deleted successfully', { id });
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting trade:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ 
        error: 'Failed to delete trade',
        details: errorMessage
      }, { status: 500 });
    }
  });
}
