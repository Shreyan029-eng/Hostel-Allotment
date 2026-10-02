import { NextRequest, NextResponse } from 'next/server';
import { gateDb } from '@/lib/db/gate-db';

export async function GET(request: NextRequest) {
  try {
    const adminId = request.cookies.get('admin_session')?.value;

    if (!adminId) {
      return NextResponse.json({ authenticated: false, admin: null });
    }

    const admin = gateDb.getAdminById(adminId);

    if (!admin) {
      return NextResponse.json({ authenticated: false, admin: null });
    }

    return NextResponse.json({ authenticated: true, admin });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Admin auth error';
    return NextResponse.json({ authenticated: false, error: message }, { status: 500 });
  }
}
