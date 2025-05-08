import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Journal, Trade } from '@/types';
import { cookies } from 'next/headers';

// Đường dẫn lưu trữ dữ liệu
const DATA_DIR = path.join(process.cwd(), 'data');
const JOURNALS_FILE = path.join(DATA_DIR, 'journals.json');
const TRADES_FILE = path.join(DATA_DIR, 'trades.json');
const USER_PREFERENCES_FILE = path.join(DATA_DIR, 'user-preferences.json');

// Interface cho cấu trúc dữ liệu journals mới, phân tách theo userId
interface JournalData {
  journals: { [userId: string]: Journal[] };
  currentJournals: { [userId: string]: string };
}

// Đảm bảo thư mục tồn tại
async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

// Lưu dữ liệu vào file
async function saveData<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDir();
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Đọc dữ liệu từ file
async function loadData<T>(filePath: string, defaultData: T): Promise<T> {
  try {
    await ensureDataDir();
    if (existsSync(filePath)) {
      const data = await readFile(filePath, 'utf8');
      return JSON.parse(data) as T;
    }
  } catch (error) {
    console.error(`Error loading data from ${filePath}:`, error);
  }
  return defaultData;
}

// Lấy ID người dùng hiện tại - đã sửa để sử dụng async/await
async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = cookies();
  const userIdCookie = cookieStore.get('userId');
  return userIdCookie ? userIdCookie.value : null;
}

// Journals API với cách tiếp cận mới
export async function getJournalData(): Promise<JournalData> {
  return loadData<JournalData>(JOURNALS_FILE, { journals: {}, currentJournals: {} });
}

// Lấy journals của người dùng hiện tại
export async function getJournals(): Promise<Journal[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  
  const data = await getJournalData();
  return data.journals[userId] || [];
}

// Lấy journals của người dùng cụ thể (cho admin)
export async function getUserJournals(userId: string): Promise<Journal[]> {
  const data = await getJournalData();
  return data.journals[userId] || [];
}

// Lưu journals cho người dùng hiện tại
export async function saveJournals(journals: Journal[]): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('No user is logged in');
  
  const data = await getJournalData();
  data.journals[userId] = journals;
  return saveData(JOURNALS_FILE, data);
}

// Lấy journal theo ID cho người dùng hiện tại
export async function getJournalById(id: string): Promise<Journal | undefined> {
  const journals = await getJournals();
  return journals.find(journal => journal.id === id);
}

// Lấy ID journal hiện tại của người dùng đăng nhập
export async function getCurrentJournalId(): Promise<string | undefined> {
  const userId = await getCurrentUserId();
  if (!userId) return undefined;
  
  const data = await getJournalData();
  return data.currentJournals[userId];
}

// Đặt ID journal hiện tại cho người dùng đăng nhập
export async function setCurrentJournalId(journalId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('No user is logged in');
  
  const data = await getJournalData();
  data.currentJournals[userId] = journalId;
  await saveData(JOURNALS_FILE, data);
}

// Trades API
export async function getTrades(): Promise<Trade[]> {
  return loadData<Trade[]>(TRADES_FILE, []);
}

export async function saveTrades(trades: Trade[]): Promise<void> {
  return saveData(TRADES_FILE, trades);
}

// User preferences
interface UserPreferences {
  [userId: string]: {
    theme?: string;
    language?: string;
    [key: string]: any;
  };
}

export async function getUserPreferences(): Promise<UserPreferences[string]> {
  const userId = await getCurrentUserId();
  if (!userId) return {};
  
  const prefs = await loadData<UserPreferences>(USER_PREFERENCES_FILE, {});
  return prefs[userId] || {};
}

export async function saveUserPreferences(preferences: UserPreferences[string]): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('No user is logged in');
  
  const prefs = await loadData<UserPreferences>(USER_PREFERENCES_FILE, {});
  prefs[userId] = preferences;
  await saveData(USER_PREFERENCES_FILE, prefs);
}

// Hàm di chuyển dữ liệu từ cấu trúc cũ sang cấu trúc mới
export async function migrateJournalData(): Promise<void> {
  try {
    console.log('Migrating journal data to new structure...');
    
    // Kiểm tra xem file journals có tồn tại
    if (!existsSync(JOURNALS_FILE)) {
      console.log('No journals file found, no migration needed');
      return;
    }
    
    // Đọc dữ liệu cũ
    const oldData = await readFile(JOURNALS_FILE, 'utf8');
    let oldJournals: Journal[] = [];
    
    try {
      oldJournals = JSON.parse(oldData) as Journal[];
    } catch (error) {
      console.error('Error parsing old journals data:', error);
      return;
    }
    
    if (!Array.isArray(oldJournals)) {
      console.log('Journals data is not an array or already migrated', typeof oldJournals);
      return;
    }
    
    // Kiểm tra xem đã được di chuyển chưa
    if (oldJournals.length === 0) {
      console.log('No journals to migrate');
      return;
    }
    
    // Tạo cấu trúc dữ liệu mới
    const newData: JournalData = { journals: {}, currentJournals: {} };
    
    // Lấy tất cả user IDs từ file users.json
    const usersFile = path.join(DATA_DIR, 'users.json');
    let userIds: string[] = [];
    
    if (existsSync(usersFile)) {
      try {
        const usersData = await readFile(usersFile, 'utf8');
        const users = JSON.parse(usersData);
        userIds = Object.keys(users);
      } catch (error) {
        console.error('Error reading users file:', error);
      }
    }
    
    // Nếu không có user nào, giữ nguyên dữ liệu
    if (userIds.length === 0) {
      console.log('No users found, keeping old structure');
      return;
    }
    
    // Gán tất cả journals hiện tại cho admin đầu tiên
    const adminId = userIds[0];
    console.log(`Assigning all journals to first user: ${adminId}`);
    
    newData.journals[adminId] = oldJournals;
    
    // Lấy ID journal hiện tại từ user-preferences.json
    if (existsSync(USER_PREFERENCES_FILE)) {
      try {
        const prefsData = await readFile(USER_PREFERENCES_FILE, 'utf8');
        const prefs = JSON.parse(prefsData);
        
        if (prefs.currentJournalId) {
          newData.currentJournals[adminId] = prefs.currentJournalId;
        } else if (oldJournals.length > 0) {
          newData.currentJournals[adminId] = oldJournals[0].id;
        }
      } catch (error) {
        console.error('Error reading user preferences:', error);
      }
    }
    
    // Lưu cấu trúc dữ liệu mới
    await saveData(JOURNALS_FILE, newData);
    console.log('Journal data migration completed successfully');
    
    // Backup dữ liệu cũ
    const backupFile = path.join(DATA_DIR, 'journals.backup.json');
    await writeFile(backupFile, oldData, 'utf8');
    console.log(`Old data backed up to ${backupFile}`);
  } catch (error) {
    console.error('Error migrating journal data:', error);
  }
}