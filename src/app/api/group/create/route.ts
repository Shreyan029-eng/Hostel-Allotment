import { NextRequest, NextResponse } from 'next/server';
import { HostelRepository } from '@/lib/db/repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leader_roll_no, required_capacity, sharing_type } = body;

    if (!leader_roll_no) {
      return NextResponse.json(
        { success: false, error: 'leader_roll_no is required' },
        { status: 400 }
      );
    }

    const sharing: 'Triplets' | 'Fourlets' =
      sharing_type === 'Triplets' || required_capacity === 3 ? 'Triplets' : 'Fourlets';

    const result = await HostelRepository.createLobby(leader_roll_no, sharing);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Room lobby created successfully! You can now invite roommates to your ${sharing} room.`,
      group: result.group,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create room lobby';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
