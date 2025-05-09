import { cookies } from 'next/headers';
import { Journal, Trade } from '@/types';
import supabase from '@/lib/supabase';

// Interface cho cấu trúc dữ liệu journals
interface JournalData {
  journals: { [userId: string]: Journal[] };
  currentJournals: { [userId: string]: string };
}

// Interface cho cấu trúc dữ liệu playbooks
interface PlaybooksData {
  [userId: string]: any[]; // Array of playbooks for each user
}

// Đường dẫn đến file dữ liệu
const JOURNALS_FILE_PATH = process.env.NODE_ENV === 'development' 
  ? './data/journals.json' 
  : '/tmp/journals.json';

const PLAYBOOKS_FILE_PATH = process.env.NODE_ENV === 'development'
  ? './data/playbooks.json'
  : '/tmp/playbooks.json';

const USERS_FILE_PATH = process.env.NODE_ENV === 'development'
  ? './data/users.json'
  : '/tmp/users.json';

const PREFERENCES_FILE_PATH = process.env.NODE_ENV === 'development'
  ? './data/user-preferences.json'
  : '/tmp/user-preferences.json';

// Hàm lấy thông tin người dùng hiện tại dựa trên cookie
export async function getCurrentUserId(): Promise<string | null> {
  try {
    // Để tránh lỗi liên quan đến cookies() trong Server Components,
    // chúng ta sẽ luôn trả về một giá trị mặc định cho userId
    // Vì ứng dụng của bạn hiện tại chỉ có một tài khoản admin
    return 'admin-uid';
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}

// Hàm để đọc dữ liệu journals từ file hoặc database
export async function getJournals(): Promise<JournalData> {
  try {
    // Ưu tiên lấy dữ liệu từ Supabase
    const { data: journalsData, error: journalsError } = await supabase
      .from('journals')
      .select('*');
    
    if (journalsError) {
      console.error('Error fetching journals from Supabase:', journalsError);
      // Fallback: Đọc từ file local
      const fs = require('fs');
      if (fs.existsSync(JOURNALS_FILE_PATH)) {
        const data = fs.readFileSync(JOURNALS_FILE_PATH, 'utf8');
        return JSON.parse(data);
      }
      return { journals: {}, currentJournals: {} };
    }
    
    // Chuyển đổi dữ liệu từ Supabase về định dạng cần thiết
    const result: JournalData = { journals: {}, currentJournals: {} };
    
    journalsData.forEach(dbJournal => {
      const userId = dbJournal.user_id;
      if (!result.journals[userId]) {
        result.journals[userId] = [];
      }
      
      const journal: Journal = {
        id: dbJournal.id,
        name: dbJournal.name,
        description: dbJournal.description,
        createdAt: dbJournal.created_at,
        updatedAt: dbJournal.updated_at,
        trades: dbJournal.trades || []
      };
      
      result.journals[userId].push(journal);
      
      // Nếu là journal mới nhất, đặt làm current
      if (!result.currentJournals[userId] || new Date(journal.updatedAt) > new Date(result.journals[userId].find(j => j.id === result.currentJournals[userId])?.updatedAt || 0)) {
        result.currentJournals[userId] = journal.id;
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error getting journals:', error);
    return { journals: {}, currentJournals: {} };
  }
}

// Lưu journals vào file hoặc database
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
            trades: journal.trades
          });
        
        if (error) {
          console.error('Error saving journal to Supabase:', error);
          throw error;
        }
      }
    }
    
    // Backup vào file local trong môi trường development
    if (process.env.NODE_ENV === 'development') {
      const fs = require('fs');
      fs.writeFileSync(JOURNALS_FILE_PATH, JSON.stringify(data, null, 2));
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
    // Lấy userId bằng cách await function đã sửa
    const userId = await getCurrentUserId();
    if (!userId) {
      return 'default-journal-id'; // Trả về ID mặc định nếu không có userId
    }
    
    // Lấy dữ liệu journal từ Supabase
    const journalData = await getJournals();
    
    // Kiểm tra xem có journal cho user không
    if (!journalData.currentJournals[userId]) {
      // Nếu không có, kiểm tra xem có journals nào không
      if (journalData.journals[userId] && journalData.journals[userId].length > 0) {
        // Lấy journal đầu tiên nếu có
        return journalData.journals[userId][0].id;
      }
      return 'default-journal-id';
    }
    
    return journalData.currentJournals[userId];
  } catch (error) {
    console.error('Error getting current journal ID:', error);
    return 'default-journal-id';
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

// Hàm để đọc dữ liệu playbooks từ file hoặc database
export async function getPlaybooks(): Promise<PlaybooksData> {
  try {
    // Ưu tiên lấy dữ liệu từ Supabase
    const { data: playbooksData, error: playbooksError } = await supabase
      .from('playbooks')
      .select('*');
    
    if (playbooksError) {
      console.error('Error fetching playbooks from Supabase:', playbooksError);
      // Fallback: Đọc từ file local
      const fs = require('fs');
      if (fs.existsSync(PLAYBOOKS_FILE_PATH)) {
        const data = fs.readFileSync(PLAYBOOKS_FILE_PATH, 'utf8');
        return JSON.parse(data);
      }
      return {};
    }
    
    // Chuyển đổi dữ liệu từ Supabase về định dạng cần thiết
    const result: PlaybooksData = {};
    
    playbooksData.forEach(playbook => {
      const userId = playbook.user_id;
      if (!result[userId]) {
        result[userId] = [];
      }
      
      result[userId].push({
        id: playbook.id,
        name: playbook.name,
        description: playbook.description,
        rules: playbook.rules,
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

// Lưu playbooks vào file hoặc database
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
            rules: playbook.rules,
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
    
    // Backup vào file local trong môi trường development
    if (process.env.NODE_ENV === 'development') {
      const fs = require('fs');
      fs.writeFileSync(PLAYBOOKS_FILE_PATH, JSON.stringify(data, null, 2));
    }
    
    return true;
  } catch (error) {
    console.error('Error saving playbooks:', error);
    return false;
  }
}

// Hàm di chuyển dữ liệu từ định dạng cũ sang mới (nếu cần)
export async function migrateJournalData(): Promise<void> {
  try {
    console.log('Starting journal data migration...');
    
    // Kiểm tra xem đã có bảng journals trong Supabase chưa
    const { data, error } = await supabase
      .from('journals')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error checking journals table in Supabase:', error);
      return;
    }
    
    // Nếu đã có dữ liệu, không cần di chuyển
    if (data && data.length > 0) {
      console.log('Journals already exist in Supabase, no migration needed');
      return;
    }
    
    // Kiểm tra dữ liệu cũ trong file JSON
    if (process.env.NODE_ENV === 'development') {
      try {
        const fs = require('fs');
        if (fs.existsSync(JOURNALS_FILE_PATH)) {
          console.log('Found local journals data, migrating to Supabase...');
          
          const fileData = fs.readFileSync(JOURNALS_FILE_PATH, 'utf8');
          const oldData = JSON.parse(fileData);
          
          // Di chuyển dữ liệu lên Supabase
          for (const userId in oldData.journals) {
            for (const journal of oldData.journals[userId]) {
              await supabase
                .from('journals')
                .upsert({
                  id: journal.id,
                  name: journal.name,
                  description: journal.description,
                  user_id: userId,
                  created_at: journal.createdAt,
                  updated_at: journal.updatedAt,
                  trades: journal.trades || []
                });
            }
          }
          
          console.log('Journal data migration completed successfully');
        } else {
          console.log('No local journals data found, skipping migration');
        }
      } catch (e) {
        console.error('Error during journal data migration:', e);
      }
    }
  } catch (error) {
    console.error('Unexpected error during journal data migration:', error);
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
      
      // Fallback: Đọc từ file local
      if (process.env.NODE_ENV === 'development') {
        const fs = require('fs');
        if (fs.existsSync(PREFERENCES_FILE_PATH)) {
          const fileData = fs.readFileSync(PREFERENCES_FILE_PATH, 'utf8');
          const allPreferences = JSON.parse(fileData);
          return allPreferences[userId] || {};
        }
      }
      
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
      
      // Fallback: Lưu vào file local
      if (process.env.NODE_ENV === 'development') {
        const fs = require('fs');
        let allPreferences = {};
        
        if (fs.existsSync(PREFERENCES_FILE_PATH)) {
          const data = fs.readFileSync(PREFERENCES_FILE_PATH, 'utf8');
          allPreferences = JSON.parse(data);
        }
        
        allPreferences[userId] = preferences;
        fs.writeFileSync(PREFERENCES_FILE_PATH, JSON.stringify(allPreferences, null, 2));
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return false;
  }
}
