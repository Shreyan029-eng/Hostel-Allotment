import { NextRequest, NextResponse } from 'next/server';
import { HostelRepository } from '@/lib/db/repository';

export async function GET(request: NextRequest) {
  try {
    const studentRoll =
      request.cookies.get('student_session')?.value ||
      request.cookies.get('student_roll')?.value;

    if (!studentRoll) {
      return NextResponse.json({ authenticated: false, student: null });
    }

    const student = await HostelRepository.getStudentByRoll(studentRoll);

    if (!student) {
      return NextResponse.json({ authenticated: false, student: null });
    }

    return NextResponse.json({ authenticated: true, student });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Auth verification error';
    return NextResponse.json({ authenticated: false, error: message }, { status: 500 });
  }
}
