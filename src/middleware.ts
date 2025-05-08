import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware này sẽ chạy trên các API routes để ghi logs
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Chỉ áp dụng cho các route API
  if (pathname.startsWith('/api/')) {
    console.log(`[API Request] ${request.method} ${pathname}`);
    
    // Log một số thông tin về headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log(`[API Headers] Content-Type: ${headers['content-type'] || 'not set'}`);
    
    // Log body nếu có
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      console.log(`[API Body] Method: ${request.method}, has body: ${request.body !== undefined}`);
    }
  }
  
  return NextResponse.next();
}

// Chỉ chạy middleware cho các API routes
export const config = {
  matcher: '/api/:path*',
};