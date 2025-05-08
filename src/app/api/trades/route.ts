import { NextRequest, NextResponse } from 'next/server';
import { getTrades, saveTrades } from '@/lib/server/data-store';
import { Trade } from '@/types';

// GET /api/trades - Lấy tất cả trades
export async function GET() {
  try {
    console.log('GET /api/trades: Processing request');
    const trades = await getTrades();
    console.log(`GET /api/trades: Found ${trades.length} trades`);
    return NextResponse.json({ trades });
  } catch (error) {
    console.error('Error retrieving trades:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    return NextResponse.json({ 
      error: 'Failed to fetch trades',
      details: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}

// POST /api/trades - Tạo trade mới
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/trades: Processing request');
    const body = await request.json();
    console.log('POST /api/trades: Request body parsed', { bodyKeys: Object.keys(body) });
    
    if (!body.trade) {
      return NextResponse.json({ 
        error: 'Trade data is required',
        receivedData: body 
      }, { status: 400 });
    }
    
    const newTrade: Omit<Trade, 'id'> = body.trade;

    const trades = await getTrades();
    const completeTrade: Trade = {
      ...newTrade,
      id: crypto.randomUUID(),
    };

    const updatedTrades = [...trades, completeTrade];
    await saveTrades(updatedTrades);
    
    console.log('POST /api/trades: Trade created successfully', { id: completeTrade.id });
    return NextResponse.json({ trade: completeTrade });
  } catch (error) {
    console.error('Error creating trade:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    return NextResponse.json({ 
      error: 'Failed to create trade',
      details: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}

// PUT /api/trades - Cập nhật trade
export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/trades: Processing request');
    const body = await request.json();
    console.log('PUT /api/trades: Request body parsed', { bodyKeys: Object.keys(body) });
    
    // Special case for bulk update (used by loadDemoData)
    if (body.trades !== undefined) {
      console.log('PUT /api/trades: Bulk update detected');
      await saveTrades(body.trades);
      return NextResponse.json({ success: true, count: body.trades.length });
    }
    
    if (!body.id || !body.trade) {
      return NextResponse.json({ 
        error: 'Trade ID and trade data are required',
        receivedKeys: Object.keys(body)
      }, { status: 400 });
    }
    
    const { id, trade } = body;
    const trades = await getTrades();
    
    if (!trades.some(t => t.id === id)) {
      return NextResponse.json({ error: `Trade with ID ${id} not found` }, { status: 404 });
    }
    
    const updatedTrades = trades.map(t => t.id === id ? trade : t);
    await saveTrades(updatedTrades);
    
    console.log('PUT /api/trades: Trade updated successfully', { id });
    return NextResponse.json({ trade: updatedTrades.find(t => t.id === id) });
  } catch (error) {
    console.error('Error updating trade:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    return NextResponse.json({ 
      error: 'Failed to update trade',
      details: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}

// DELETE /api/trades - Xóa trade
export async function DELETE(request: NextRequest) {
  try {
    console.log('DELETE /api/trades: Processing request');
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Trade ID is required' }, { status: 400 });
    }
    
    console.log('DELETE /api/trades: Deleting trade', { id });
    const trades = await getTrades();
    
    if (!trades.some(t => t.id === id)) {
      return NextResponse.json({ error: `Trade with ID ${id} not found` }, { status: 404 });
    }
    
    const updatedTrades = trades.filter(trade => trade.id !== id);
    
    await saveTrades(updatedTrades);
    console.log('DELETE /api/trades: Trade deleted successfully', { id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting trade:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    return NextResponse.json({ 
      error: 'Failed to delete trade',
      details: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}