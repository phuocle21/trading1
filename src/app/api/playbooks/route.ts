import { NextRequest, NextResponse } from "next/server";
import { getDataStore } from "@/lib/server/data-store";
import { v4 as uuidv4 } from 'uuid';

// Get all playbooks for the current user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const dataStore = getDataStore();
    const playbooks = await dataStore.getPlaybooks(userId);

    return NextResponse.json({ playbooks });
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
    const body = await request.json();
    const { userId, playbook } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!playbook || !playbook.name) {
      return NextResponse.json(
        { error: "Playbook data is required" },
        { status: 400 }
      );
    }

    // Generate a UUID for the new playbook
    const newPlaybook = {
      id: uuidv4(),
      ...playbook,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      winRate: playbook.winRate || 0,
      avgProfit: playbook.avgProfit || 0,
      totalTrades: playbook.totalTrades || 0,
    };

    const dataStore = getDataStore();
    const result = await dataStore.addPlaybook(userId, newPlaybook);

    return NextResponse.json({ playbook: result });
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
    const body = await request.json();
    const { userId, playbook } = body;

    if (!userId || !playbook || !playbook.id) {
      return NextResponse.json(
        { error: "User ID and playbook ID are required" },
        { status: 400 }
      );
    }

    const dataStore = getDataStore();
    
    // Update updatedAt timestamp
    const updatedPlaybook = {
      ...playbook,
      updatedAt: new Date().toISOString()
    };
    
    const result = await dataStore.updatePlaybook(userId, updatedPlaybook);

    if (!result) {
      return NextResponse.json(
        { error: "Playbook not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ playbook: result });
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
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const playbookId = searchParams.get('playbookId');

    if (!userId || !playbookId) {
      return NextResponse.json(
        { error: "User ID and playbook ID are required" },
        { status: 400 }
      );
    }

    const dataStore = getDataStore();
    const result = await dataStore.deletePlaybook(userId, playbookId);

    if (!result) {
      return NextResponse.json(
        { error: "Playbook not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting playbook:', error);
    return NextResponse.json(
      { error: "Failed to delete playbook" },
      { status: 500 }
    );
  }
}