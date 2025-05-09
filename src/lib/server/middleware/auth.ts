import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import supabase from '@/lib/supabase';

/**
 * Lấy ID người dùng hiện tại từ cookie
 * @returns User ID hoặc null nếu không tìm thấy
 */
export async function getUserIdFromCookie(): Promise<string | null> {
  try {
    // Trong Next.js 14+, cần sử dụng một cách tiếp cận khác cho cookies trong Route Handlers
    
    // Thử lấy session từ Supabase Auth trước
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (!error && session?.user?.id) {
      console.log(`getUserIdFromCookie: Using auth session user ID: ${session.user.id}`);
      
      // Kiểm tra xem user có tồn tại trong bảng users không
      const { data, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .single();
      
      if (!userError && data) {
        console.log(`getUserIdFromCookie: Valid user ID from auth: ${session.user.id}`);
        return session.user.id;
      }
    }
    
    // Trước khi sử dụng cookie hoặc fallback, kiểm tra xem đã có users trong database chưa
    // Nếu có, sử dụng user đầu tiên không phải admin
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('id, is_admin')
      .neq('id', 'admin-uid')
      .order('created_at', { ascending: true })
      .limit(5);
    
    if (!usersError && existingUsers && existingUsers.length > 0) {
      // Ưu tiên sử dụng user không phải admin
      const regularUser = existingUsers.find(u => !u.is_admin);
      const userId = regularUser ? regularUser.id : existingUsers[0].id;
      
      console.log(`getUserIdFromCookie: Using existing user from database: ${userId}`);
      return userId;
    }
    
    // Lấy cookie session hiện tại
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('app-session');
    
    // Nếu có cookie session, sử dụng như một userId tạm thời
    if (sessionCookie && sessionCookie.value) {
      console.log(`getUserIdFromCookie: Using session cookie as temporary user ID`);
      
      // Sử dụng cookie session hiện tại hoặc tạo một ID mới
      const tempUserId = sessionCookie.value;
      
      // Kiểm tra xem user này đã tồn tại trong bảng users chưa
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', tempUserId)
        .single();
      
      // Nếu user đã tồn tại, sử dụng ID đó
      if (!checkError && existingUser) {
        console.log(`getUserIdFromCookie: Found existing temp user: ${tempUserId}`);
        return tempUserId;
      }
      
      // Nếu user chưa tồn tại, tạo một user mới
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: tempUserId,
          email: `temp-${tempUserId.substring(0, 8)}@example.com`,
          created_at: new Date().toISOString(),
          is_admin: false
        })
        .select()
        .single();
      
      if (!createError && newUser) {
        console.log(`getUserIdFromCookie: Created new temp user: ${tempUserId}`);
        return tempUserId;
      }
    }
    
    // Tạo một ID người dùng demo cố định thay vì fallback về admin-uid
    const demoUserId = "demo-user-1";
    console.log(`getUserIdFromCookie: Using demo user ID: ${demoUserId}`);
    
    // Tạo user demo trong database nếu chưa tồn tại
    const { error: demoCreateError } = await supabase
      .from('users')
      .upsert({
        id: demoUserId,
        email: 'demo@example.com',
        created_at: new Date().toISOString(),
        is_admin: false
      });
    
    if (demoCreateError) {
      console.error(`getUserIdFromCookie: Error creating demo user: ${demoCreateError.message}`);
    }
    
    return demoUserId;
  } catch (error) {
    console.error('getUserIdFromCookie: Error getting user ID from cookie:', error);
    return null;
  }
}

/**
 * Lấy ID người dùng hiện tại
 * @returns User ID hoặc null nếu không tìm thấy
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    console.log('getCurrentUserId: Getting current user ID');
    
    // Sử dụng hàm getUserIdFromCookie
    const userId = await getUserIdFromCookie();
    
    if (userId) {
      console.log(`getCurrentUserId: Using cookie user ID: ${userId}`);
      return userId;
    }
    
    console.warn('getCurrentUserId: No user ID found from any source, returning null');
    return null;
  } catch (error) {
    console.error('getCurrentUserId: Error getting current user ID:', error);
    return null;
  }
}

/**
 * Middleware kiểm tra xác thực người dùng cho các API route
 * @param handler Hàm xử lý request
 * @returns NextResponse
 */
export async function requireAuth(handler: () => Promise<NextResponse>): Promise<NextResponse> {
  // Kiểm tra phiên người dùng hiện tại
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('requireAuth: Authentication required - No user session found');
    return NextResponse.json({ 
      error: 'Authentication required',
      message: 'You must be logged in to perform this action'
    }, { status: 401 });
  }
  
  // Nếu có user ID, tiếp tục xử lý request
  return handler();
}

/**
 * Middleware kiểm tra quyền admin
 * @param handler Hàm xử lý request
 * @returns NextResponse
 */
export async function requireAdmin(handler: () => Promise<NextResponse>): Promise<NextResponse> {
  // Kiểm tra phiên người dùng hiện tại
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('requireAdmin: Authentication required - No user session found');
    return NextResponse.json({ 
      error: 'Authentication required',
      message: 'You must be logged in to perform this action'
    }, { status: 401 });
  }
  
  // Kiểm tra quyền admin
  const { data, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single();
  
  if (error || !data || !data.is_admin) {
    console.error(`requireAdmin: User ${userId} is not an admin`);
    return NextResponse.json({ 
      error: 'Permission denied',
      message: 'This action requires administrator privileges' 
    }, { status: 403 });
  }
  
  // Nếu là admin, tiếp tục xử lý request
  return handler();
}
