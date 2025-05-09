import { NextRequest, NextResponse } from 'next/server';
import { 
  getJournals,  // Thêm import getJournals
  saveJournals, 
  getCurrentJournalId, 
  setCurrentJournalId,
  getCurrentUserId,
  getTradesByJournalId
} from '@/lib/server/data-store';
import { Journal } from '@/types';
import supabase from '@/lib/supabase';

// GET /api/journals - Lấy tất cả journals
export async function GET() {
  try {
    console.log('GET /api/journals: Processing request');
    
    // Lấy userId từ hàm getCurrentUserId
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    console.log(`GET /api/journals: Fetching journals for user ID: ${userId}`);
    
    // Lấy trực tiếp journals từ Supabase dựa vào user_id, đồng thời bỏ qua các journal hệ thống
    const { data: journalsData, error: journalsError } = await supabase
      .from('journals')
      .select('*')
      .eq('user_id', userId)
      .is('is_system', null);  // Lọc ra journals không phải là system journal
    
    if (journalsError) {
      console.error('Error fetching journals from Supabase:', journalsError);
      return NextResponse.json({ error: 'Failed to fetch journals' }, { status: 500 });
    }
    
    console.log(`GET /api/journals: Found ${journalsData?.length || 0} journals for user ${userId}`);
    
    // Lấy current journal ID cho user này
    const { data: prefData, error: prefError } = await supabase
      .from('user_preferences')
      .select('current_journal_id')
      .eq('user_id', userId)
      .single();
    
    let currentJournalId = null;
    
    if (!prefError && prefData && prefData.current_journal_id) {
      // Kiểm tra xem current journal ID có nằm trong journals không
      const currentJournalExists = journalsData.some(j => j.id === prefData.current_journal_id);
      if (currentJournalExists) {
        currentJournalId = prefData.current_journal_id;
        console.log(`GET /api/journals: Current journal ID from preferences: ${currentJournalId}`);
      }
    }
    
    // Nếu không có current journal ID hoặc ID không hợp lệ, dùng journal đầu tiên
    if (!currentJournalId && journalsData.length > 0) {
      currentJournalId = journalsData[0].id;
      console.log(`GET /api/journals: Using first journal as current: ${currentJournalId}`);
      
      // Cập nhật current journal ID trong preferences
      const { error: updateError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          current_journal_id: currentJournalId,
          updated_at: new Date().toISOString(),
          preferences: {} // Giữ nguyên preferences hiện tại
        });
      
      if (updateError) {
        console.error('Error updating current journal in preferences:', updateError);
      }
    }
    
    // Chuyển đổi định dạng dữ liệu để phù hợp với ứng dụng
    const journals = journalsData.map(journal => ({
      id: journal.id,
      name: journal.name,
      description: journal.description,
      createdAt: journal.created_at,
      updatedAt: journal.updated_at,
      trades: [], // Trades được lấy riêng
      // Thêm các trường khác nếu cần
      icon: journal.icon || 'chart',
      color: journal.color || '#4f46e5',
      settings: journal.settings || {
        currency: "USD",
        initialCapital: 10000,
        riskPercentage: 1
      }
    }));
    
    console.log(`GET /api/journals: Found ${journals.length} journals for user ${userId}, currentJournalId: ${currentJournalId}`);
    
    return NextResponse.json({ 
      journals: journals, 
      currentJournalId 
    });
  } catch (error) {
    console.error('Error retrieving journals:', error);
    return NextResponse.json({ error: 'Failed to fetch journals' }, { status: 500 });
  }
}

// POST /api/journals - Tạo journal mới
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/journals: Processing request');
    
    const body = await request.json();
    console.log('POST /api/journals: Request body parsed', { bodyKeys: Object.keys(body) });
    
    if (!body.journal) {
      return NextResponse.json({ error: 'Journal data is required' }, { status: 400 });
    }
    
    const newJournal: Omit<Journal, 'id' | 'createdAt' | 'updatedAt'> = body.journal;

    const timestamp = new Date().toISOString();
    const journalData = await getJournals();
    
    // Lấy userId từ hàm getCurrentUserId
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    // Tạo journal mới với đầy đủ thông tin
    const completeJournal: Journal = {
      ...newJournal,
      id: crypto.randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
      trades: [] // Không lưu trades vào journals nữa
    };
    
    // Thêm journal trực tiếp vào Supabase
    const { error: insertError } = await supabase
      .from('journals')
      .insert({
        id: completeJournal.id,
        name: completeJournal.name,
        description: completeJournal.description,
        user_id: userId,
        created_at: completeJournal.createdAt,
        updated_at: completeJournal.updatedAt
        // Không lưu trades vào journals nữa
      });
      
    if (insertError) {
      console.error('Error inserting journal to Supabase:', insertError);
      throw insertError;
    }
    
    // Đảm bảo có mảng journals cho userId trong bộ nhớ local
    if (!journalData.journals[userId]) {
      journalData.journals[userId] = [];
    }
    
    // Thêm journal mới vào mảng journals của userId
    journalData.journals[userId].push(completeJournal);
    
    // Đặt journal mới làm current journal
    journalData.currentJournals[userId] = completeJournal.id;
    
    // Cập nhật current journal trong user_preferences
    const { error: updateError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        current_journal_id: completeJournal.id,
        updated_at: timestamp,
        preferences: {}
      });
      
    if (updateError) {
      console.error('Error updating user preferences:', updateError);
      // Không throw error vì đây không phải lỗi nghiêm trọng
    }
    
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
    
    const body = await request.json();
    console.log('PUT /api/journals: Request body parsed', { bodyKeys: Object.keys(body) });
    
    if (!body.id || !body.journal) {
      return NextResponse.json({ 
        error: 'Journal ID and journal data are required',
        receivedKeys: Object.keys(body) 
      }, { status: 400 });
    }
    
    const { id, journal } = body;
    console.log(`PUT /api/journals: Updating journal with ID ${id}`);
    
    // Lấy userId từ hàm getCurrentUserId
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    const journalData = await getJournals();
    
    // Kiểm tra xem có journals cho user này không
    if (!journalData.journals[userId]) {
      console.log(`PUT /api/journals: No journals found for user ${userId}, creating empty array`);
      journalData.journals[userId] = [];
    }
    
    // Log danh sách journal hiện có
    const userJournals = journalData.journals[userId] || [];
    console.log(`PUT /api/journals: Found ${userJournals.length} journals for user ${userId}`);
    console.log('PUT /api/journals: Available journal IDs:', userJournals.map(j => j.id));
    
    // Tìm journal cần cập nhật
    const journalIndex = userJournals.findIndex(j => j.id === id);
    console.log(`PUT /api/journals: Journal index in array: ${journalIndex}`);
    
    if (journalIndex === -1) {
      console.log(`PUT /api/journals: Journal with ID ${id} not found`);
      return NextResponse.json({ 
        error: `Journal with ID ${id} not found`,
        availableIds: userJournals.map(j => j.id)
      }, { status: 404 });
    }
    
    // Bảo toàn các trường quan trọng từ journal gốc
    const originalJournal = userJournals[journalIndex];
    
    // Lấy danh sách trades từ bảng trades
    const trades = await getTradesByJournalId(id);
    
    // Cập nhật journal
    const updatedJournal = {
      ...journal,
      id, // Giữ nguyên ID
      createdAt: originalJournal.createdAt, // Giữ nguyên ngày tạo
      updatedAt: new Date().toISOString(), // Cập nhật ngày sửa
      trades // Lấy trades từ bảng trades
    };
    
    journalData.journals[userId][journalIndex] = updatedJournal;
    
    // Lưu lại dữ liệu
    await saveJournals(journalData);
    
    console.log('PUT /api/journals: Journal updated successfully', { id });
    return NextResponse.json({ journal: updatedJournal });
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
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Journal ID is required' }, { status: 400 });
    }
    
    console.log('DELETE /api/journals: Deleting journal', { id });
    
    // Lấy userId từ hàm getCurrentUserId
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    const journalData = await getJournals();
    
    // Kiểm tra xem có journals cho user này không
    if (!journalData.journals[userId]) {
      return NextResponse.json({ error: `No journals found for user` }, { status: 404 });
    }
    
    // Kiểm tra journal tồn tại không
    const journalExists = journalData.journals[userId].some(j => j.id === id);
    if (!journalExists) {
      return NextResponse.json({ error: `Journal with ID ${id} not found` }, { status: 404 });
    }
    
    // THAY ĐỔI THỨ TỰ: Xóa các giao dịch liên quan đến journal trước
    console.log(`DELETE /api/journals: Deleting trades for journal ${id} first`);
    const { error: deleteTradesError } = await supabase
      .from('trades')
      .delete()
      .eq('journal_id', id);
      
    if (deleteTradesError) {
      console.error('Error deleting trades for journal from Supabase:', deleteTradesError);
      throw deleteTradesError; // Throw error nếu không xóa được trades
    }
    
    // Sau đó mới xóa journal
    console.log(`DELETE /api/journals: Now deleting journal ${id}`);
    const { error: deleteError } = await supabase
      .from('journals')
      .delete()
      .eq('id', id);
      
    if (deleteError) {
      console.error('Error deleting journal from Supabase:', deleteError);
      throw deleteError;
    }
    
    // Cập nhật lại dữ liệu local
    journalData.journals[userId] = journalData.journals[userId].filter(j => j.id !== id);
    
    // Nếu journal đang xóa là current journal, cập nhật current journal
    if (journalData.currentJournals[userId] === id) {
      // Nếu còn journal khác, lấy journal đầu tiên làm current
      if (journalData.journals[userId].length > 0) {
        journalData.currentJournals[userId] = journalData.journals[userId][0].id;
        
        // Cập nhật current journal trong user_preferences
        const { error: updateError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: userId,
            current_journal_id: journalData.currentJournals[userId],
            updated_at: new Date().toISOString(),
            preferences: {}
          });
          
        if (updateError) {
          console.error('Error updating current journal in preferences:', updateError);
        }
      } else {
        // Nếu không còn journal nào, xóa current journal
        delete journalData.currentJournals[userId];
      }
    }
    
    console.log('DELETE /api/journals: Journal deleted successfully', { id });
    return NextResponse.json({ 
      success: true,
      currentJournalId: journalData.currentJournals[userId] || null
    });
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
    
    const body = await request.json();
    console.log('PATCH /api/journals: Request body parsed', { bodyKeys: Object.keys(body) });
    
    if (!body.journalId) {
      return NextResponse.json({ 
        error: 'Journal ID is required',
        receivedData: body
      }, { status: 400 });
    }
    
    const { journalId } = body;
    
    // Lấy userId từ hàm getCurrentUserId
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    console.log(`PATCH /api/journals: Using userId: ${userId}`);
    
    // Kiểm tra xem journal có tồn tại không và có thuộc về user hiện tại không
    const { data: journalData, error: journalError } = await supabase
      .from('journals')
      .select('id')
      .eq('id', journalId)
      .eq('user_id', userId)
      .single();
    
    if (journalError || !journalData) {
      console.log(`PATCH /api/journals: Journal with ID ${journalId} not found for user ${userId}`);
      return NextResponse.json({ error: `Journal with ID ${journalId} not found or does not belong to you` }, { status: 404 });
    }
    
    // Cập nhật current journal ID trong user_preferences
    const { error: updateError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        current_journal_id: journalId,
        updated_at: new Date().toISOString(),
        preferences: {} // Giữ nguyên preferences hiện tại
      });
    
    if (updateError) {
      console.error('Error updating current journal in preferences:', updateError);
      return NextResponse.json({ 
        error: 'Failed to set current journal', 
        details: updateError.message
      }, { status: 500 });
    }
    
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