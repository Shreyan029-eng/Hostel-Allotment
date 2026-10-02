import { NextRequest, NextResponse } from 'next/server';
import { HostelRepository } from '@/lib/db/repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const roundNumber = body.round_number || 1;
    const isPublished = Boolean(body.is_published);

    const config = await HostelRepository.setRoundPublishStatus(roundNumber, isPublished);

    return NextResponse.json({
      success: true,
      message: isPublished
        ? `Round ${roundNumber} results are now PUBLISHED and visible to students!`
        : `Round ${roundNumber} results have been UNPUBLISHED and hidden from students.`,
      config,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Publish toggle error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
