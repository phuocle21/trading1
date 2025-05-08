import { NextRequest, NextResponse } from 'next/server';
import { getTrades, saveTrades } from '@/lib/server/data-store';
import { Trade } from '@/types';

// GET /api/trades - Lấy tất cả trades
export async function GET() {
  try {
    const trades = await getTrades();
    return NextResponse.json({ trades });
  } catch (error) {
    console.error('Error retrieving trades:', error);
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}

// POST /api/trades - Tạo trade mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newTrade: Omit<Trade, 'id'> = body.trade;

    const trades = await getTrades();
    const completeTrade: Trade = {
      ...newTrade,
      id: crypto.randomUUID(),
    };

    const updatedTrades = [...trades, completeTrade];
    await saveTrades(updatedTrades);
    
    return NextResponse.json({ trade: completeTrade });
  } catch (error) {
    console.error('Error creating trade:', error);
    return NextResponse.json({ error: 'Failed to create trade' }, { status: 500 });
  }
}

// PUT /api/trades - Cập nhật trade
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, trade } = body;
    const trades = await getTrades();
    
    const updatedTrades = trades.map(t => t.id === id ? trade : t);
    await saveTrades(updatedTrades);
    
    return NextResponse.json({ trade: updatedTrades.find(t => t.id === id) });
  } catch (error) {
    console.error('Error updating trade:', error);
    return NextResponse.json({ error: 'Failed to update trade' }, { status: 500 });
  }
}

// DELETE /api/trades - Xóa trade
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Trade ID is required' }, { status: 400 });
    }
    
    const trades = await getTrades();
    const updatedTrades = trades.filter(trade => trade.id !== id);
    
    await saveTrades(updatedTrades);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting trade:', error);
    return NextResponse.json({ error: 'Failed to delete trade' }, { status: 500 });
  }
}