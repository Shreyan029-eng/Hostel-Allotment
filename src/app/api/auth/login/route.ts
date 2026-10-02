import { NextRequest, NextResponse } from 'next/server';
import { HostelRepository } from '@/lib/db/repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = body.email_or_roll || body.email || body.roll_no;

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please enter your NITH College Email or Roll Number' },
        { status: 400 }
      );
    }

    const student = await HostelRepository.getStudentByCollegeId(identifier);

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error: `No registered 2023 student record found for "${identifier}". Must be in format roll_number@nith.ac.in (e.g. 23bcs129@nith.ac.in) or roll number (e.g. 23bcs129).`,
        },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${student.name}!`,
      student,
    });

    // Set HTTP-only cookie for session persistence
    response.cookies.set('student_roll', student.roll_no, {
      path: '/',
      httpOnly: false, // Accessible to client-side authentication checks
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
