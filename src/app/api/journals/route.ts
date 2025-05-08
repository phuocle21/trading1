import { NextRequest, NextResponse } from 'next/server';
import { getJournals, saveJournals, getCurrentJournalId, setCurrentJournalId } from '@/lib/server/data-store';
import { Journal } from '@/types';

// GET /api/journals - Lấy tất cả journals
export async function GET() {
  try {
    const journals = await getJournals();
    const currentJournalId = await getCurrentJournalId();
    return NextResponse.json({ journals, currentJournalId });
  } catch (error) {
    console.error('Error retrieving journals:', error);
    return NextResponse.json({ error: 'Failed to fetch journals' }, { status: 500 });
  }
}

// POST /api/journals - Tạo journal mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
    
    return NextResponse.json({ journal: completeJournal });
  } catch (error) {
    console.error('Error creating journal:', error);
    return NextResponse.json({ error: 'Failed to create journal' }, { status: 500 });
  }
}

// PUT /api/journals - Cập nhật journal
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, journal } = body;
    const journals = await getJournals();
    
    const updatedJournals = journals.map(j => 
      j.id === id ? { ...journal, updatedAt: new Date().toISOString() } : j
    );
    
    await saveJournals(updatedJournals);
    return NextResponse.json({ journal: updatedJournals.find(j => j.id === id) });
  } catch (error) {
    console.error('Error updating journal:', error);
    return NextResponse.json({ error: 'Failed to update journal' }, { status: 500 });
  }
}

// DELETE /api/journals - Xóa journal
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Journal ID is required' }, { status: 400 });
    }
    
    const journals = await getJournals();
    const updatedJournals = journals.filter(journal => journal.id !== id);
    
    await saveJournals(updatedJournals);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting journal:', error);
    return NextResponse.json({ error: 'Failed to delete journal' }, { status: 500 });
  }
}

// PATCH /api/journals - Đặt journal hiện tại
export async function PATCH(request: NextRequest) {
  try {
    const { journalId } = await request.json();
    
    if (!journalId) {
      return NextResponse.json({ error: 'Journal ID is required' }, { status: 400 });
    }
    
    await setCurrentJournalId(journalId);
    return NextResponse.json({ success: true, currentJournalId: journalId });
  } catch (error) {
    console.error('Error setting current journal:', error);
    return NextResponse.json({ error: 'Failed to set current journal' }, { status: 500 });
  }
}