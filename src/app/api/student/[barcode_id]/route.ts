import { NextRequest, NextResponse } from 'next/server';
import { gateDb } from '@/lib/db/gate-db';

export const runtime = 'nodejs';

/**
 * Gate Security Scanner API Endpoint (Admin Only)
 * GET /api/student/[barcode_id]?direction=ENTRY|EXIT
 *
 * Exclusively available to authenticated admins/wardens and authorized terminal clients.
 * Reads student credentials from the dedicated Gate Entry Database and logs events.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barcode_id: string }> }
) {
  try {
    const { barcode_id } = await params;
    const { searchParams } = new URL(request.url);
    const direction = (searchParams.get('direction')?.toUpperCase() === 'EXIT' ? 'EXIT' : 'ENTRY') as 'ENTRY' | 'EXIT';

    // Strict Admin Authorization Check
    const adminSession = request.cookies.get('admin_session')?.value;
    const authHeader = request.headers.get('authorization');

    if (!adminSession && authHeader !== 'Bearer gate-terminal-token') {
      return NextResponse.json(
        {
          error: 'Forbidden: The Gate Entry system is restricted to authenticated Administrators and Wardens only.',
          code: 'ADMIN_ACCESS_REQUIRED',
        },
        { status: 403, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (!barcode_id) {
      return NextResponse.json(
        { error: 'Missing barcode_id parameter' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Process scan via dedicated Gate Database Store
    const scanResult = gateDb.scan(barcode_id, direction, adminSession);

    if (!scanResult.success || !scanResult.studentRecord) {
      return NextResponse.json(
        {
          status: 'NOT_FOUND',
          barcode_id,
          message: scanResult.error || 'Student not found in registry',
          timestamp: new Date().toISOString(),
        },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const { studentRecord, is_late, curfew_time, warden_alert } = scanResult;

    const responsePayload = {
      status: is_late ? 'LATE_ENTRY_ALERT' : 'AUTHORIZED',
      barcode_id,
      timestamp: new Date().toISOString(),
      direction,
      student: {
        roll_no: studentRecord.roll_no,
        name: studentRecord.name,
        gender: studentRecord.gender,
        year: studentRecord.year,
        phone: studentRecord.phone,
        guardian_contact: studentRecord.guardian_contact,
      },
      current_allotment: studentRecord.hostel_name
        ? {
            hostel_name: studentRecord.hostel_name,
            room_number: studentRecord.room_number,
            warden_name: studentRecord.warden_name,
            warden_phone: studentRecord.warden_phone,
            curfew_time,
          }
        : null,
      flags: {
        is_late,
        curfew_time,
        warden_alerted: Boolean(warden_alert),
        alert_details: warden_alert || null,
      },
    };

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Gate-Status': is_late ? 'CURFEW_VIOLATION' : 'CLEAR',
        'X-Gate-Database': 'NITH_GATE_ENTRY_DB',
      },
    });
  } catch (error) {
    console.error('Error processing gate scan:', error);
    return NextResponse.json(
      { error: 'Internal gate scanner service error' },
      { status: 500 }
    );
  }
}
