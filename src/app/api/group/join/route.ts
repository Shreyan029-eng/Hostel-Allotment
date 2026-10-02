import { NextRequest, NextResponse } from 'next/server';
import { HostelRepository } from '@/lib/db/repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { group_code, roll_no } = body;

    if (!group_code || !roll_no) {
      return NextResponse.json(
        { success: false, error: 'group_code and roll_no are required' },
        { status: 400 }
      );
    }

    const result = await HostelRepository.joinGroupByCode(group_code.trim(), roll_no.trim());

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined group! Group priority max_cgpa updated.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to join group';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
