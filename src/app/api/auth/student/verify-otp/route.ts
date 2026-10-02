import { NextRequest, NextResponse } from 'next/server';
import { HostelRepository } from '@/lib/db/repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, otp } = body;

    if (!identifier || !otp) {
      return NextResponse.json({ error: 'Both identifier and 6-digit OTP are required' }, { status: 400 });
    }

    const res = await HostelRepository.verifyStudentOtp(identifier, otp);

    if (!res.success || !res.student) {
      return NextResponse.json({ error: res.error || 'Invalid or expired OTP' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Student authentication successful',
      student: res.student,
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };

    response.cookies.set('student_session', res.student.roll_no, cookieOptions);
    response.cookies.set('student_roll', res.student.roll_no, cookieOptions);

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
