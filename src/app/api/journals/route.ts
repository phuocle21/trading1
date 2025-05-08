import { NextRequest, NextResponse } from 'next/server';
import { 
  getJournals, 
  saveJournals, 
  getCurrentJournalId, 
  setCurrentJournalId,
  migrateJournalData
} from '@/lib/server/data-store';
import { Journal } from '@/types';
import { cookies } from 'next/headers';

// Chạy di chuyển dữ liệu khi khởi động server
let migrationPromise: Promise<void> | null = null;

function ensureMigration() {
  if (!migrationPromise) {
    migrationPromise = migrateJournalData();
  }
  return migrationPromise;
}

// GET /api/journals - Lấy tất cả journals
export async function GET() {
  try {
    console.log('GET /api/journals: Processing request');
    
    // Đảm bảo di chuyển dữ liệu được thực hiện
    await ensureMigration();
    
    const journals = await getJournals();
    const currentJournalId = await getCurrentJournalId();
    console.log(`GET /api/journals: Found ${journals.length} journals, currentJournalId: ${currentJournalId}`);
    return NextResponse.json({ journals, currentJournalId });
  } catch (error) {
    console.error('Error retrieving journals:', error);
    return NextResponse.json({ error: 'Failed to fetch journals' }, { status: 500 });
  }
}

// POST /api/journals - Tạo journal mới
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/journals: Processing request');
    
    // Đảm bảo di chuyển dữ liệu được thực hiện
    await ensureMigration();
    
    const body = await request.json();
    console.log('POST /api/journals: Request body parsed', { bodyKeys: Object.keys(body) });
    
    if (!body.journal) {
      return NextResponse.json({ error: 'Journal data is required' }, { status: 400 });
    }
    
    const newJournal: Omit<Journal, 'id' | 'createdAt' | 'updatedAt'> = body.journal;

    const timestamp = new Date().toISOString();
    const journals = await getJournals();

    const completeJournal: Journal = {
      ...newJournal,
      id: crypto.randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
      trades: newJournal.trades || []
    };

    const updatedJournals = [...journals, completeJournal];
    await saveJournals(updatedJournals);
    
    console.log('POST /api/journals: Journal created successfully', { id: completeJournal.id });
    return NextResponse.json({ journal: completeJournal });
  } catch (error) {
    console.error('Error creating journal:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    return NextResponse.json({ 
      error: 'Failed to create journal', 
      details: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}

// PUT /api/journals - Cập nhật journal
export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/journals: Processing request');
    
    // Đảm bảo di chuyển dữ liệu được thực hiện
    await ensureMigration();
    
    const body = await request.json();
    console.log('PUT /api/journals: Request body parsed', { bodyKeys: Object.keys(body) });
    
    if (!body.id || !body.journal) {
      return NextResponse.json({ 
        error: 'Journal ID and journal data are required',
        receivedKeys: Object.keys(body) 
      }, { status: 400 });
    }
    
    const { id, journal } = body;
    const journals = await getJournals();
    
    if (!journals.some(j => j.id === id)) {
      return NextResponse.json({ error: `Journal with ID ${id} not found` }, { status: 404 });
    }
    
    const updatedJournals = journals.map(j => 
      j.id === id ? { ...journal, updatedAt: new Date().toISOString() } : j
    );
    
    await saveJournals(updatedJournals);
    console.log('PUT /api/journals: Journal updated successfully', { id });
    return NextResponse.json({ journal: updatedJournals.find(j => j.id === id) });
  } catch (error) {
    console.error('Error updating journal:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    return NextResponse.json({ 
      error: 'Failed to update journal', 
      details: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}

// DELETE /api/journals - Xóa journal
export async function DELETE(request: NextRequest) {
  try {
    console.log('DELETE /api/journals: Processing request');
    
    // Đảm bảo di chuyển dữ liệu được thực hiện
    await ensureMigration();
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Journal ID is required' }, { status: 400 });
    }
    
    console.log('DELETE /api/journals: Deleting journal', { id });
    const journals = await getJournals();
    
    if (!journals.some(j => j.id === id)) {
      return NextResponse.json({ error: `Journal with ID ${id} not found` }, { status: 404 });
    }
    
    const updatedJournals = journals.filter(journal => journal.id !== id);
    
    await saveJournals(updatedJournals);
    console.log('DELETE /api/journals: Journal deleted successfully', { id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting journal:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    return NextResponse.json({ 
      error: 'Failed to delete journal', 
      details: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}

// PATCH /api/journals - Đặt journal hiện tại
export async function PATCH(request: NextRequest) {
  try {
    console.log('PATCH /api/journals: Processing request');
    
    // Đảm bảo di chuyển dữ liệu được thực hiện
    await ensureMigration();
    
    const body = await request.json();
    console.log('PATCH /api/journals: Request body parsed', { bodyKeys: Object.keys(body) });
    
    if (!body.journalId) {
      return NextResponse.json({ 
        error: 'Journal ID is required',
        receivedData: body
      }, { status: 400 });
    }
    
    const { journalId } = body;
    
    const journals = await getJournals();
    if (!journals.some(j => j.id === journalId)) {
      return NextResponse.json({ error: `Journal with ID ${journalId} not found` }, { status: 404 });
    }
    
    await setCurrentJournalId(journalId);
    console.log('PATCH /api/journals: Current journal set successfully', { journalId });
    return NextResponse.json({ success: true, currentJournalId: journalId });
  } catch (error) {
    console.error('Error setting current journal:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    return NextResponse.json({ 
      error: 'Failed to set current journal', 
      details: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}