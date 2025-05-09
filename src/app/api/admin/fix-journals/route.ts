import { NextRequest, NextResponse } from 'next/server';
import { markAdminJournalsAsSystem } from '@/lib/server/data-store';

// GET /api/admin/fix-journals - Đánh dấu journals của admin là journal hệ thống
export async function GET() {
  try {
    console.log('GET /api/admin/fix-journals: Processing request');
    
    const result = await markAdminJournalsAsSystem();
    if (result) {
      return NextResponse.json({ 
        success: true, 
        message: 'Successfully marked admin journals as system journals' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to mark admin journals as system journals' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fixing journals:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'An error occurred while fixing journals',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}