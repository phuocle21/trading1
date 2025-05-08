import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Journal, Trade } from '@/types';

// Đường dẫn lưu trữ dữ liệu
const DATA_DIR = path.join(process.cwd(), 'data');
const JOURNALS_FILE = path.join(DATA_DIR, 'journals.json');
const TRADES_FILE = path.join(DATA_DIR, 'trades.json');
const USER_PREFERENCES_FILE = path.join(DATA_DIR, 'user-preferences.json');

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

// Journals API
export async function getJournals(): Promise<Journal[]> {
  return loadData<Journal[]>(JOURNALS_FILE, []);
}

export async function saveJournals(journals: Journal[]): Promise<void> {
  return saveData(JOURNALS_FILE, journals);
}

export async function getJournalById(id: string): Promise<Journal | undefined> {
  const journals = await getJournals();
  return journals.find(journal => journal.id === id);
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
  currentJournalId?: string;
  [key: string]: any;
}

export async function getUserPreferences(): Promise<UserPreferences> {
  return loadData<UserPreferences>(USER_PREFERENCES_FILE, {});
}

export async function saveUserPreferences(preferences: UserPreferences): Promise<void> {
  return saveData(USER_PREFERENCES_FILE, preferences);
}

export async function getCurrentJournalId(): Promise<string | undefined> {
  const prefs = await getUserPreferences();
  return prefs.currentJournalId;
}

export async function setCurrentJournalId(journalId: string): Promise<void> {
  const prefs = await getUserPreferences();
  prefs.currentJournalId = journalId;
  await saveUserPreferences(prefs);
}