import { NextRequest, NextResponse } from 'next/server';
import { HostelRepository } from '@/lib/db/repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rollNo } = body;

    if (!rollNo) {
      return NextResponse.json({ error: 'rollNo is required' }, { status: 400 });
    }

    const res = await HostelRepository.leaveOrDisbandGroup(rollNo);
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Successfully updated group status' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to leave group';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
