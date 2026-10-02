import { NextRequest, NextResponse } from 'next/server';
import { gateDb } from '@/lib/db/gate-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Please enter your Admin/Warden official email' },
        { status: 400 }
      );
    }

    const admin = gateDb.authenticate(email, password || '');

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin credentials or unauthorized account' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: `Welcome, ${admin.name} (${admin.designation})`,
      admin,
    });

    // Set admin session cookie
    response.cookies.set('admin_session', admin.admin_id, {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: 'lax',
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Admin authentication failure';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
