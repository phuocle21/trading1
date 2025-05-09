import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

// Đường dẫn lưu trữ dữ liệu người dùng
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Đảm bảo thư mục tồn tại
async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

// Types
interface UserData {
  email: string;
  password: string; // Mật khẩu đã mã hóa
  isAdmin: boolean;
  isApproved: boolean;
  createdAt: number;
  lastLogin: number;
}

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  isApproved: boolean;
  createdAt: number;
  lastLogin: number;
}

// Lưu dữ liệu người dùng
async function saveUsers(users: Record<string, UserData>) {
  try {
    console.log('saveUsers: Saving users data');
    await ensureDataDir();
    await writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    console.log('saveUsers: Users data saved successfully');
  } catch (error) {
    console.error('saveUsers: Error saving users data:', error);
    throw error;
  }
}

// Lấy danh sách người dùng
async function getUsers(): Promise<Record<string, UserData>> {
  try {
    console.log('getUsers: Getting users data');
    await ensureDataDir();
    if (!existsSync(USERS_FILE)) {
      console.log('getUsers: Users file does not exist, creating default admin user');
      // Tạo người dùng admin mặc định nếu file chưa tồn tại
      const adminUser = {
        "admin-uid": {
          email: "mrtinanpha@gmail.com",
          password: encryptPassword("Tin@123"),
          isAdmin: true,
          isApproved: true,
          createdAt: Date.now(),
          lastLogin: Date.now()
        }
      };
      await saveUsers(adminUser);
      return adminUser;
    }

    console.log('getUsers: Reading users file');
    const data = await readFile(USERS_FILE, 'utf8');
    console.log('getUsers: Users file read successfully');
    try {
      const parsedData = JSON.parse(data);
      console.log(`getUsers: Found ${Object.keys(parsedData).length} users`);
      return parsedData;
    } catch (parseError) {
      console.error('getUsers: Error parsing users data:', parseError);
      console.log('getUsers: Raw data content:', data);
      // Return empty object if parsing fails
      return {};
    }
  } catch (error) {
    console.error('getUsers: Error getting users data:', error);
    return {};
  }
}

// Mã hóa đơn giản cho mật khẩu
function encryptPassword(password: string): string {
  // Trong ứng dụng thực tế, bạn nên sử dụng bcrypt hoặc thư viện mã hóa tốt hơn
  return Buffer.from(password).toString('base64');
}

// Tạo ID người dùng
function generateUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Xử lý request
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/user: Processing request');
    // Kiểm tra path parameter từ query string để quyết định xử lý
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    console.log(`GET /api/user: Path=${path}`);

    // Lấy thông tin người dùng hiện tại
    if (path === 'current') {
      console.log('GET /api/user: Getting current user');
      const cookieStore = await cookies();
      const userIdCookie = cookieStore.get('userId');
      
      if (!userIdCookie) {
        console.log('GET /api/user: No userId cookie found');
        return NextResponse.json({ user: null });
      }
      
      const userId = userIdCookie.value;
      console.log(`GET /api/user: userId cookie found: ${userId}`);
      const users = await getUsers();
      
      if (!users[userId]) {
        console.log(`GET /api/user: User with ID ${userId} not found`);
        return NextResponse.json({ user: null });
      }
      
      const userData = users[userId];
      console.log(`GET /api/user: Found user data for ${userData.email}`);
      
      const user: User = {
        id: userId,
        email: userData.email,
        isAdmin: userData.isAdmin,
        isApproved: userData.isApproved,
        createdAt: userData.createdAt,
        lastLogin: userData.lastLogin
      };
      
      return NextResponse.json({ user });
    }
    
    // Lấy danh sách người dùng (chỉ admin)
    if (path === 'list') {
      console.log('GET /api/user: Getting users list');
      const cookieStore = await cookies();
      const userIdCookie = cookieStore.get('userId');
      
      if (!userIdCookie) {
        console.log('GET /api/user: No userId cookie found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const userId = userIdCookie.value;
      console.log(`GET /api/user: userId cookie found: ${userId}`);
      const users = await getUsers();
      
      if (!users[userId] || !users[userId].isAdmin) {
        console.log(`GET /api/user: User ${userId} is not an admin`);
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
      
      const usersList = Object.entries(users).map(([id, userData]) => ({
        id,
        email: userData.email,
        isAdmin: userData.isAdmin,
        isApproved: userData.isApproved,
        createdAt: userData.createdAt,
        lastLogin: userData.lastLogin
      }));
      
      console.log(`GET /api/user: Returning ${usersList.length} users`);
      return NextResponse.json({ users: usersList });
    }
    
    console.log(`GET /api/user: Unknown path: ${path}`);
    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  } catch (error) {
    console.error('GET /api/user: Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    return NextResponse.json({ 
      error: 'Failed to process user request',
      details: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}

// Đăng ký, đăng nhập, và các thao tác khác
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/user: Processing request');
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    console.log(`POST /api/user: Path=${path}`);
    
    // Đăng ký người dùng mới
    if (path === 'signup') {
      console.log('POST /api/user: Processing signup request');
      let requestBody;
      try {
        requestBody = await request.json();
        console.log('POST /api/user: Request body parsed', { bodyKeys: Object.keys(requestBody) });
      } catch (e) {
        console.error('POST /api/user: Error parsing request body:', e);
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
      }
      
      const { email, password } = requestBody;
      
      if (!email || !password) {
        console.log('POST /api/user: Missing email or password');
        return NextResponse.json({ 
          error: 'Email and password are required',
          receivedData: { 
            email: email ? 'provided' : 'missing', 
            password: password ? 'provided' : 'missing' 
          }
        }, { status: 400 });
      }
      
      const users = await getUsers();
      const userExists = Object.values(users).some(user => user.email === email);
      
      if (userExists) {
        console.log(`POST /api/user: Email ${email} already in use`);
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
      
      const userId = generateUserId();
      console.log(`POST /api/user: Creating new user with ID ${userId}`);
      
      const newUserData: UserData = {
        email,
        password: encryptPassword(password),
        isAdmin: false,
        isApproved: false,
        createdAt: Date.now(),
        lastLogin: Date.now()
      };
      
      users[userId] = newUserData;
      await saveUsers(users);
      
      const newUser: User = {
        id: userId,
        email: newUserData.email,
        isAdmin: newUserData.isAdmin,
        isApproved: newUserData.isApproved,
        createdAt: newUserData.createdAt,
        lastLogin: newUserData.lastLogin
      };
      
      console.log('POST /api/user: User created successfully');
      
      // Lưu user ID vào cookie
      const response = NextResponse.json({ user: newUser });
      response.cookies.set('userId', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 tuần
        path: '/'
      });
      
      return response;
    }
    
    // Đăng nhập
    if (path === 'signin') {
      console.log('POST /api/user: Processing signin request');
      let requestBody;
      try {
        requestBody = await request.json();
        console.log('POST /api/user: Request body parsed', { bodyKeys: Object.keys(requestBody) });
      } catch (e) {
        console.error('POST /api/user: Error parsing request body:', e);
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
      }
      
      const { email, password } = requestBody;
      
      if (!email || !password) {
        console.log('POST /api/user: Missing email or password');
        return NextResponse.json({ 
          error: 'Email and password are required',
          receivedData: { 
            email: email ? 'provided' : 'missing', 
            password: password ? 'provided' : 'missing' 
          }
        }, { status: 400 });
      }
      
      const users = await getUsers();
      const userEntry = Object.entries(users).find(([_, user]) => user.email === email);
      
      if (!userEntry || userEntry[1].password !== encryptPassword(password)) {
        console.log(`POST /api/user: Invalid credentials for email ${email}`);
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
      
      const [userId, userData] = userEntry;
      console.log(`POST /api/user: User ${email} authenticated successfully`);
      
      // Cho phép admin đăng nhập bất kể trạng thái phê duyệt
      if (!userData.isApproved && !userData.isAdmin) {
        console.log(`POST /api/user: User ${email} is not approved`);
        return NextResponse.json({ error: 'User is not approved' }, { status: 403 });
      }
      
      // Nếu là admin chưa được phê duyệt, tự động phê duyệt
      if (userData.isAdmin && !userData.isApproved) {
        console.log(`POST /api/user: Admin ${email} auto-approved`);
        userData.isApproved = true;
      }
      
      // Cập nhật thời gian đăng nhập cuối cùng
      userData.lastLogin = Date.now();
      users[userId] = userData;
      await saveUsers(users);
      
      const user: User = {
        id: userId,
        email: userData.email,
        isAdmin: userData.isAdmin,
        isApproved: userData.isApproved,
        createdAt: userData.createdAt,
        lastLogin: userData.lastLogin
      };
      
      // Lưu user ID vào cookie
      const response = NextResponse.json({ user });
      response.cookies.set('userId', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 tuần
        path: '/'
      });
      
      console.log(`POST /api/user: User ${email} signed in successfully`);
      return response;
    }
    
    // Đăng xuất
    if (path === 'signout') {
      console.log('POST /api/user: Processing signout request');
      const response = NextResponse.json({ success: true });
      response.cookies.delete('userId');
      console.log('POST /api/user: User signed out successfully');
      return response;
    }
    
    // Đổi mật khẩu
    if (path === 'change-password') {
      console.log('POST /api/user: Processing change password request');
      const cookieStore = await cookies();
      const userIdCookie = cookieStore.get('userId');
      
      if (!userIdCookie) {
        console.log('POST /api/user: No userId cookie found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const userId = userIdCookie.value;
      console.log(`POST /api/user: userId cookie found: ${userId}`);
      
      let requestBody;
      try {
        requestBody = await request.json();
        console.log('POST /api/user: Request body parsed', { bodyKeys: Object.keys(requestBody) });
      } catch (e) {
        console.error('POST /api/user: Error parsing request body:', e);
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
      }
      
      const { currentPassword, newPassword } = requestBody;
      
      if (!currentPassword || !newPassword) {
        console.log('POST /api/user: Missing currentPassword or newPassword');
        return NextResponse.json({ 
          error: 'Current password and new password are required',
          receivedData: { 
            currentPassword: currentPassword ? 'provided' : 'missing', 
            newPassword: newPassword ? 'provided' : 'missing' 
          }
        }, { status: 400 });
      }
      
      const users = await getUsers();
      
      if (!users[userId]) {
        console.log(`POST /api/user: User with ID ${userId} not found`);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      if (users[userId].password !== encryptPassword(currentPassword)) {
        console.log(`POST /api/user: Incorrect current password for user ${userId}`);
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      
      users[userId].password = encryptPassword(newPassword);
      await saveUsers(users);
      
      console.log(`POST /api/user: Password changed successfully for user ${userId}`);
      return NextResponse.json({ success: true });
    }
    
    // Đặt lại mật khẩu
    if (path === 'reset-password') {
      console.log('POST /api/user: Processing reset password request');
      let requestBody;
      try {
        requestBody = await request.json();
        console.log('POST /api/user: Request body parsed', { bodyKeys: Object.keys(requestBody) });
      } catch (e) {
        console.error('POST /api/user: Error parsing request body:', e);
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
      }
      
      const { email } = requestBody;
      
      if (!email) {
        console.log('POST /api/user: Missing email');
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }
      
      const users = await getUsers();
      const userFound = Object.values(users).some(user => user.email === email);
      
      // Luôn trả về thông báo thành công bất kể email có tồn tại hay không
      console.log(`POST /api/user: Password reset requested for email: ${email}`);
      return NextResponse.json({ message: 'If this email exists in our system, password reset instructions have been sent.' });
    }
    
    // Cập nhật trạng thái quản trị viên
    if (path === 'update-admin') {
      console.log('POST /api/user: Processing update admin request');
      const cookieStore = await cookies();
      const userIdCookie = cookieStore.get('userId');
      
      if (!userIdCookie) {
        console.log('POST /api/user: No userId cookie found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const adminId = userIdCookie.value;
      console.log(`POST /api/user: userId cookie found: ${adminId}`);
      
      let requestBody;
      try {
        requestBody = await request.json();
        console.log('POST /api/user: Request body parsed', { bodyKeys: Object.keys(requestBody) });
      } catch (e) {
        console.error('POST /api/user: Error parsing request body:', e);
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
      }
      
      const { userId, isAdmin } = requestBody;
      
      if (!userId) {
        console.log('POST /api/user: Missing userId');
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
      }
      
      const users = await getUsers();
      
      if (!users[adminId] || !users[adminId].isAdmin) {
        console.log(`POST /api/user: User ${adminId} is not an admin`);
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
      
      if (!users[userId]) {
        console.log(`POST /api/user: User with ID ${userId} not found`);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // Không cho phép thay đổi trạng thái của admin gốc
      if (users[userId].email === 'mrtinanpha@gmail.com') {
        console.log(`POST /api/user: Attempted to change status of primary admin`);
        return NextResponse.json({ error: 'Cannot change status of the primary admin' }, { status: 400 });
      }
      
      users[userId].isAdmin = isAdmin;
      
      // Nếu người dùng được cấp quyền admin, tự động phê duyệt họ
      if (isAdmin) {
        console.log(`POST /api/user: User ${userId} auto-approved due to admin status`);
        users[userId].isApproved = true;
      }
      
      await saveUsers(users);
      
      console.log(`POST /api/user: Admin status updated for user ${userId}: isAdmin=${isAdmin}`);
      return NextResponse.json({ success: true });
    }
    
    // Phê duyệt người dùng
    if (path === 'approve') {
      console.log('POST /api/user: Processing approve user request');
      const cookieStore = await cookies();
      const userIdCookie = cookieStore.get('userId');
      
      if (!userIdCookie) {
        console.log('POST /api/user: No userId cookie found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const adminId = userIdCookie.value;
      console.log(`POST /api/user: userId cookie found: ${adminId}`);
      
      let requestBody;
      try {
        requestBody = await request.json();
        console.log('POST /api/user: Request body parsed', { bodyKeys: Object.keys(requestBody) });
      } catch (e) {
        console.error('POST /api/user: Error parsing request body:', e);
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
      }
      
      const { userId, isApproved } = requestBody;
      
      if (!userId) {
        console.log('POST /api/user: Missing userId');
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
      }
      
      const users = await getUsers();
      
      if (!users[adminId] || !users[adminId].isAdmin) {
        console.log(`POST /api/user: User ${adminId} is not an admin`);
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
      
      if (!users[userId]) {
        console.log(`POST /api/user: User with ID ${userId} not found`);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      users[userId].isApproved = isApproved;
      await saveUsers(users);
      
      console.log(`POST /api/user: Approval status updated for user ${userId}: isApproved=${isApproved}`);
      return NextResponse.json({ success: true });
    }
    
    console.log(`POST /api/user: Unknown path: ${path}`);
    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  } catch (error) {
    console.error('POST /api/user: Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    return NextResponse.json({ 
      error: 'Failed to process user request',
      details: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}