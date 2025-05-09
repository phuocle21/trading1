import { NextRequest, NextResponse } from "next/server";
import { getPlaybooks, savePlaybooks, getCurrentUserId } from "@/lib/server/data-store";
import { v4 as uuidv4 } from 'uuid';

// Get all playbooks for the current user
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/playbooks: Processing request');
    
    // Sử dụng param từ URL hoặc cookie nếu không có
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || await getCurrentUserId();

    if (!userId) {
      console.log('GET /api/playbooks: No userId provided');
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`GET /api/playbooks: Getting playbooks for userId: ${userId}`);
    const playbooksData = await getPlaybooks();
    const userPlaybooks = playbooksData[userId] || [];

    console.log(`GET /api/playbooks: Found ${userPlaybooks.length} playbooks`);
    return NextResponse.json({ playbooks: userPlaybooks });
  } catch (error) {
    console.error('Error fetching playbooks:', error);
    return NextResponse.json(
      { error: "Failed to fetch playbooks" },
      { status: 500 }
    );
  }
}

// Create a new playbook
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/playbooks: Processing request');
    
    const body = await request.json();
    const { playbook } = body;
    
    // Ưu tiên userId từ body, nếu không có thì lấy từ cookie
    const userId = body.userId || await getCurrentUserId();

    if (!userId) {
      console.log('POST /api/playbooks: No userId available');
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!playbook || !playbook.name) {
      console.log('POST /api/playbooks: Missing playbook data', { body });
      return NextResponse.json(
        { error: "Playbook data is required" },
        { status: 400 }
      );
    }

    // Generate a UUID for the new playbook
    const newPlaybook = {
      id: uuidv4(),
      name: playbook.name,
      description: playbook.description || '',
      rules: playbook.rules || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log(`POST /api/playbooks: Creating new playbook for user ${userId}`, { playbook: newPlaybook });
    
    // Lấy tất cả playbooks hiện có
    const playbooksData = await getPlaybooks();
    
    // Thêm playbook mới vào danh sách của user
    if (!playbooksData[userId]) {
      playbooksData[userId] = [];
    }
    
    playbooksData[userId].push(newPlaybook);
    
    // Lưu lại danh sách đã cập nhật
    const success = await savePlaybooks(playbooksData);
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to save playbook" },
        { status: 500 }
      );
    }

    console.log(`POST /api/playbooks: Playbook created successfully`, { id: newPlaybook.id });
    return NextResponse.json({ playbook: newPlaybook });
  } catch (error) {
    console.error('Error creating playbook:', error);
    return NextResponse.json(
      { error: "Failed to create playbook" },
      { status: 500 }
    );
  }
}

// Update a playbook
export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/playbooks: Processing request');
    
    const body = await request.json();
    // Ưu tiên userId từ body, nếu không có thì lấy từ cookie
    const userId = body.userId || await getCurrentUserId();
    const { playbook } = body;

    if (!userId) {
      console.log('PUT /api/playbooks: No userId available');
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!playbook || !playbook.id) {
      console.log('PUT /api/playbooks: Missing playbook data', { body });
      return NextResponse.json(
        { error: "Playbook ID is required" },
        { status: 400 }
      );
    }
    
    console.log(`PUT /api/playbooks: Updating playbook for user ${userId}`, { playbookId: playbook.id });
    
    // Lấy tất cả playbooks hiện có
    const playbooksData = await getPlaybooks();
    
    // Kiểm tra xem user có tồn tại không
    if (!playbooksData[userId]) {
      console.log(`PUT /api/playbooks: No playbooks found for user ${userId}`);
      return NextResponse.json(
        { error: "User has no playbooks" },
        { status: 404 }
      );
    }
    
    // Tìm và cập nhật playbook
    const playbookIndex = playbooksData[userId].findIndex(p => p.id === playbook.id);
    
    if (playbookIndex === -1) {
      console.log(`PUT /api/playbooks: Playbook ${playbook.id} not found for user ${userId}`);
      return NextResponse.json(
        { error: "Playbook not found" },
        { status: 404 }
      );
    }
    
    // Update updatedAt timestamp và merge thông tin mới
    const updatedPlaybook = {
      ...playbooksData[userId][playbookIndex],
      ...playbook,
      updatedAt: new Date().toISOString()
    };
    
    playbooksData[userId][playbookIndex] = updatedPlaybook;
    
    // Lưu lại danh sách đã cập nhật
    const success = await savePlaybooks(playbooksData);
    
    if (!success) {
      console.log(`PUT /api/playbooks: Failed to save updated playbook`);
      return NextResponse.json(
        { error: "Failed to update playbook" },
        { status: 500 }
      );
    }

    console.log(`PUT /api/playbooks: Playbook updated successfully`, { id: playbook.id });
    return NextResponse.json({ playbook: updatedPlaybook });
  } catch (error) {
    console.error('Error updating playbook:', error);
    return NextResponse.json(
      { error: "Failed to update playbook" },
      { status: 500 }
    );
  }
}

// Delete a playbook
export async function DELETE(request: NextRequest) {
  try {
    console.log('DELETE /api/playbooks: Processing request');
    
    const searchParams = request.nextUrl.searchParams;
    // Ưu tiên userId từ URL, nếu không có thì lấy từ cookie
    const userId = searchParams.get('userId') || await getCurrentUserId();
    const playbookId = searchParams.get('playbookId');

    if (!userId) {
      console.log('DELETE /api/playbooks: No userId available');
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!playbookId) {
      console.log('DELETE /api/playbooks: No playbookId provided');
      return NextResponse.json(
        { error: "Playbook ID is required" },
        { status: 400 }
      );
    }
    
    console.log(`DELETE /api/playbooks: Deleting playbook ${playbookId} for user ${userId}`);
    
    // Lấy tất cả playbooks hiện có
    const playbooksData = await getPlaybooks();
    
    // Kiểm tra xem user có tồn tại không
    if (!playbooksData[userId]) {
      console.log(`DELETE /api/playbooks: No playbooks found for user ${userId}`);
      return NextResponse.json(
        { error: "User has no playbooks" },
        { status: 404 }
      );
    }
    
    // Kiểm tra xem playbook có tồn tại không
    const initialCount = playbooksData[userId].length;
    playbooksData[userId] = playbooksData[userId].filter(p => p.id !== playbookId);
    
    if (playbooksData[userId].length === initialCount) {
      console.log(`DELETE /api/playbooks: Playbook ${playbookId} not found for user ${userId}`);
      return NextResponse.json(
        { error: "Playbook not found" },
        { status: 404 }
      );
    }
    
    // Lưu lại danh sách đã cập nhật
    const success = await savePlaybooks(playbooksData);
    
    if (!success) {
      console.log(`DELETE /api/playbooks: Failed to save changes after deletion`);
      return NextResponse.json(
        { error: "Failed to delete playbook" },
        { status: 500 }
      );
    }

    console.log(`DELETE /api/playbooks: Playbook deleted successfully`, { id: playbookId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting playbook:', error);
    return NextResponse.json(
      { error: "Failed to delete playbook" },
      { status: 500 }
    );
  }
}