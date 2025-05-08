import { NextRequest, NextResponse } from 'next/server';
import { getUserPreferences, saveUserPreferences } from '@/lib/server/data-store';

// GET /api/user - Lấy thông tin người dùng và tùy chọn
export async function GET() {
  try {
    const preferences = await getUserPreferences();
    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error retrieving user preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch user preferences' }, { status: 500 });
  }
}

// PUT /api/user - Cập nhật thông tin người dùng
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { preferences } = body;
    
    await saveUserPreferences(preferences);
    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json({ error: 'Failed to update user preferences' }, { status: 500 });
  }
}