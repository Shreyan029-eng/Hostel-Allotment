import { NextRequest, NextResponse } from 'next/server';
import { HostelRepository } from '@/lib/db/repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, fromRollNo, toRollNo } = body;

    if (!groupId || !fromRollNo || !toRollNo) {
      return NextResponse.json(
        { error: 'groupId, fromRollNo, and toRollNo are required' },
        { status: 400 }
      );
    }

    const res = await HostelRepository.sendInvite(groupId, fromRollNo, toRollNo);
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, invite: res.invite });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send invite';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
