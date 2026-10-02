import { NextRequest, NextResponse } from 'next/server';
import { JosaaAllotmentEngine } from '@/lib/engine/allotment-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const roundNumber = body.round_number || 1;
    const academicYear = body.academic_year || '2026-2027';

    const result = await JosaaAllotmentEngine.runBatchAllotment(roundNumber, academicYear);

    return NextResponse.json({
      success: true,
      message: `Batch JOSAA Allotment for Round ${roundNumber} completed successfully.`,
      result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown allotment engine error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
