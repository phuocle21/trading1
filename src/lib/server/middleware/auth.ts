import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import supabase from '@/lib/supabase';

/**
 * Lấy ID người dùng hiện tại từ cookie
 * @returns User ID hoặc null nếu không tìm thấy
 */
export async function getUserIdFromCookie(): Promise<string | null> {
  try {
    // Đọc cookie người dùng theo cách an toàn
    // cookies() phải được sử dụng với await trong Route Handlers
    const cookieStore = cookies();
    let userId = null;
    
    // Đọc trực tiếp cookie userId thay vì sử dụng getAll()
    const userIdCookie = cookieStore.get('userId');
    
    if (!userIdCookie) {
      console.log('getUserIdFromCookie: No userId cookie found');
      return null;
    }
    
    userId = userIdCookie.value;
    console.log(`getUserIdFromCookie: userId cookie found: ${userId}`);
    
    // Kiểm tra xem user có tồn tại trong bảng users không
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      console.error(`getUserIdFromCookie: User with ID ${userId} not found in database`);
      return null;
    }
    
    console.log(`getUserIdFromCookie: Valid user ID: ${userId}`);
    return userId;
  } catch (error) {
    console.error('getUserIdFromCookie: Error getting user ID from cookie:', error);
    return null;
  }
}

/**
 * Lấy ID người dùng hiện tại từ session Supabase Auth
 * @returns User ID hoặc null nếu không tìm thấy
 */
export async function getUserIdFromAuth(): Promise<string | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('getUserIdFromAuth: Error getting session:', error);
      return null;
    }
    
    if (!session?.user?.id) {
      console.warn('getUserIdFromAuth: No user session found');
      return null;
    }
    
    console.log(`getUserIdFromAuth: Valid user ID: ${session.user.id}`);
    return session.user.id;
  } catch (error) {
    console.error('getUserIdFromAuth: Error getting user ID from auth:', error);
    return null;
  }
}

/**
 * Lấy ID người dùng hiện tại, ưu tiên từ cookie trước, sau đó từ Supabase Auth
 * @returns User ID hoặc null nếu không tìm thấy
 */
export async function getCurrentUserId(): Promise<string | null> {
  // Thử lấy từ cookie trước
  const userIdFromCookie = await getUserIdFromCookie();
  if (userIdFromCookie) {
    return userIdFromCookie;
  }
  
  // Nếu không có trong cookie, thử lấy từ Supabase Auth
  const userIdFromAuth = await getUserIdFromAuth();
  if (userIdFromAuth) {
    return userIdFromAuth;
  }
  
  console.warn('getCurrentUserId: No user ID found from any source');
  return null;
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
