import { NextRequest, NextResponse } from 'next/server';
import { HostelRepository } from '@/lib/db/repository';
import { mockDb } from '@/lib/db/mock-store';

export async function GET() {
  try {
    const students = await HostelRepository.getStudents();
    const hostels = await HostelRepository.getHostels();
    const rooms = await HostelRepository.getRooms();
    const allotments = await HostelRepository.getAllAllotments();
    const roundConfig = await HostelRepository.getRoundConfig(1);
    const gateLogs = await HostelRepository.getGateLogs();

    // Enriched groups
    const groups = mockDb.groups.map((g) => {
      const leader = students.find((s) => s.roll_no === g.leader_roll_no);
      const members = mockDb.groupMembers
        .filter((m) => m.group_id === g.group_id)
        .map((m) => {
          const student = students.find((s) => s.roll_no === m.roll_no);
          return { ...m, student };
        });
      const preferences = mockDb.preferences
        .filter((p) => p.group_id === g.group_id)
        .sort((a, b) => a.preference_rank - b.preference_rank)
        .map((p) => {
          const room = rooms.find((r) => r.room_id === p.room_id);
          return { ...p, room };
        });

      return {
        ...g,
        leader,
        members,
        preferences,
      };
    });

    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter((r) => r.status === 'locked').length;
    const freeRooms = totalRooms - occupiedRooms;

    return NextResponse.json({
      stats: {
        totalStudents: students.length,
        totalHostels: hostels.length,
        totalRooms,
        occupiedRooms,
        freeRooms,
        totalGroups: groups.length,
        lockedGroups: groups.filter((g) => g.is_locked).length,
        totalAllotments: allotments.length,
      },
      students,
      hostels,
      rooms,
      groups,
      allotments,
      roundConfig,
      gateLogs,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching admin data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  // Reset database state to seed
  mockDb.reset();
  return NextResponse.json({ success: true, message: 'Database reset to initial seed state.' });
}
