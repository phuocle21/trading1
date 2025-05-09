import { NextRequest, NextResponse } from "next/server";
import { getPlaybooks, savePlaybooks, getCurrentUserId } from "@/lib/server/data-store";
import { v4 as uuidv4 } from 'uuid';
import supabase from "@/lib/supabase";

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

    if (!playbook) {
      console.log('POST /api/playbooks: Missing playbook data', { body });
      return NextResponse.json(
        { error: "Playbook data is required" },
        { status: 400 }
      );
    }

    const playbooksData = await getPlaybooks();
    const newPlaybook = {
      ...playbook,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!playbooksData[userId]) {
      playbooksData[userId] = [];
    }

    playbooksData[userId].push(newPlaybook);
    await savePlaybooks(playbooksData);

    console.log(`POST /api/playbooks: Playbook created successfully`, { id: newPlaybook.id });
    return NextResponse.json({ playbook: newPlaybook });
  } catch (error) {
    console.error('Error creating playbook:', error);
    return NextResponse.json(
      { error: "Failed to create playbook", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
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
    
    // Lấy tất cả playbooks hiện có để kiểm tra playbook tồn tại
    const playbooksData = await getPlaybooks();
    
    // Kiểm tra xem user có tồn tại không
    if (!playbooksData[userId]) {
      console.log(`PUT /api/playbooks: No playbooks found for user ${userId}`);
      return NextResponse.json(
        { error: "User has no playbooks" },
        { status: 404 }
      );
    }
    
    // Tìm playbook cần cập nhật
    const existingPlaybook = playbooksData[userId].find(p => p.id === playbook.id);
    
    if (!existingPlaybook) {
      console.log(`PUT /api/playbooks: Playbook ${playbook.id} not found for user ${userId}`);
      return NextResponse.json(
        { error: "Playbook not found" },
        { status: 404 }
      );
    }
    
    // Tạo đối tượng playbook cập nhật
    const timestamp = new Date().toISOString();
    const updatedPlaybook = {
      ...existingPlaybook,
      ...playbook,
      updatedAt: timestamp
    };
    
    // Cập nhật trực tiếp vào Supabase
    const { error: updateError } = await supabase
      .from('playbooks')
      .update({
        name: updatedPlaybook.name,
        description: updatedPlaybook.description,
        content: updatedPlaybook.rules, // Chuyển đổi từ rules trong ứng dụng sang content trong DB
        updated_at: timestamp
      })
      .eq('id', playbook.id)
      .eq('user_id', userId);
    
    if (updateError) {
      console.error('Error updating playbook in Supabase:', updateError);
      throw updateError;
    }
    
    // Cập nhật cache local
    const playbookIndex = playbooksData[userId].findIndex(p => p.id === playbook.id);
    playbooksData[userId][playbookIndex] = updatedPlaybook;

    console.log(`PUT /api/playbooks: Playbook updated successfully`, { id: playbook.id });
    return NextResponse.json({ playbook: updatedPlaybook });
  } catch (error) {
    console.error('Error updating playbook:', error);
    return NextResponse.json(
      { error: "Failed to update playbook", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}