import { mockDb } from '../db/mock-store';
import { Group, Allotment, Room, Student, RoundConfig } from '../db/types';
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
  roundNumber?: number;
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
   * Helper: Partition locked groups into 5 equal parts (rounds 1-5) per academic cohort.
   * Higher merit (CGPA) groups are assigned to earlier rounds.
   */
  static computeGroupBatchRounds(): Map<string, number> {
    const lockedGroups = mockDb.groups.filter((g) => g.is_locked);
    const cohortMap = new Map<string, Group[]>();

    for (const group of lockedGroups) {
      const leader = mockDb.students.find((s) => s.roll_no === group.leader_roll_no);
      const year = leader ? leader.year : 2;
      const gender = leader ? leader.gender : 'Male';
      const key = `${year}_${gender}`;

      if (!cohortMap.has(key)) cohortMap.set(key, []);
      cohortMap.get(key)!.push(group);
    }

    const groupRoundMap = new Map<string, number>();

    for (const [_key, groups] of cohortMap.entries()) {
      // Sort groups descending by max_cgpa, then ascending by created_at timestamp for ties
      groups.sort((a, b) => {
        if (b.max_cgpa !== a.max_cgpa) {
          return b.max_cgpa - a.max_cgpa;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      const batchSize = Math.max(1, Math.ceil(groups.length / 5));
      groups.forEach((group, index) => {
        // Distribute into rounds 1 to 5
        const assignedRound = Math.min(5, Math.floor(index / batchSize) + 1);
        groupRoundMap.set(group.group_id, assignedRound);
      });
    }

    return groupRoundMap;
  }

  /**
   * Get the assigned round (1-5) for a specific group.
   */
  static getGroupAssignedRound(groupId: string): number {
    const roundMap = this.computeGroupBatchRounds();
    return roundMap.get(groupId) || 1;
  }

  /**
   * Run allocation for a specific round (1 to 5 regular rounds, or 6 for Final Spot Round).
   */
  static async runRoundAllotment(
    roundNumber: number = 1,
    academicYear: string = '2026-2027'
  ): Promise<AllotmentRunResult> {
    console.log(`\n======================================================`);
    console.log(`[JOSAA ENGINE] Executing Round ${roundNumber === 6 ? 'FINAL (Spot Round)' : roundNumber} (${academicYear})`);
    console.log(`======================================================\n`);

    // Auto-lock any unallotted group that has submitted choices
    for (const g of mockDb.groups) {
      const hasPrefs = mockDb.preferences.some((p) => p.group_id === g.group_id);
      const alreadyAllotted = mockDb.allotments.some((a) => a.group_id === g.group_id && a.is_active);
      if (hasPrefs && !alreadyAllotted) {
        g.is_locked = true;
      }
    }

    const roundMap = this.computeGroupBatchRounds();
    const lockedGroups = mockDb.groups.filter((g) => g.is_locked);

    let candidateGroups: Group[] = [];

    if (roundNumber <= 5) {
      // For Round R: Evaluate groups assigned to Round <= R that do NOT have an active room allotment yet
      candidateGroups = lockedGroups.filter((g) => {
        const assigned = roundMap.get(g.group_id) || 1;
        const alreadyAllotted = mockDb.allotments.some((a) => a.group_id === g.group_id && a.is_active);
        return assigned <= roundNumber && !alreadyAllotted;
      });
    } else {
      // Round 6: Final Spot Round
      // Any locked group that has NO active room allotment across all rounds 1-5
      candidateGroups = lockedGroups.filter((g) => {
        return !mockDb.allotments.some((a) => a.group_id === g.group_id && a.is_active);
      });
    }

    // Sort candidate groups by merit
    candidateGroups.sort((a, b) => {
      if (b.max_cgpa !== a.max_cgpa) {
        return b.max_cgpa - a.max_cgpa;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const auditTrail: AllotmentLogEntry[] = [];
    let totalAllotted = 0;
    let totalUnallotted = 0;
    let totalStudentsPlaced = 0;

    for (let index = 0; index < candidateGroups.length; index++) {
      const group = candidateGroups[index];
      const rank = index + 1;

      const prevGroup = candidateGroups[index - 1];
      const nextGroup = candidateGroups[index + 1];
      const tieBreakerApplied =
        (prevGroup && prevGroup.max_cgpa === group.max_cgpa) ||
        (nextGroup && nextGroup.max_cgpa === group.max_cgpa);

      const acceptedMembers = mockDb.groupMembers.filter(
        (m) => m.group_id === group.group_id && m.status === 'accepted'
      );
      const memberRolls = acceptedMembers.map((m) => m.roll_no);

      // Ranked choices for the group
      const preferences = mockDb.preferences
        .filter((p) => p.group_id === group.group_id)
        .sort((a, b) => a.preference_rank - b.preference_rank);

      let allottedRoom: Room | null = null;
      let matchedChoiceRank: number | undefined;

      for (const pref of preferences) {
        const targetRoom = mockDb.rooms.find(
          (r) => r.room_id === pref.room_id && r.status === 'free' && r.capacity === group.required_capacity
        );

        if (targetRoom) {
          targetRoom.status = 'locked';
          allottedRoom = targetRoom;
          matchedChoiceRank = pref.preference_rank;
          break;
        }
      }

      if (allottedRoom) {
        const hostel = mockDb.hostels.find((h) => h.hostel_id === allottedRoom.hostel_id)!;

        for (const roll of memberRolls) {
          const newAllotment: Allotment = {
            allotment_id: `alt-r${roundNumber}-${Date.now()}-${roll}`,
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
          allocatedHostelName: hostel ? hostel.name : 'Unknown Hostel',
          matchedChoiceRank,
          tieBreakerApplied,
          roundNumber,
          notes: `Round ${roundNumber}: Allotted Choice #${matchedChoiceRank} (${hostel?.name || ''}, Room ${allottedRoom.room_number}) to ${memberRolls.length} students.`,
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
          roundNumber,
          notes: `Round ${roundNumber}: None of the group's ${preferences.length} choices were available at merit rank #${rank}.`,
        });
      }
    }

    // Update Round Configuration
    const choiceWindowMs = 30 * 60 * 1000; // 30 minutes choice modification window
    const totalCycleMs = 120 * 60 * 1000; // 2 hours total cycle (30m choices + 90m allocation processing)

    // Unlock choices for unallotted groups so students can modify/add choice filling for Round N+1
    const allottedGroupIds = new Set(mockDb.allotments.map((a) => a.group_id).filter(Boolean));
    for (const g of mockDb.groups) {
      if (!allottedGroupIds.has(g.group_id)) {
        g.is_locked = false; // Unlocked for choice filling in the 30-min window
      }
    }

    let roundConfig = mockDb.roundsConfig[0];
    if (!roundConfig) {
      roundConfig = {
        round_number: roundNumber,
        academic_year: academicYear,
        is_published: true,
        is_active: true,
        allotment_run_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        total_allotted_groups: totalAllotted,
        total_unallotted_groups: totalUnallotted,
        auto_release_interval_ms: totalCycleMs,
        auto_release_enabled: true,
        total_rounds: 5,
        final_round_active: roundNumber === 5,
        final_round_completed: roundNumber === 6,
        choice_filling_end_time: new Date(Date.now() + choiceWindowMs).toISOString(),
        choice_window_duration_ms: choiceWindowMs,
      };
      mockDb.roundsConfig = [roundConfig];
    } else {
      roundConfig.round_number = roundNumber;
      roundConfig.academic_year = academicYear;
      roundConfig.is_published = true;
      roundConfig.allotment_run_at = new Date().toISOString();
      roundConfig.published_at = new Date().toISOString();
      roundConfig.total_allotted_groups = mockDb.allotments.length;
      roundConfig.total_unallotted_groups = lockedGroups.length - mockDb.allotments.length;
      roundConfig.choice_window_duration_ms = choiceWindowMs;
      roundConfig.choice_filling_end_time = new Date(Date.now() + choiceWindowMs).toISOString();

      if (roundNumber < 5) {
        // Set next auto-release time to 2 hours from now
        roundConfig.auto_release_interval_ms = totalCycleMs;
        roundConfig.next_release_time = new Date(Date.now() + totalCycleMs).toISOString();
        roundConfig.final_round_active = false;
        roundConfig.final_round_completed = false;
      } else if (roundNumber === 5) {
        // Concluded all 5 regular rounds: Activate Final Spot Round!
        roundConfig.next_release_time = null;
        roundConfig.final_round_active = true;
        roundConfig.final_round_completed = false;
      } else if (roundNumber === 6) {
        // Final Round complete!
        roundConfig.next_release_time = null;
        roundConfig.final_round_active = false;
        roundConfig.final_round_completed = true;
      }
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

  /**
   * Advance immediately to the next round (Publish Next Round Now).
   * Round 1 -> Round 2 -> Round 3 -> Round 4 -> Round 5 -> Round 6 (Final).
   */
  static async advanceToNextRound(academicYear: string = '2026-2027'): Promise<AllotmentRunResult> {
    const config = mockDb.roundsConfig[0];
    let nextRound = 1;

    if (!config || !config.is_published) {
      nextRound = 1;
    } else if (config.round_number < 5) {
      nextRound = config.round_number + 1;
    } else if (config.round_number === 5 && config.final_round_active) {
      nextRound = 6; // Final Spot Round
    } else {
      nextRound = 6;
    }

    return await this.runRoundAllotment(nextRound, academicYear);
  }

  /**
   * Run the Final Spot Round specifically for unallotted students after Round 5.
   */
  static async runFinalRound(academicYear: string = '2026-2027'): Promise<AllotmentRunResult> {
    return await this.runRoundAllotment(6, academicYear);
  }

  /**
   * Full reset: Clears all allotments, unlocks all rooms, resets rounds back to round 1 (unpublished).
   */
  static resetAllRounds() {
    mockDb.rooms.forEach((r) => {
      r.status = 'free';
    });
    mockDb.allotments = [];
    mockDb.roundsConfig = [
      {
        round_number: 1,
        academic_year: '2026-2027',
        is_published: false,
        is_active: true,
        allotment_run_at: null,
        published_at: null,
        total_allotted_groups: 0,
        total_unallotted_groups: 0,
        next_release_time: null,
        auto_release_interval_ms: 2 * 60 * 60 * 1000,
        auto_release_enabled: true,
        total_rounds: 5,
        final_round_active: false,
        final_round_completed: false,
      },
    ];
  }

  /**
   * Legacy runBatchAllotment: default alias for running round allotment.
   */
  static async runBatchAllotment(
    roundNumber: number = 1,
    academicYear: string = '2026-2027'
  ): Promise<AllotmentRunResult> {
    return await this.runRoundAllotment(roundNumber, academicYear);
  }
}
