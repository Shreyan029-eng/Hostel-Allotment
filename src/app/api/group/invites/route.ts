import { NextRequest, NextResponse } from 'next/server';
import { HostelRepository } from '@/lib/db/repository';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let rollNo = searchParams.get('roll_no');

    if (!rollNo) {
      const sessionCookie = request.cookies.get('student_session')?.value;
      if (sessionCookie) rollNo = sessionCookie;
    }

    if (!rollNo) {
      return NextResponse.json({ error: 'roll_no parameter is required' }, { status: 400 });
    }

    const invites = await HostelRepository.getStudentInvites(rollNo);
    return NextResponse.json({ success: true, invites });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch invites';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
