import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import supabase from '@/lib/supabase';

// Types
interface UserData {
  email: string;
  password: string; // Mật khẩu đã mã hóa
  is_admin: boolean;
  is_approved: boolean;
  created_at: number;
  last_login: number;
}

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  isApproved: boolean;
  createdAt: number;
  lastLogin: number;
}

// Lấy danh sách người dùng từ Supabase
async function getUsers(): Promise<Record<string, UserData>> {
  try {
    console.log('getUsers: Getting users data from Supabase');
    
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('getUsers: Error fetching users data:', error);
      return {};
    }
    
    // Chuyển đổi từ mảng thành object với key là id
    const usersObject: Record<string, UserData> = {};
    data.forEach(user => {
      usersObject[user.id] = {
        email: user.email,
        password: user.password,
        is_admin: user.is_admin,
        is_approved: user.is_approved,
        created_at: user.created_at,
        last_login: user.last_login
      };
    });
    
    console.log(`getUsers: Found ${Object.keys(usersObject).length} users`);
    
    // Kiểm tra nếu không có người dùng nào, tạo admin mặc định
    if (Object.keys(usersObject).length === 0) {
      console.log('getUsers: No users found, creating default admin user');
      
      const adminUser = {
        id: 'admin-uid',
        email: 'mrtinanpha@gmail.com',
        password: encryptPassword('Tin@123'),
        is_admin: true,
        is_approved: true,
        created_at: Date.now(),
        last_login: Date.now()
      };
      
      const { error } = await supabase
        .from('users')
        .insert(adminUser);
      
      if (error) {
        console.error('getUsers: Error creating admin user:', error);
        return {};
      }
      
      usersObject['admin-uid'] = {
        email: adminUser.email,
        password: adminUser.password,
        is_admin: adminUser.is_admin,
        is_approved: adminUser.is_approved,
        created_at: adminUser.created_at,
        last_login: adminUser.last_login
      };
    }
    
    return usersObject;
  } catch (error) {
    console.error('getUsers: Error getting users data:', error);
    return {};
  }
}

// Lưu hoặc cập nhật người dùng trong Supabase
async function saveUser(userId: string, userData: UserData): Promise<boolean> {
  try {
    console.log(`saveUser: Saving user data for ${userId}`);
    
    const { error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: userData.email,
        password: userData.password,
        is_admin: userData.is_admin,
        is_approved: userData.is_approved,
        created_at: userData.created_at,
        last_login: userData.last_login
      });
    
    if (error) {
      console.error('saveUser: Error saving user data:', error);
      return false;
    }
    
    console.log(`saveUser: User data saved successfully for ${userId}`);
    return true;
  } catch (error) {
    console.error('saveUser: Error saving user data:', error);
    return false;
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
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !userData) {
        console.log(`GET /api/user: User with ID ${userId} not found`);
        return NextResponse.json({ user: null });
      }
      
      console.log(`GET /api/user: Found user data for ${userData.email}`);
      
      const user: User = {
        id: userId,
        email: userData.email,
        isAdmin: userData.is_admin,
        isApproved: userData.is_approved,
        createdAt: userData.created_at,
        lastLogin: userData.last_login
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
      
      // Kiểm tra quyền admin
      const { data: adminData, error: adminError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single();
      
      if (adminError || !adminData || !adminData.is_admin) {
        console.log(`GET /api/user: User ${userId} is not an admin`);
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
      
      // Lấy danh sách người dùng
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');
      
      if (usersError) {
        console.error('GET /api/user: Error fetching users list:', usersError);
        return NextResponse.json({ error: 'Failed to fetch users list' }, { status: 500 });
      }
      
      const usersList = usersData.map(user => ({
        id: user.id,
        email: user.email,
        isAdmin: user.is_admin,
        isApproved: user.is_approved,
        createdAt: user.created_at,
        lastLogin: user.last_login
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
      
      // Kiểm tra email đã tồn tại chưa
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();
      
      if (existingUser) {
        console.log(`POST /api/user: Email ${email} already in use`);
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
      
      const userId = generateUserId();
      console.log(`POST /api/user: Creating new user with ID ${userId}`);
      
      // Tạo người dùng mới
      const { error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          password: encryptPassword(password),
          is_admin: false,
          is_approved: false,
          created_at: Date.now(),
          last_login: Date.now()
        });
      
      if (createError) {
        console.error('POST /api/user: Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user', details: createError.message }, { status: 500 });
      }
      
      const newUser: User = {
        id: userId,
        email,
        isAdmin: false,
        isApproved: false,
        createdAt: Date.now(),
        lastLogin: Date.now()
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
      
      console.log(`POST /api/user: Attempting to authenticate user: ${email}`);
      
      // Kiểm tra email và mật khẩu
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      // Debug thông tin người dùng và mật khẩu
      const encryptedPassword = encryptPassword(password);
      console.log(`DEBUG - Password info for ${email}:`);
      console.log(`- Provided password (encrypted): ${encryptedPassword}`);
      console.log(`- Stored password (if user exists): ${userData?.password || 'user not found'}`);
      console.log(`- Password match: ${userData?.password === encryptedPassword}`);
      
      if (userError || !userData || userData.password !== encryptedPassword) {
        // Nếu không tìm thấy người dùng trong database, thử kiểm tra admin mặc định
        if (email === 'mrtinanpha@gmail.com' && password === 'Tin@123') {
          console.log('POST /api/user: Default admin credentials provided, creating admin user');
          
          // Tạo admin mặc định nếu không tồn tại
          const adminId = 'admin-uid';
          const adminData = {
            id: adminId,
            email: 'mrtinanpha@gmail.com',
            password: encryptPassword('Tin@123'),
            is_admin: true,
            is_approved: true,
            created_at: Date.now(),
            last_login: Date.now()
          };
          
          const { error: createError } = await supabase
            .from('users')
            .upsert(adminData);
          
          if (createError) {
            console.error('POST /api/user: Error creating default admin:', createError);
            return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 });
          }
          
          // Đăng nhập bằng admin mặc định
          const user = {
            id: adminId,
            email: adminData.email,
            isAdmin: adminData.is_admin,
            isApproved: adminData.is_approved,
            createdAt: adminData.created_at,
            lastLogin: adminData.last_login
          };
          
          // Lưu user ID vào cookie
          const response = NextResponse.json({ user });
          response.cookies.set('userId', adminId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 tuần
            path: '/'
          });
          
          console.log(`POST /api/user: Default admin signed in successfully`);
          return response;
        }
        
        console.log(`POST /api/user: Invalid credentials for email ${email}`);
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
      
      console.log(`POST /api/user: User ${email} authenticated successfully`);
      
      // Cho phép admin đăng nhập bất kể trạng thái phê duyệt
      if (!userData.is_approved && !userData.is_admin) {
        console.log(`POST /api/user: User ${email} is not approved`);
        return NextResponse.json({ error: 'User is not approved' }, { status: 403 });
      }
      
      // Nếu là admin chưa được phê duyệt, tự động phê duyệt
      if (userData.is_admin && !userData.is_approved) {
        console.log(`POST /api/user: Admin ${email} auto-approved`);
        
        // Cập nhật trạng thái phê duyệt
        const { error: updateError } = await supabase
          .from('users')
          .update({ is_approved: true, last_login: Date.now() })
          .eq('id', userData.id);
        
        if (updateError) {
          console.error('POST /api/user: Error updating admin approval status:', updateError);
        }
        
        userData.is_approved = true;
      } else {
        // Cập nhật thời gian đăng nhập cuối cùng
        const { error: updateError } = await supabase
          .from('users')
          .update({ last_login: Date.now() })
          .eq('id', userData.id);
        
        if (updateError) {
          console.error('POST /api/user: Error updating last login time:', updateError);
        }
      }
      
      const user: User = {
        id: userData.id,
        email: userData.email,
        isAdmin: userData.is_admin,
        isApproved: userData.is_approved,
        createdAt: userData.created_at,
        lastLogin: userData.last_login
      };
      
      // Lưu user ID vào cookie
      const response = NextResponse.json({ user });
      response.cookies.set('userId', userData.id, {
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
      
      // Kiểm tra người dùng và mật khẩu hiện tại
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('password')
        .eq('id', userId)
        .single();
      
      if (userError || !userData) {
        console.log(`POST /api/user: User with ID ${userId} not found`);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      if (userData.password !== encryptPassword(currentPassword)) {
        console.log(`POST /api/user: Incorrect current password for user ${userId}`);
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      
      // Cập nhật mật khẩu mới
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: encryptPassword(newPassword) })
        .eq('id', userId);
      
      if (updateError) {
        console.error('POST /api/user: Error updating password:', updateError);
        return NextResponse.json({ error: 'Failed to update password', details: updateError.message }, { status: 500 });
      }
      
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
      
      // Kiểm tra email tồn tại
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      
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
      
      // Kiểm tra quyền admin
      const { data: adminData, error: adminError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', adminId)
        .single();
      
      if (adminError || !adminData || !adminData.is_admin) {
        console.log(`POST /api/user: User ${adminId} is not an admin`);
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
      
      // Kiểm tra người dùng cần cập nhật
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();
      
      if (userError || !userData) {
        console.log(`POST /api/user: User with ID ${userId} not found`);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // Không cho phép thay đổi trạng thái của admin gốc
      if (userData.email === 'mrtinanpha@gmail.com') {
        console.log(`POST /api/user: Attempted to change status of primary admin`);
        return NextResponse.json({ error: 'Cannot change status of the primary admin' }, { status: 400 });
      }
      
      // Tự động phê duyệt nếu là admin
      const updateData = isAdmin 
        ? { is_admin: isAdmin, is_approved: true }
        : { is_admin: isAdmin };
      
      // Cập nhật trạng thái admin
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);
      
      if (updateError) {
        console.error('POST /api/user: Error updating admin status:', updateError);
        return NextResponse.json({ error: 'Failed to update admin status', details: updateError.message }, { status: 500 });
      }
      
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
      
      // Kiểm tra quyền admin
      const { data: adminData, error: adminError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', adminId)
        .single();
      
      if (adminError || !adminData || !adminData.is_admin) {
        console.log(`POST /api/user: User ${adminId} is not an admin`);
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
      
      // Kiểm tra người dùng cần phê duyệt
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (userError || !userData) {
        console.log(`POST /api/user: User with ID ${userId} not found`);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // Cập nhật trạng thái phê duyệt
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_approved: isApproved })
        .eq('id', userId);
      
      if (updateError) {
        console.error('POST /api/user: Error updating approval status:', updateError);
        return NextResponse.json({ error: 'Failed to update approval status', details: updateError.message }, { status: 500 });
      }
      
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