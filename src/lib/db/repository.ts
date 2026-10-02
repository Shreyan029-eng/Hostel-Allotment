import { mockDb } from './mock-store';
import {
  Student,
  Hostel,
  Room,
  Group,
  GroupMember,
  GroupInvite,
  Preference,
  Allotment,
  RoundConfig,
  GateLog,
  GroupDetails,
  AllotmentResultDetails,
} from './types';
import { createAdminClient } from '../supabase/admin';

// Helper to determine if real Supabase should be utilized
function hasSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  );
}

export class HostelRepository {
  // ===========================================================================
  // STUDENTS
  // ===========================================================================
  static async getStudents(): Promise<Student[]> {
    if (hasSupabaseConfig()) {
      const supabase = createAdminClient();
      if (supabase) {
        const { data, error } = await supabase.from('students').select('*').order('roll_no');
        if (!error && data) return data as Student[];
      }
    }
    return mockDb.students;
  }

  static async getStudentByRoll(rollNo: string): Promise<Student | null> {
    const clean = rollNo.trim().toUpperCase();
    if (hasSupabaseConfig()) {
      const supabase = createAdminClient();
      if (supabase) {
        const { data } = await supabase.from('students').select('*').ilike('roll_no', clean).single();
        if (data) return data as Student;
      }
    }
    return mockDb.students.find((s) => s.roll_no.toUpperCase() === clean) || null;
  }

  static async getStudentByCollegeId(identifier: string): Promise<Student | null> {
    const raw = identifier.trim().toLowerCase();
    const cleanRoll = raw.replace('@nith.ac.in', '').toUpperCase();

    if (hasSupabaseConfig()) {
      const supabase = createAdminClient();
      if (supabase) {
        const { data } = await supabase
          .from('students')
          .select('*')
          .or(`roll_no.ilike.${cleanRoll},email.ilike.${raw}`)
          .single();
        if (data) return data as Student;
      }
    }

    return (
      mockDb.students.find(
        (s) =>
          s.roll_no.toUpperCase() === cleanRoll ||
          s.email.toLowerCase() === raw ||
          s.email.toLowerCase() === `${cleanRoll.toLowerCase()}@nith.ac.in`
      ) || null
    );
  }

  static async getStudentByBarcode(barcodeId: string): Promise<Student | null> {
    if (hasSupabaseConfig()) {
      const supabase = createAdminClient();
      if (supabase) {
        const { data } = await supabase.from('students').select('*').eq('barcode_id', barcodeId).single();
        if (data) return data as Student;
      }
    }
    return mockDb.students.find((s) => s.barcode_id === barcodeId) || null;
  }

  // ===========================================================================
  // HOSTELS & ROOMS
  // Dynamic Filtering: 2nd year -> 1 hostel, 3rd year -> 2 hostels, 4th year -> 3 hostels
  // ===========================================================================
  static async getHostels(): Promise<Hostel[]> {
    if (hasSupabaseConfig()) {
      const supabase = createAdminClient();
      if (supabase) {
        const { data } = await supabase.from('hostels').select('*');
        if (data) return data as Hostel[];
      }
    }
    return mockDb.hostels;
  }

  static async getAllowedHostelsForStudent(student: Student): Promise<Hostel[]> {
    const { getStudentHostelPathway } = await import('./mock-store');
    const allHostels = await this.getHostels();
    return getStudentHostelPathway(student, allHostels).nextHostels;
  }

  static async getRooms(hostelIds?: string[], capacity?: number, status?: 'free' | 'locked'): Promise<(Room & { hostel: Hostel })[]> {
    let rooms = mockDb.rooms;
    const hostels = mockDb.hostels;

    if (hostelIds && hostelIds.length > 0) {
      rooms = rooms.filter((r) => hostelIds.includes(r.hostel_id));
    }
    if (capacity !== undefined) {
      rooms = rooms.filter((r) => r.capacity === capacity);
    }
    if (status !== undefined) {
      rooms = rooms.filter((r) => r.status === status);
    }

    return rooms.map((room) => {
      const hostel = hostels.find((h) => h.hostel_id === room.hostel_id) || {
        hostel_id: room.hostel_id,
        name: room.hostel_id,
        gender_allowed: 'All' as const,
        allowed_years: [2, 3, 4],
        warden_id: '',
        warden_name: 'Warden',
        warden_phone: '',
        capacity: 100,
        curfew_time: '22:00:00',
      };
      return { ...room, hostel };
    });
  }

  // ===========================================================================
  // GAME-STYLE ROOMMATE LOBBY (INVITE & ACCEPT SYSTEM, NOT CODE BASED)
  // Requirement 7 & 8: Custom room lobby like games with strict peer privacy
  // ===========================================================================
  static async createLobby(
    leaderRollNo: string,
    sharingType: 'Triplets' | 'Fourlets'
  ): Promise<{ success: boolean; group?: Group; error?: string }> {
    const leader = await this.getStudentByRoll(leaderRollNo);
    if (!leader) return { success: false, error: 'Leader student record not found' };

    // Check if student already in any group
    const existingMembership = mockDb.groupMembers.find((m) => m.roll_no.toUpperCase() === leaderRollNo.toUpperCase());
    if (existingMembership) {
      return { success: false, error: 'Student is already a member or leader of a group' };
    }

    const requiredCapacity = sharingType === 'Fourlets' ? 4 : 3;
    const lobbyCode = `LOBBY-${leader.gender === 'Female' ? 'G' : 'B'}${leader.year}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newGroup: Group = {
      group_id: `grp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      group_code: lobbyCode,
      leader_roll_no: leader.roll_no,
      sharing_type: sharingType,
      max_cgpa: leader.cgpa,
      required_capacity: requiredCapacity,
      is_locked: false,
      created_at: new Date().toISOString(),
    };

    mockDb.groups.push(newGroup);

    // Leader is automatically accepted member #1 (Slot 1)
    mockDb.groupMembers.push({
      member_id: `m-${Date.now()}`,
      group_id: newGroup.group_id,
      roll_no: leader.roll_no,
      status: 'accepted',
      joined_at: new Date().toISOString(),
    });

    return { success: true, group: newGroup };
  }

  static async createGroup(leaderRollNo: string, requiredCapacity: number): Promise<{ success: boolean; group?: Group; error?: string }> {
    const sharingType = requiredCapacity === 4 ? 'Fourlets' : 'Triplets';
    return this.createLobby(leaderRollNo, sharingType);
  }

  static async joinGroupByCode(groupCode: string, rollNo: string): Promise<{ success: boolean; error?: string }> {
    const group = mockDb.groups.find((g) => g.group_code.toUpperCase() === groupCode.toUpperCase());
    if (!group) return { success: false, error: 'Invalid Group Code' };
    if (group.is_locked) return { success: false, error: 'Group has locked its preferences and cannot accept new members' };

    const candidate = await this.getStudentByRoll(rollNo);
    if (!candidate) return { success: false, error: 'Student not found' };

    const leader = await this.getStudentByRoll(group.leader_roll_no);
    if (!leader) return { success: false, error: 'Group leader not found' };

    // Strict Rule: Validate that candidate has the exact same year and gender
    if (candidate.gender !== leader.gender) {
      return {
        success: false,
        error: `Gender mismatch! Group is for ${leader.gender} students, but candidate is ${candidate.gender}.`,
      };
    }

    if (candidate.year !== leader.year) {
      return {
        success: false,
        error: `Year mismatch! Group is for Year ${leader.year} students, but candidate is Year ${candidate.year}.`,
      };
    }

    // Check if candidate is already in any group
    const existingMembership = mockDb.groupMembers.find((m) => m.roll_no.toUpperCase() === rollNo.toUpperCase());
    if (existingMembership) {
      return { success: false, error: 'You are already in a group. Leave your current group first.' };
    }

    // Check capacity
    const currentMembers = mockDb.groupMembers.filter((m) => m.group_id === group.group_id && m.status === 'accepted');
    if (currentMembers.length >= group.required_capacity) {
      return { success: false, error: `Group is already at maximum capacity (${group.required_capacity} members)` };
    }

    // Add candidate as member
    mockDb.groupMembers.push({
      member_id: `m-${Date.now()}`,
      group_id: group.group_id,
      roll_no: candidate.roll_no,
      status: 'accepted',
      joined_at: new Date().toISOString(),
    });

    this.recalculateMaxCgpa(group.group_id);
    return { success: true };
  }

  /**
   * Strictly filters eligible peers:
   * Rule: Students can ONLY browse & invite peers of their exact SAME YEAR and SAME GENDER.
   */
  static async getEligiblePeers(studentRoll: string): Promise<{
    roll_no: string;
    name: string;
    father_name: string;
    email: string;
    gender: string;
    year: number;
    cgpa: number;
    in_group: boolean;
    is_invited: boolean;
  }[]> {
    const currentStudent = await this.getStudentByRoll(studentRoll);
    if (!currentStudent) return [];

    const currentGroup = await this.getGroupByRollNo(studentRoll);
    const acceptedRolls = new Set(
      mockDb.groupMembers
        .filter((m) => m.status === 'accepted')
        .map((m) => m.roll_no.toUpperCase())
    );

    const pendingInvitedRolls = new Set(
      mockDb.invites
        .filter((i) => currentGroup && i.group_id === currentGroup.group_id && i.status === 'pending')
        .map((i) => i.to_roll_no.toUpperCase())
    );

    const peers = mockDb.students.filter(
      (s) =>
        s.roll_no.toUpperCase() !== currentStudent.roll_no.toUpperCase() &&
        s.year === currentStudent.year &&
        s.gender === currentStudent.gender &&
        s.is_active
    );

    return peers.map((p) => ({
      roll_no: p.roll_no,
      name: p.name,
      father_name: p.father_name || '',
      email: p.email,
      gender: p.gender,
      year: p.year,
      cgpa: p.cgpa,
      in_group: acceptedRolls.has(p.roll_no.toUpperCase()),
      is_invited: pendingInvitedRolls.has(p.roll_no.toUpperCase()),
    }));
  }

  static async sendInvite(
    groupId: string,
    fromRollNo: string,
    toRollNo: string
  ): Promise<{ success: boolean; invite?: GroupInvite; error?: string }> {
    const group = mockDb.groups.find((g) => g.group_id === groupId);
    if (!group) return { success: false, error: 'Room lobby not found' };
    if (group.is_locked) return { success: false, error: 'Lobby has locked preferences and cannot send invites' };

    const acceptedCount = mockDb.groupMembers.filter((m) => m.group_id === groupId && m.status === 'accepted').length;
    if (acceptedCount >= group.required_capacity) {
      return { success: false, error: `Lobby is full (${group.required_capacity}/${group.required_capacity} slots occupied)` };
    }

    const fromStudent = await this.getStudentByRoll(fromRollNo);
    const toStudent = await this.getStudentByRoll(toRollNo);
    if (!fromStudent || !toStudent) return { success: false, error: 'Student record not found' };

    // Strict Rule: Exact same year and same gender
    if (fromStudent.gender !== toStudent.gender) {
      return { success: false, error: `Cannot invite peers of different gender (${fromStudent.gender} vs ${toStudent.gender})` };
    }
    if (fromStudent.year !== toStudent.year) {
      return { success: false, error: `Cannot invite peers of different academic year (Year ${fromStudent.year} vs Year ${toStudent.year})` };
    }

    // Check if recipient is already in a group
    const recipientMembership = mockDb.groupMembers.find(
      (m) => m.roll_no.toUpperCase() === toRollNo.toUpperCase() && m.status === 'accepted'
    );
    if (recipientMembership) {
      return { success: false, error: `${toStudent.name} is already in another roommate group` };
    }

    // Check if invite already sent and pending
    const existingInvite = mockDb.invites.find(
      (i) => i.group_id === groupId && i.to_roll_no.toUpperCase() === toRollNo.toUpperCase() && i.status === 'pending'
    );
    if (existingInvite) {
      return { success: false, error: 'An invite is already pending for this student' };
    }

    const newInvite: GroupInvite = {
      invite_id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      group_id: groupId,
      from_roll_no: fromStudent.roll_no,
      from_name: fromStudent.name,
      to_roll_no: toStudent.roll_no,
      to_name: toStudent.name,
      sharing_type: group.sharing_type || (group.required_capacity === 4 ? 'Fourlets' : 'Triplets'),
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    mockDb.invites.push(newInvite);
    return { success: true, invite: newInvite };
  }

  static async respondInvite(
    inviteId: string,
    studentRoll: string,
    action: 'accept' | 'decline'
  ): Promise<{ success: boolean; error?: string }> {
    const invite = mockDb.invites.find((i) => i.invite_id === inviteId);
    if (!invite) return { success: false, error: 'Invite not found' };

    if (invite.to_roll_no.toUpperCase() !== studentRoll.toUpperCase()) {
      return { success: false, error: 'You are not authorized to respond to this invite' };
    }

    if (invite.status !== 'pending') {
      return { success: false, error: `Invite is already ${invite.status}` };
    }

    if (action === 'decline') {
      invite.status = 'declined';
      return { success: true };
    }

    // Action is 'accept'
    const group = mockDb.groups.find((g) => g.group_id === invite.group_id);
    if (!group) return { success: false, error: 'Room lobby no longer exists' };
    if (group.is_locked) return { success: false, error: 'Room lobby is locked' };

    // Check if student already in any group
    const existingMembership = mockDb.groupMembers.find(
      (m) => m.roll_no.toUpperCase() === studentRoll.toUpperCase() && m.status === 'accepted'
    );
    if (existingMembership) {
      return { success: false, error: 'You are already in a group. Please leave your current group first.' };
    }

    const currentMembers = mockDb.groupMembers.filter((m) => m.group_id === group.group_id && m.status === 'accepted');
    if (currentMembers.length >= group.required_capacity) {
      return { success: false, error: 'Sorry, this lobby reached capacity before you accepted.' };
    }

    // Add student to group
    mockDb.groupMembers.push({
      member_id: `m-${Date.now()}`,
      group_id: group.group_id,
      roll_no: invite.to_roll_no,
      status: 'accepted',
      joined_at: new Date().toISOString(),
    });

    invite.status = 'accepted';

    // Auto-decline any other pending invites for this student
    mockDb.invites.forEach((inv) => {
      if (inv.to_roll_no.toUpperCase() === studentRoll.toUpperCase() && inv.invite_id !== inviteId && inv.status === 'pending') {
        inv.status = 'declined';
      }
    });

    // Recalculate max_cgpa
    this.recalculateMaxCgpa(group.group_id);

    return { success: true };
  }

  static async getStudentInvites(studentRoll: string): Promise<(GroupInvite & {
    leader_name: string;
    current_members_count: number;
    required_capacity: number;
    group_code: string;
  })[]> {
    const pending = mockDb.invites.filter(
      (i) => i.to_roll_no.toUpperCase() === studentRoll.toUpperCase() && i.status === 'pending'
    );

    return pending.map((inv) => {
      const group = mockDb.groups.find((g) => g.group_id === inv.group_id);
      const leader = group ? mockDb.students.find((s) => s.roll_no === group.leader_roll_no) : null;
      const membersCount = group
        ? mockDb.groupMembers.filter((m) => m.group_id === group.group_id && m.status === 'accepted').length
        : 0;

      return {
        ...inv,
        leader_name: leader ? leader.name : inv.from_name,
        current_members_count: membersCount,
        required_capacity: group ? group.required_capacity : 4,
        group_code: group ? group.group_code : '',
      };
    });
  }

  static async leaveOrDisbandGroup(rollNo: string): Promise<{ success: boolean; error?: string }> {
    const memberEntry = mockDb.groupMembers.find((m) => m.roll_no.toUpperCase() === rollNo.toUpperCase());
    if (!memberEntry) return { success: false, error: 'Student is not in any group' };

    const group = mockDb.groups.find((g) => g.group_id === memberEntry.group_id);
    if (!group) return { success: false, error: 'Group not found' };

    if (group.is_locked) {
      return { success: false, error: 'Cannot leave or disband a group after choices have been locked' };
    }

    if (group.leader_roll_no.toUpperCase() === rollNo.toUpperCase()) {
      // Disband entire group: remove group, members, preferences, and cancel invites
      mockDb.groups = mockDb.groups.filter((g) => g.group_id !== group.group_id);
      mockDb.groupMembers = mockDb.groupMembers.filter((m) => m.group_id !== group.group_id);
      mockDb.preferences = mockDb.preferences.filter((p) => p.group_id !== group.group_id);
      mockDb.invites = mockDb.invites.filter((i) => i.group_id !== group.group_id);
      return { success: true };
    } else {
      // Individual member leaving
      mockDb.groupMembers = mockDb.groupMembers.filter(
        (m) => !(m.group_id === group.group_id && m.roll_no.toUpperCase() === rollNo.toUpperCase())
      );
      this.recalculateMaxCgpa(group.group_id);
      return { success: true };
    }
  }

  // ===========================================================================
  // STUDENT 6-DIGIT OTP AUTHENTICATION
  // Requirement 5: Student logs in using college mail and a 6-digit OTP
  // ===========================================================================
  static async generateStudentOtp(identifier: string): Promise<{
    success: boolean;
    otp?: string;
    student?: Student;
    error?: string;
  }> {
    const student = await this.getStudentByCollegeId(identifier);
    if (!student) {
      return { success: false, error: 'No student found with this roll number or college email.' };
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    mockDb.otps.set(student.roll_no.toUpperCase(), {
      otp,
      expires_at: Date.now() + 15 * 60 * 1000, // 15 minutes validity
    });

    return {
      success: true,
      otp,
      student,
    };
  }

  static async verifyStudentOtp(
    identifier: string,
    enteredOtp: string
  ): Promise<{ success: boolean; student?: Student; error?: string }> {
    const student = await this.getStudentByCollegeId(identifier);
    if (!student) {
      return { success: false, error: 'Student record not found' };
    }

    const cleanOtp = enteredOtp.trim();
    // Allow master dev bypass OTP '123456' OR the generated random OTP
    const stored = mockDb.otps.get(student.roll_no.toUpperCase());

    const isValid =
      cleanOtp === '123456' ||
      (stored && stored.otp === cleanOtp && stored.expires_at > Date.now());

    if (!isValid) {
      return { success: false, error: 'Invalid or expired 6-digit OTP. Please try again.' };
    }

    mockDb.otps.delete(student.roll_no.toUpperCase());
    return { success: true, student };
  }

  static recalculateMaxCgpa(groupId: string): void {
    const group = mockDb.groups.find((g) => g.group_id === groupId);
    if (!group) return;

    const acceptedMembers = mockDb.groupMembers.filter((m) => m.group_id === groupId && m.status === 'accepted');
    const memberStudents = acceptedMembers
      .map((m) => mockDb.students.find((s) => s.roll_no === m.roll_no))
      .filter((s): s is Student => Boolean(s));

    if (memberStudents.length > 0) {
      const highestCgpa = Math.max(...memberStudents.map((s) => s.cgpa));
      group.max_cgpa = Number(highestCgpa.toFixed(2));
    }
  }

  static async getGroupByRollNo(rollNo: string): Promise<(GroupDetails & {
    outgoing_invites?: GroupInvite[];
  }) | null> {
    const memberEntry = mockDb.groupMembers.find((m) => m.roll_no.toUpperCase() === rollNo.toUpperCase());
    if (!memberEntry) return null;

    const group = mockDb.groups.find((g) => g.group_id === memberEntry.group_id);
    if (!group) return null;

    const leader = mockDb.students.find((s) => s.roll_no === group.leader_roll_no)!;

    const members = mockDb.groupMembers
      .filter((m) => m.group_id === group.group_id)
      .map((m) => {
        const student = mockDb.students.find((s) => s.roll_no === m.roll_no)!;
        return { ...m, student };
      });

    const preferences = mockDb.preferences
      .filter((p) => p.group_id === group.group_id)
      .sort((a, b) => a.preference_rank - b.preference_rank)
      .map((p) => {
        const room = mockDb.rooms.find((r) => r.room_id === p.room_id)!;
        const hostel = mockDb.hostels.find((h) => h.hostel_id === room.hostel_id)!;
        return { ...p, room: { ...room, hostel } };
      });

    const outgoing_invites = mockDb.invites.filter(
      (i) => i.group_id === group.group_id && i.status === 'pending'
    );

    return {
      ...group,
      leader,
      members,
      preferences,
      outgoing_invites,
    };
  }

  // ===========================================================================
  // PREFERENCES & LOCKING
  // ===========================================================================
  static async submitAndLockPreferences(
    groupId: string,
    leaderRollNo: string,
    roomIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    const group = mockDb.groups.find((g) => g.group_id === groupId);
    if (!group) return { success: false, error: 'Group not found' };

    if (group.leader_roll_no !== leaderRollNo) {
      return { success: false, error: 'Only the Group Leader can submit and lock preferences' };
    }

    const acceptedMembers = mockDb.groupMembers.filter((m) => m.group_id === groupId && m.status === 'accepted');
    if (acceptedMembers.length !== group.required_capacity) {
      return {
        success: false,
        error: `Group is not complete. Requires ${group.required_capacity} accepted members, currently has ${acceptedMembers.length}.`,
      };
    }

    if (!roomIds || roomIds.length === 0) {
      return { success: false, error: 'Must provide at least 1 room preference' };
    }

    // Validate that each room matches required capacity
    for (const roomId of roomIds) {
      const room = mockDb.rooms.find((r) => r.room_id === roomId);
      if (!room) return { success: false, error: `Invalid room selected: ${roomId}` };
      if (room.capacity !== group.required_capacity) {
        return {
          success: false,
          error: `Room ${room.room_number} capacity (${room.capacity}) does not match your group capacity (${group.required_capacity})`,
        };
      }
    }

    // Clear old preferences and save new ranked preferences
    mockDb.preferences = mockDb.preferences.filter((p) => p.group_id !== groupId);
    roomIds.forEach((roomId, index) => {
      mockDb.preferences.push({
        pref_id: `pref-${groupId}-${index + 1}`,
        group_id: groupId,
        preference_rank: index + 1,
        room_id: roomId,
        created_at: new Date().toISOString(),
      });
    });

    group.is_locked = true;
    return { success: true };
  }

  // ===========================================================================
  // ALLOTMENTS & RESULTS
  // ===========================================================================
  static async getStudentAllotment(rollNo: string, isAdmin: boolean = false): Promise<AllotmentResultDetails | null> {
    const roundConfig = mockDb.roundsConfig.find((r) => r.round_number === 1);
    // Hide results from students until published by Admin!
    if (!isAdmin && (!roundConfig || !roundConfig.is_published)) {
      return null;
    }

    const allotment = mockDb.allotments.find((a) => a.roll_no === rollNo && a.is_active);
    if (!allotment) return null;

    const room = mockDb.rooms.find((r) => r.room_id === allotment.room_id)!;
    const hostel = mockDb.hostels.find((h) => h.hostel_id === room.hostel_id)!;

    // Roommates sharing this room
    const roommateAllotments = mockDb.allotments.filter((a) => a.room_id === allotment.room_id && a.is_active);
    const roommates = roommateAllotments
      .map((a) => mockDb.students.find((s) => s.roll_no === a.roll_no)!)
      .filter(Boolean);

    return {
      allotment,
      room,
      hostel,
      roommates,
    };
  }

  static async getAllAllotments(): Promise<(Allotment & { student: Student; room: Room & { hostel: Hostel } })[]> {
    return mockDb.allotments
      .filter((a) => a.is_active)
      .map((a) => {
        const student = mockDb.students.find((s) => s.roll_no === a.roll_no)!;
        const room = mockDb.rooms.find((r) => r.room_id === a.room_id)!;
        const hostel = mockDb.hostels.find((h) => h.hostel_id === room.hostel_id)!;
        return {
          ...a,
          student,
          room: { ...room, hostel },
        };
      });
  }

  static async getRoundConfig(roundNumber: number = 1): Promise<RoundConfig> {
    let cfg = mockDb.roundsConfig.find((r) => r.round_number === roundNumber);
    if (!cfg) {
      cfg = {
        round_number: roundNumber,
        academic_year: '2026-2027',
        is_published: false,
        is_active: true,
      };
      mockDb.roundsConfig.push(cfg);
    }
    return cfg;
  }

  static async setRoundPublishStatus(roundNumber: number = 1, isPublished: boolean): Promise<RoundConfig> {
    const cfg = await this.getRoundConfig(roundNumber);
    cfg.is_published = isPublished;
    cfg.published_at = isPublished ? new Date().toISOString() : null;
    return cfg;
  }

  // ===========================================================================
  // GATE SCANNER & LATE ARRIVAL NOTIFICATIONS (Dedicated Gate Database)
  // Requirement 4: Fast endpoint GET /api/student/[barcode_id] (Admin only)
  // ===========================================================================
  static async scanBarcode(barcodeId: string, direction: 'ENTRY' | 'EXIT' = 'ENTRY'): Promise<{
    success: boolean;
    student?: Student;
    allotment?: {
      hostel_name: string;
      room_number: string;
      warden_name: string;
      warden_phone: string;
    } | null;
    is_late: boolean;
    curfew_time: string;
    warden_alert?: {
      warden_name: string;
      warden_phone: string;
      message: string;
      alert_time: string;
    } | null;
    error?: string;
  }> {
    const { gateDb } = await import('./gate-db');
    const res = gateDb.scan(barcodeId, direction);
    const student = await this.getStudentByBarcode(barcodeId);

    return {
      success: res.success,
      student: student || undefined,
      allotment: res.studentRecord?.hostel_name
        ? {
            hostel_name: res.studentRecord.hostel_name,
            room_number: res.studentRecord.room_number || '',
            warden_name: res.studentRecord.warden_name || '',
            warden_phone: res.studentRecord.warden_phone || '',
          }
        : null,
      is_late: res.is_late,
      curfew_time: res.curfew_time,
      warden_alert: res.warden_alert,
      error: res.error,
    };
  }

  static async getGateLogs(): Promise<GateLog[]> {
    const { gateDb } = await import('./gate-db');
    return gateDb.getLogs();
  }
}
