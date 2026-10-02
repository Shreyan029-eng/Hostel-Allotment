import { NextRequest, NextResponse } from 'next/server';
import { HostelRepository } from '@/lib/db/repository';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // 'all' | 'allotted' | 'unallotted'

    const students = await HostelRepository.getStudents();
    const allotments = await HostelRepository.getAllAllotments();

    // Map allotments by roll_no
    const allotmentMap = new Map<string, (typeof allotments)[0]>();
    allotments.forEach((a) => allotmentMap.set(a.roll_no, a));

    // Filter students
    let filteredStudents = students;
    if (filter === 'allotted') {
      filteredStudents = students.filter((s) => allotmentMap.has(s.roll_no));
    } else if (filter === 'unallotted') {
      filteredStudents = students.filter((s) => !allotmentMap.has(s.roll_no));
    }

    // Generate CSV Rows
    const headers = [
      'Roll Number',
      'Student Name',
      'Email',
      'Gender',
      'Year',
      'CGPA',
      'Phone',
      'Guardian Phone',
      'Barcode ID',
      'Allotment Status',
      'Hostel ID',
      'Hostel Name',
      'Room Number',
      'Round Number',
      'Academic Year',
      'Allotted At',
    ];

    const escapeCsv = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredStudents.map((s) => {
      const a = allotmentMap.get(s.roll_no);
      return [
        escapeCsv(s.roll_no),
        escapeCsv(s.name),
        escapeCsv(s.email),
        escapeCsv(s.gender),
        escapeCsv(s.year),
        escapeCsv(s.cgpa),
        escapeCsv(s.phone),
        escapeCsv(s.guardian_contact),
        escapeCsv(s.barcode_id),
        escapeCsv(a ? 'ALLOTTED' : 'UNALLOTTED'),
        escapeCsv(a?.room?.hostel?.hostel_id || 'N/A'),
        escapeCsv(a?.room?.hostel?.name || 'N/A'),
        escapeCsv(a?.room?.room_number || 'N/A'),
        escapeCsv(a?.round_number || 'N/A'),
        escapeCsv(a?.academic_year || 'N/A'),
        escapeCsv(a?.allotted_at || 'N/A'),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="josaa_hostel_allotments_${filter}_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 });
  }
}
