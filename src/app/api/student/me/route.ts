import { NextRequest, NextResponse } from 'next/server';
import { HostelRepository } from '@/lib/db/repository';
import { getStudentHostelPathway } from '@/lib/db/mock-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let rollNo = searchParams.get('roll_no');

    if (!rollNo) {
      const sessionCookie = request.cookies.get('student_session')?.value;
      if (sessionCookie) rollNo = sessionCookie;
    }

    if (!rollNo) {
      return NextResponse.json({ error: 'roll_no parameter or active session is required' }, { status: 400 });
    }

    const student = await HostelRepository.getStudentByRoll(rollNo);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const allHostels = await HostelRepository.getHostels();
    const pathway = getStudentHostelPathway(student, allHostels);

    // Allowed hostels for next year allotment
    const allowedHostels = pathway.nextHostels;
    const allowedHostelIds = allowedHostels.map((h) => h.hostel_id);

    // Available rooms in these hostels
    const availableRooms = await HostelRepository.getRooms(allowedHostelIds);

    // Group details if any
    const groupDetails = await HostelRepository.getGroupByRollNo(student.roll_no);

    // Incoming invites
    const incomingInvites = await HostelRepository.getStudentInvites(student.roll_no);

    // Allotment Result (only visible if published by Admin)
    const roundConfig = await HostelRepository.getRoundConfig(1);
    const allotment = await HostelRepository.getStudentAllotment(student.roll_no, false);

    return NextResponse.json({
      student: {
        ...student,
        current_hostel: student.current_hostel || pathway.currentHostel,
      },
      pathway,
      allowedHostels,
      availableRooms,
      groupDetails,
      incomingInvites,
      roundConfig,
      allotment,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching student data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
