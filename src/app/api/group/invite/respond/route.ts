import { NextRequest, NextResponse } from 'next/server';
import { HostelRepository } from '@/lib/db/repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inviteId, studentRoll, action } = body;

    if (!inviteId || !studentRoll || !action) {
      return NextResponse.json(
        { error: 'inviteId, studentRoll, and action ("accept" | "decline") are required' },
        { status: 400 }
      );
    }

    if (action !== 'accept' && action !== 'decline') {
      return NextResponse.json({ error: 'Action must be "accept" or "decline"' }, { status: 400 });
    }

    const res = await HostelRepository.respondInvite(inviteId, studentRoll, action);
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Invite successfully ${action}ed` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to respond to invite';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
