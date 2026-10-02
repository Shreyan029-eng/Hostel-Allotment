import { NextRequest, NextResponse } from 'next/server';
import { HostelRepository } from '@/lib/db/repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { group_id, leader_roll_no, room_ids } = body;

    if (!group_id || !leader_roll_no || !Array.isArray(room_ids)) {
      return NextResponse.json(
        { success: false, error: 'group_id, leader_roll_no, and room_ids array are required' },
        { status: 400 }
      );
    }

    const result = await HostelRepository.submitAndLockPreferences(group_id, leader_roll_no, room_ids);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences submitted and locked successfully on behalf of the group!',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to submit preferences';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
