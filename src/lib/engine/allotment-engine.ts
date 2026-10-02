import { mockDb } from '../db/mock-store';
import { Group, Allotment, Room, Student } from '../db/types';
import { createAdminClient } from '../supabase/admin';

export interface AllotmentLogEntry {
  rank: number;
  groupId: string;
  groupCode: string;
  leaderRollNo: string;
  maxCgpa: number;
  createdAt: string;
  requiredCapacity: number;
  memberRolls: string[];
  status: 'ALLOTTED' | 'NO_CHOICE_AVAILABLE' | 'NOT_LOCKED';
  allocatedRoomId?: string;
  allocatedRoomNumber?: string;
  allocatedHostelName?: string;
  matchedChoiceRank?: number;
  tieBreakerApplied?: boolean;
  notes: string;
}

export interface AllotmentRunResult {
  success: boolean;
  roundNumber: number;
  academicYear: string;
  timestamp: string;
  totalGroupsConsidered: number;
  totalAllottedGroups: number;
  totalUnallottedGroups: number;
  totalStudentsPlaced: number;
  auditTrail: AllotmentLogEntry[];
}

export class JosaaAllotmentEngine {
  /**
   * Run the batch JOSAA allocation process.
   * Can be executed offline or via Admin API.
   */
  static async runBatchAllotment(
    roundNumber: number = 1,
    academicYear: string = '2026-2027'
  ): Promise<AllotmentRunResult> {
    const supabase = createAdminClient();

    // If connected to a real Supabase instance, call the PostgreSQL Stored Procedure for strict ACID transaction
    if (supabase && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      try {
        const { data, error } = await supabase.rpc('run_josaa_allotment_procedure', {
          p_round_number: roundNumber,
          p_academic_year: academicYear,
        });

        if (!error && data) {
          console.log('[PostgreSQL RPC] JOSAA Allotment transaction executed successfully:', data);
        }
      } catch (err) {
        console.warn('[PostgreSQL RPC] Falling back to engine simulation:', err);
      }
    }

    // Engine allocation logic (Simulated ACID Transaction with strict row locking)
    console.log(`\n======================================================`);
    console.log(`[JOSAA ENGINE] Starting Round ${roundNumber} Batch Allotment (${academicYear})`);
    console.log(`======================================================\n`);

    // 1. Fetch only locked groups
    const candidateGroups = mockDb.groups.filter((g) => g.is_locked);

    // 2. Sort all GROUPS in descending order by max_cgpa.
    // Tie-Breaker: In the event of a tie, use the group's created_at timestamp (earlier group wins).
    candidateGroups.sort((a, b) => {
      if (b.max_cgpa !== a.max_cgpa) {
        return b.max_cgpa - a.max_cgpa; // Descending max_cgpa
      }
      // Earlier created_at timestamp wins
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const auditTrail: AllotmentLogEntry[] = [];
    let totalAllotted = 0;
    let totalUnallotted = 0;
    let totalStudentsPlaced = 0;

    // Release any previous allocations for this round to ensure idempotency if re-run
    const existingRoundAllotments = mockDb.allotments.filter((a) => a.round_number === roundNumber);
    for (const alloc of existingRoundAllotments) {
      const room = mockDb.rooms.find((r) => r.room_id === alloc.room_id);
      if (room) room.status = 'free';
    }
    mockDb.allotments = mockDb.allotments.filter((a) => a.round_number !== roundNumber);

    // 3. Iterate through sorted groups
    for (let index = 0; index < candidateGroups.length; index++) {
      const group = candidateGroups[index];
      const rank = index + 1;

      // Check if tie-breaker was applied with adjacent group
      const prevGroup = candidateGroups[index - 1];
      const nextGroup = candidateGroups[index + 1];
      const tieBreakerApplied =
        (prevGroup && prevGroup.max_cgpa === group.max_cgpa) ||
        (nextGroup && nextGroup.max_cgpa === group.max_cgpa);

      // Fetch accepted group members
      const acceptedMembers = mockDb.groupMembers.filter(
        (m) => m.group_id === group.group_id && m.status === 'accepted'
      );
      const memberRolls = acceptedMembers.map((m) => m.roll_no);

      // Fetch group preferences in order: Choice 1, 2, 3...
      const preferences = mockDb.preferences
        .filter((p) => p.group_id === group.group_id)
        .sort((a, b) => a.preference_rank - b.preference_rank);

      let allottedRoom: Room | null = null;
      let matchedChoiceRank: number | undefined;

      // Check Choice 1, 2, 3... in order
      for (const pref of preferences) {
        // Strict row check: Must match capacity AND status must be 'free'
        // Simulates `SELECT * FROM rooms WHERE room_id = $1 FOR UPDATE`
        const targetRoom = mockDb.rooms.find(
          (r) => r.room_id === pref.room_id && r.status === 'free' && r.capacity === group.required_capacity
        );

        if (targetRoom) {
          // Lock room atomically
          targetRoom.status = 'locked';
          allottedRoom = targetRoom;
          matchedChoiceRank = pref.preference_rank;
          break; // Successfully found best available preference
        }
      }

      if (allottedRoom) {
        const hostel = mockDb.hostels.find((h) => h.hostel_id === allottedRoom.hostel_id)!;

        // Assign all group members to that room in ALLOTMENTS simultaneously
        for (const roll of memberRolls) {
          // Archive old allotment to history if any
          const oldAllotment = mockDb.allotments.find((a) => a.roll_no === roll && a.is_active);
          if (oldAllotment) {
            const oldRoom = mockDb.rooms.find((r) => r.room_id === oldAllotment.room_id);
            const oldHostel = oldRoom ? mockDb.hostels.find((h) => h.hostel_id === oldRoom.hostel_id) : null;
            mockDb.hostelHistory.push({
              history_id: `hist-${Date.now()}-${roll}`,
              roll_no: roll,
              old_hostel: oldHostel ? oldHostel.name : 'Unknown',
              old_room: oldRoom ? oldRoom.room_number : 'Unknown',
              year: oldAllotment.academic_year,
              archived_at: new Date().toISOString(),
            });
            oldAllotment.is_active = false;
          }

          const newAllotment: Allotment = {
            allotment_id: `alt-${Date.now()}-${roll}`,
            roll_no: roll,
            room_id: allottedRoom.room_id,
            group_id: group.group_id,
            round_number: roundNumber,
            academic_year: academicYear,
            is_active: true,
            allotted_at: new Date().toISOString(),
          };
          mockDb.allotments.push(newAllotment);
        }

        totalAllotted++;
        totalStudentsPlaced += memberRolls.length;

        auditTrail.push({
          rank,
          groupId: group.group_id,
          groupCode: group.group_code,
          leaderRollNo: group.leader_roll_no,
          maxCgpa: group.max_cgpa,
          createdAt: group.created_at,
          requiredCapacity: group.required_capacity,
          memberRolls,
          status: 'ALLOTTED',
          allocatedRoomId: allottedRoom.room_id,
          allocatedRoomNumber: allottedRoom.room_number,
          allocatedHostelName: hostel.name,
          matchedChoiceRank,
          tieBreakerApplied,
          notes: `Allotted Choice #${matchedChoiceRank} (${hostel.name}, Room ${allottedRoom.room_number}) to ${memberRolls.length} students.`,
        });
      } else {
        totalUnallotted++;
        auditTrail.push({
          rank,
          groupId: group.group_id,
          groupCode: group.group_code,
          leaderRollNo: group.leader_roll_no,
          maxCgpa: group.max_cgpa,
          createdAt: group.created_at,
          requiredCapacity: group.required_capacity,
          memberRolls,
          status: 'NO_CHOICE_AVAILABLE',
          tieBreakerApplied,
          notes: `None of the group's ${preferences.length} choices were available at their merit rank.`,
        });
      }
    }

    // Update Round Config
    const roundConfig = mockDb.roundsConfig.find((r) => r.round_number === roundNumber);
    if (roundConfig) {
      roundConfig.allotment_run_at = new Date().toISOString();
      roundConfig.total_allotted_groups = totalAllotted;
      roundConfig.total_unallotted_groups = totalUnallotted;
      // Note: Results remain HIDDEN until explicitly published!
      // roundConfig.is_published remains false until admin publishes
    }

    return {
      success: true,
      roundNumber,
      academicYear,
      timestamp: new Date().toISOString(),
      totalGroupsConsidered: candidateGroups.length,
      totalAllottedGroups: totalAllotted,
      totalUnallottedGroups: totalUnallotted,
      totalStudentsPlaced,
      auditTrail,
    };
  }
}
