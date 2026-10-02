import { NextRequest, NextResponse } from 'next/server';
import { HostelRepository } from '@/lib/db/repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier } = body;

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json({ error: 'College email or roll number is required' }, { status: 400 });
    }

    const clean = identifier.trim().toLowerCase();
    const res = await HostelRepository.generateStudentOtp(clean);

    if (!res.success || !res.student) {
      return NextResponse.json({ error: res.error || 'Student not found in NITH records' }, { status: 404 });
    }

    // Return the response with simulated dispatch details and the 6-digit OTP for immediate use
    return NextResponse.json({
      success: true,
      message: `A 6-digit verification OTP has been dispatched to ${res.student.email}`,
      roll_no: res.student.roll_no,
      email: res.student.email,
      name: res.student.name,
      otp: res.otp, // For display in local testing banner/toast
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send OTP';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
