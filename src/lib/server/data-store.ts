import { cookies } from 'next/headers';
import { Journal, Trade } from '@/types';
import supabase from '@/lib/supabase';
import { getUserIdFromCookie } from '@/lib/server/middleware/auth';

// Interface cho cấu trúc dữ liệu journals
interface JournalData {
  journals: { [userId: string]: Journal[] };
  currentJournals: { [userId: string]: string };
}

// Interface cho cấu trúc dữ liệu playbooks
interface PlaybooksData {
  [userId: string]: any[]; // Array of playbooks for each user
}

// Hàm lấy thông tin người dùng hiện tại - chuyển sang sử dụng hàm getUserIdFromCookie
export async function getCurrentUserId(): Promise<string | null> {
  return getUserIdFromCookie();
}

// Hàm để đọc dữ liệu journals từ database
export async function getJournals(): Promise<JournalData> {
  try {
    // Lấy userId hiện tại
    const currentUserId = await getCurrentUserId();
    console.log(`getJournals: Getting journals for user ID: ${currentUserId}`);
    
    if (!currentUserId) {
      console.log('getJournals: No user ID found, returning empty data');
      return { journals: {}, currentJournals: {} };
    }
    
    // Lấy dữ liệu từ Supabase - CHỈ lấy journals của user hiện tại
    const { data: journalsData, error: journalsError } = await supabase
      .from('journals')
      .select('*')
      .eq('user_id', currentUserId);  // Chỉ lấy journals của user hiện tại
    
    if (journalsError) {
      console.error('Error fetching journals from Supabase:', journalsError);
      return { journals: {}, currentJournals: {} };
    }
    
    console.log(`getJournals: Found ${journalsData.length} journals for user ${currentUserId}`);
    
    // Chuyển đổi dữ liệu từ Supabase về định dạng cần thiết
    const result: JournalData = { journals: {}, currentJournals: {} };
    
    // Luôn khởi tạo mảng journals cho userId hiện tại
    result.journals[currentUserId] = [];
    
    journalsData.forEach(dbJournal => {
      const journal: Journal = {
        id: dbJournal.id,
        name: dbJournal.name,
        description: dbJournal.description,
        createdAt: dbJournal.created_at,
        updatedAt: dbJournal.updated_at,
        icon: dbJournal.icon || 'chart',
        color: dbJournal.color || '#4f46e5',
        settings: dbJournal.settings || {
          currency: "USD",
          initialCapital: 10000,
          riskPercentage: 1
        },
        trades: [] // Không lưu trades trong journal nữa mà lấy từ bảng trades
      };
      
      result.journals[currentUserId].push(journal);
      
      // Nếu là journal mới nhất, đặt làm current
      if (!result.currentJournals[currentUserId] || new Date(journal.updatedAt) > new Date(result.journals[currentUserId].find(j => j.id === result.currentJournals[currentUserId])?.updatedAt || 0)) {
        result.currentJournals[currentUserId] = journal.id;
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error getting journals:', error);
    return { journals: {}, currentJournals: {} };
  }
}

// Lưu journals vào database
export async function saveJournals(data: JournalData): Promise<boolean> {
  try {
    // Lưu vào Supabase
    for (const userId in data.journals) {
      for (const journal of data.journals[userId]) {
        const { error } = await supabase
          .from('journals')
          .upsert({
            id: journal.id,
            name: journal.name,
            description: journal.description,
            user_id: userId,
            created_at: journal.createdAt,
            updated_at: journal.updatedAt,
            icon: journal.icon,
            color: journal.color,
            settings: journal.settings
            // trades field đã bị loại bỏ vì trades sẽ được lưu riêng
          });
        
        if (error) {
          console.error('Error saving journal to Supabase:', error);
          throw error;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error saving journals:', error);
    return false;
  }
}

// Hàm lấy ID của journal hiện tại
export async function getCurrentJournalId(): Promise<string | null> {
  try {
    // Lấy userId từ hàm getCurrentUserId đã được cập nhật
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('Cannot get current user ID');
      return null; // Trả về null thay vì default-journal-id
    }
    
    // Lấy dữ liệu journal từ Supabase
    const journalData = await getJournals();
    
    // Debug thông tin
    console.log('getCurrentJournalId - userId:', userId);
    console.log('getCurrentJournalId - journals for user:', journalData.journals[userId] ? journalData.journals[userId].length : 0);
    console.log('getCurrentJournalId - current journal ID:', journalData.currentJournals[userId] || 'none');
    
    // Kiểm tra xem có journal cho user không
    if (!journalData.currentJournals[userId]) {
      // Nếu không có, kiểm tra xem có journals nào không
      if (journalData.journals[userId] && journalData.journals[userId].length > 0) {
        // Lấy journal đầu tiên nếu có
        const firstJournalId = journalData.journals[userId][0].id;
        console.log('getCurrentJournalId - using first journal as default:', firstJournalId);
        return firstJournalId;
      }
      
      // Không sử dụng journal của admin nữa
      console.log('getCurrentJournalId - no journals found for user, returning null');
      return null; // Trả về null thay vì admin journal
    }
    
    return journalData.currentJournals[userId];
  } catch (error) {
    console.error('Error getting current journal ID:', error);
    return null; // Trả về null thay vì default-journal-id
  }
}

// Hàm đặt ID của journal hiện tại
export async function setCurrentJournalId(journalId: string): Promise<boolean> {
  try {
    // Lấy userId bằng cách await function
    const userId = await getCurrentUserId();
    if (!userId) return false;
    
    // Lấy dữ liệu hiện tại
    const journalData = await getJournals();
    
    // Cập nhật ID journal hiện tại cho user
    if (!journalData.currentJournals) {
      journalData.currentJournals = {};
    }
    journalData.currentJournals[userId] = journalId;
    
    // Lưu lại
    return await saveJournals(journalData);
  } catch (error) {
    console.error('Error setting current journal ID:', error);
    return false;
  }
}

// Hàm để đọc dữ liệu playbooks từ database
export async function getPlaybooks(): Promise<PlaybooksData> {
  try {
    // Lấy userId hiện tại
    const currentUserId = await getCurrentUserId();
    console.log(`getPlaybooks: Getting playbooks for user ID: ${currentUserId}`);
    
    if (!currentUserId) {
      console.log('getPlaybooks: No user ID found, returning empty data');
      return {};
    }
    
    // Lấy dữ liệu từ Supabase - CHỈ lấy playbooks của user hiện tại
    const { data: playbooksData, error: playbooksError } = await supabase
      .from('playbooks')
      .select('*')
      .eq('user_id', currentUserId);  // Chỉ lấy playbooks của user hiện tại
    
    if (playbooksError) {
      console.error('Error fetching playbooks from Supabase:', playbooksError);
      return {};
    }
    
    console.log(`getPlaybooks: Found ${playbooksData.length} playbooks for user ${currentUserId}`);
    
    // Chuyển đổi dữ liệu từ Supabase về định dạng cần thiết
    const result: PlaybooksData = {};
    
    // Luôn khởi tạo mảng playbooks cho userId hiện tại
    result[currentUserId] = [];
    
    playbooksData.forEach(playbook => {
      result[currentUserId].push({
        id: playbook.id,
        name: playbook.name,
        description: playbook.description,
        rules: playbook.content || [], // Chuyển đổi từ content trong DB sang rules trong ứng dụng
        createdAt: playbook.created_at,
        updatedAt: playbook.updated_at
      });
    });
    
    return result;
  } catch (error) {
    console.error('Error getting playbooks:', error);
    return {};
  }
}

// Lưu playbooks vào database
export async function savePlaybooks(data: PlaybooksData): Promise<boolean> {
  try {
    // Lưu vào Supabase
    for (const userId in data) {
      for (const playbook of data[userId]) {
        const { error } = await supabase
          .from('playbooks')
          .upsert({
            id: playbook.id,
            name: playbook.name,
            description: playbook.description,
            content: playbook.rules, // Chuyển đổi từ rules trong ứng dụng sang content trong DB
            user_id: userId,
            created_at: playbook.createdAt,
            updated_at: playbook.updatedAt
          });
        
        if (error) {
          console.error('Error saving playbook to Supabase:', error);
          throw error;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error saving playbooks:', error);
    return false;
  }
}

// Hàm lấy tất cả giao dịch từ database
export async function getTrades(): Promise<Trade[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];
    
    // Lấy journal hiện tại để lọc trades
    const currentJournalId = await getCurrentJournalId();
    
    console.log('GET /api/trades: Processing request');
    console.log('getCurrentJournalId - userId:', userId);
    console.log('getCurrentJournalId - current journal ID:', currentJournalId);
    
    // Truy vấn trades từ bảng trades
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .eq('journal_id', currentJournalId);
    
    if (error) {
      console.error('Error fetching trades from Supabase:', error);
      return [];
    }
    
    console.log(`GET /api/trades: Found ${data.length} trades`);
    
    // Chuyển đổi dữ liệu từ Supabase về định dạng cần thiết trong ứng dụng
    return data.map(trade => ({
      id: trade.id,
      journalId: trade.journal_id,
      symbol: trade.symbol,
      tradeType: trade.type, // Ánh xạ từ type sang tradeType
      entryDate: trade.entry_date,
      entryTime: trade.entry_time,
      entryPrice: trade.entry_price,
      exitDate: trade.exit_date,
      exitTime: trade.exit_time,
      exitPrice: trade.exit_price,
      quantity: trade.quantity,
      stopLoss: trade.stop_loss,
      takeProfit: trade.take_profit,
      fees: trade.fees,
      playbook: trade.playbook,
      risk: trade.risk,
      mood: trade.mood,
      rating: trade.rating,
      notes: trade.notes,
      screenshots: trade.screenshots || []
    }));
  } catch (error) {
    console.error('Error getting trades:', error);
    return [];
  }
}

// Hàm lấy tất cả giao dịch cho một journal cụ thể
export async function getTradesByJournalId(journalId: string): Promise<Trade[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId || !journalId) return [];
    
    // Truy vấn trades từ bảng trades
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .eq('journal_id', journalId);
    
    if (error) {
      console.error('Error fetching trades by journal ID from Supabase:', error);
      return [];
    }
    
    // Chuyển đổi dữ liệu từ Supabase về định dạng cần thiết
    return data.map(trade => ({
      id: trade.id,
      journalId: trade.journal_id,
      symbol: trade.symbol,
      tradeType: trade.type, // Ánh xạ từ type sang tradeType
      entryDate: trade.entry_date,
      entryTime: trade.entry_time,
      entryPrice: trade.entry_price,
      exitDate: trade.exit_date,
      exitTime: trade.exit_time,
      exitPrice: trade.exit_price,
      quantity: trade.quantity,
      stopLoss: trade.stop_loss,
      takeProfit: trade.take_profit,
      fees: trade.fees,
      playbook: trade.playbook,
      risk: trade.risk,
      mood: trade.mood,
      rating: trade.rating,
      notes: trade.notes,
      screenshots: trade.screenshots || []
    }));
  } catch (error) {
    console.error('Error getting trades by journal ID:', error);
    return [];
  }
}

// Hàm lấy tất cả giao dịch từ tất cả nhật ký của người dùng hiện tại
export async function getAllTrades(): Promise<Trade[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];
    
    console.log('getAllTrades: Retrieving all trades for user ID:', userId);
    
    // Truy vấn tất cả trades của người dùng từ bảng trades (không lọc theo journal_id)
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching all trades from Supabase:', error);
      return [];
    }
    
    console.log(`getAllTrades: Found ${data.length} trades for user ${userId}`);
    
    // Chuyển đổi dữ liệu từ Supabase về định dạng cần thiết trong ứng dụng
    return data.map(trade => ({
      id: trade.id,
      journalId: trade.journal_id,
      symbol: trade.symbol,
      tradeType: trade.type, // Ánh xạ từ type sang tradeType
      entryDate: trade.entry_date,
      entryTime: trade.entry_time,
      entryPrice: trade.entry_price,
      exitDate: trade.exit_date,
      exitTime: trade.exit_time,
      exitPrice: trade.exit_price,
      quantity: trade.quantity,
      stopLoss: trade.stop_loss,
      takeProfit: trade.take_profit,
      fees: trade.fees,
      playbook: trade.playbook,
      risk: trade.risk,
      mood: trade.mood,
      rating: trade.rating,
      notes: trade.notes,
      screenshots: trade.screenshots || [],
      updatedAt: trade.updated_at || trade.entry_date // Thêm trường updatedAt để theo dõi thời gian cập nhật
    }));
  } catch (error) {
    console.error('Error getting all trades:', error);
    return [];
  }
}

// Lưu một giao dịch vào database
export async function saveTrade(trade: Trade): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('Error saving trade: No user ID found');
      return false;
    }
    
    // Lấy journal hiện tại
    const journalId = await getCurrentJournalId();
    if (!journalId) {
      console.error('Error saving trade: No current journal found for user');
      return false;
    }
    
    console.log('Saving trade to Supabase:', {
      id: trade.id,
      journalId,
      userId,
      symbol: trade.symbol,
      tradeType: trade.tradeType,
    });
    
    // Đảm bảo tradeType luôn có giá trị
    if (!trade.tradeType) {
      console.error('Error saving trade: tradeType is required');
      return false;
    }
    
    // Lưu trade vào Supabase
    const { data, error } = await supabase
      .from('trades')
      .upsert({
        id: trade.id,
        journal_id: journalId,
        user_id: userId,
        symbol: trade.symbol,
        type: trade.tradeType, // Sửa từ trade.type thành trade.tradeType
        entry_date: trade.entryDate,
        entry_time: trade.entryTime,
        entry_price: trade.entryPrice,
        exit_date: trade.exitDate,
        exit_time: trade.exitTime,
        exit_price: trade.exitPrice,
        quantity: trade.quantity,
        stop_loss: trade.stopLoss,
        take_profit: trade.takeProfit,
        fees: trade.fees,
        playbook: trade.playbook,
        risk: trade.risk,
        mood: trade.mood,
        rating: trade.rating,
        notes: trade.notes,
        screenshots: trade.screenshots || []
      })
      .select();
    
    if (error) {
      console.error('Error saving trade to Supabase:', error);
      return false;
    }
    
    console.log('Trade saved successfully:', data);
    return true;
  } catch (error) {
    console.error('Error saving trade:', error);
    return false;
  }
}

// Lưu danh sách giao dịch vào database
export async function saveTrades(trades: Trade[]): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;
    
    // Lấy journal hiện tại
    const journalId = await getCurrentJournalId();
    if (!journalId) {
      console.error('No current journal found for user');
      return false;
    }
    
    // Xóa tất cả giao dịch hiện tại của journal
    const { error: deleteError } = await supabase
      .from('trades')
      .delete()
      .eq('user_id', userId)
      .eq('journal_id', journalId);
    
    if (deleteError) {
      console.error('Error deleting existing trades:', deleteError);
      return false;
    }
    
    // Nếu không có giao dịch nào để lưu, trả về true luôn
    if (trades.length === 0) return true;
    
    // Thêm giao dịch mới
    const { error: insertError } = await supabase
      .from('trades')
      .insert(
        trades.map(trade => ({
          id: trade.id,
          journal_id: journalId,
          user_id: userId,
          symbol: trade.symbol,
          type: trade.tradeType, // Sửa từ trade.type thành trade.tradeType
          entry_date: trade.entryDate,
          entry_time: trade.entryTime,
          entry_price: trade.entryPrice,
          exit_date: trade.exitDate,
          exit_time: trade.exitTime,
          exit_price: trade.exitPrice,
          quantity: trade.quantity,
          stop_loss: trade.stopLoss,
          take_profit: trade.takeProfit,
          fees: trade.fees,
          playbook: trade.playbook,
          risk: trade.risk,
          mood: trade.mood,
          rating: trade.rating,
          notes: trade.notes,
          screenshots: trade.screenshots || []
        }))
      );
    
    if (insertError) {
      console.error('Error inserting trades:', insertError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving trades:', error);
    return false;
  }
}

// Xóa một giao dịch từ database
export async function deleteTrade(tradeId: string): Promise<boolean> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;
    
    // Xóa trade từ Supabase
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', tradeId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting trade from Supabase:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting trade:', error);
    return false;
  }
}

// Hàm lấy thông tin và tùy chọn của người dùng
export async function getUserPreferences(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user preferences from Supabase:', error);
      return {};
    }
    
    return data.preferences || {};
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {};
  }
}

// Lưu tùy chọn người dùng
export async function saveUserPreferences(userId: string, preferences: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        preferences,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error saving user preferences to Supabase:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return false;
  }
}

// Hàm đánh dấu journals của admin là journal hệ thống
export async function markAdminJournalsAsSystem(userId: string = 'admin-uid'): Promise<boolean> {
  try {
    console.log(`markAdminJournalsAsSystem: Marking journals for user ${userId} as system journals`);
    
    // Đầu tiên, thêm cột is_system nếu chưa tồn tại
    const { error: alterError } = await supabase.rpc('add_column_if_not_exists', {
      table_name: 'journals',
      column_name: 'is_system',
      column_type: 'boolean'
    });
    
    if (alterError) {
      console.error('Error adding is_system column:', alterError);
      // Nếu không thể thêm cột qua RPC, có thể bỏ qua lỗi vì cột có thể đã tồn tại
    }
    
    // Sau đó, cập nhật journal của admin thành journal hệ thống
    const { error: updateError } = await supabase
      .from('journals')
      .update({ is_system: true })
      .eq('user_id', userId);
    
    if (updateError) {
      console.error('Error marking admin journals as system:', updateError);
      return false;
    }
    
    console.log(`markAdminJournalsAsSystem: Successfully marked journals for user ${userId} as system journals`);
    return true;
  } catch (error) {
    console.error('Error marking admin journals as system:', error);
    return false;
  }
}
