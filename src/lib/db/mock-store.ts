import {
  Student,
  Hostel,
  Room,
  Group,
  GroupMember,
  GroupInvite,
  Preference,
  Allotment,
  HostelHistory,
  RoundConfig,
  GateLog,
} from './types';
import nithStudentsData from './nith-students.json';
import nithRoomsData from './nith-rooms.json';

// ==============================================================================
// 1. NITH HOSTELS
// ==============================================================================
export const initialHostels: Hostel[] = [
  // Boys Hostels
  {
    hostel_id: 'HBH',
    name: 'Himadri Boys Hostel (HBH)',
    gender_allowed: 'Male',
    allowed_years: [2],
    warden_id: 'WARDEN-HBH',
    warden_name: 'Dr. Rohit Dhiman',
    warden_phone: '+91 94180 12345',
    capacity: 675,
    curfew_time: '22:00:00',
  },
  {
    hostel_id: 'DBH',
    name: 'Dhauladhar Boys Hostel (DBH)',
    gender_allowed: 'Male',
    allowed_years: [3],
    warden_id: 'WARDEN-DBH',
    warden_name: 'Dr. Ramesh Sharma',
    warden_phone: '+91 98765 43210',
    capacity: 350,
    curfew_time: '22:00:00',
  },
  {
    hostel_id: 'NBH',
    name: 'Neelkanth Boys Hostel (NBH)',
    gender_allowed: 'Male',
    allowed_years: [3],
    warden_id: 'WARDEN-NBH',
    warden_name: 'Prof. Arvind Kumar',
    warden_phone: '+91 98765 43211',
    capacity: 350,
    curfew_time: '22:00:00',
  },
  {
    hostel_id: 'HGBH',
    name: 'Himgiri Boys Hostel (HGBH)',
    gender_allowed: 'Male',
    allowed_years: [4],
    warden_id: 'WARDEN-HGBH',
    warden_name: 'Dr. Suresh Verma',
    warden_phone: '+91 98765 43212',
    capacity: 250,
    curfew_time: '22:30:00',
  },
  {
    hostel_id: 'VBH',
    name: 'Vidhyanchal Boys Hostel (VBH)',
    gender_allowed: 'Male',
    allowed_years: [4],
    warden_id: 'WARDEN-VBH',
    warden_name: 'Dr. Amit Kaul',
    warden_phone: '+91 98765 43216',
    capacity: 250,
    curfew_time: '22:30:00',
  },
  {
    hostel_id: 'UBH',
    name: 'Udaygiri Boys Hostel (UBH)',
    gender_allowed: 'Male',
    allowed_years: [4],
    warden_id: 'WARDEN-UBH',
    warden_name: 'Dr. Rajeev Kumar',
    warden_phone: '+91 98765 43217',
    capacity: 250,
    curfew_time: '22:30:00',
  },
  {
    hostel_id: 'KBH',
    name: 'Kailash Boys Hostel (KBH)',
    gender_allowed: 'Male',
    allowed_years: [1, 2],
    warden_id: 'WARDEN-KBH',
    warden_name: 'Dr. Vineet Kumar',
    warden_phone: '+91 98765 43220',
    capacity: 600,
    curfew_time: '21:30:00',
  },

  // Girls Hostels
  {
    hostel_id: 'AGH',
    name: 'Ambika Girls Hostel (AGH)',
    gender_allowed: 'Female',
    allowed_years: [2],
    warden_id: 'WARDEN-AGH',
    warden_name: 'Dr. Sunita Rao',
    warden_phone: '+91 98765 43213',
    capacity: 300,
    curfew_time: '21:30:00',
  },
  {
    hostel_id: 'PGH',
    name: 'Parvati Girls Hostel (PGH)',
    gender_allowed: 'Female',
    allowed_years: [3, 4],
    warden_id: 'WARDEN-PGH',
    warden_name: 'Prof. Meenakshi Sundaram',
    warden_phone: '+91 98765 43214',
    capacity: 300,
    curfew_time: '21:30:00',
  },
  {
    hostel_id: 'SGH',
    name: 'Satpura Girls Hostel (SGH)',
    gender_allowed: 'Female',
    allowed_years: [3, 4],
    warden_id: 'WARDEN-SGH',
    warden_name: 'Dr. Vandana Sharma',
    warden_phone: '+91 98765 43218',
    capacity: 300,
    curfew_time: '21:30:00',
  },
  {
    hostel_id: 'MMGH',
    name: 'Manimahesh Girls Hostel (MMGH)',
    gender_allowed: 'Female',
    allowed_years: [4],
    warden_id: 'WARDEN-MMGH',
    warden_name: 'Dr. Ananya Mukherjee',
    warden_phone: '+91 98765 43215',
    capacity: 250,
    curfew_time: '22:00:00',
  },
];

// Helper to resolve current hostel & available next hostels according to student gender & year
export function getStudentHostelPathway(student: Student, allHostels: Hostel[] = initialHostels): {
  currentHostel: string;
  nextHostels: Hostel[];
} {
  let currentHostel = 'Kailash Boys Hostel (KBH)';
  let nextHostelIds: string[] = [];

  if (student.gender === 'Female') {
    if (student.year === 2) {
      currentHostel = 'Ambika Girls Hostel (AGH) - Wing A';
      nextHostelIds = ['AGH'];
    } else if (student.year === 3) {
      currentHostel = 'Ambika Girls Hostel (AGH)';
      nextHostelIds = ['PGH', 'SGH'];
    } else {
      currentHostel = 'Parvati Girls Hostel (PGH)';
      nextHostelIds = ['MMGH', 'SGH', 'PGH'];
    }
  } else {
    if (student.year === 2) {
      currentHostel = 'Kailash Boys Hostel (KBH)';
      nextHostelIds = ['HBH'];
    } else if (student.year === 3) {
      currentHostel = 'Himadri Boys Hostel (HBH)';
      nextHostelIds = ['DBH', 'NBH'];
    } else {
      currentHostel = 'Dhauladhar Boys Hostel (DBH)';
      nextHostelIds = ['HGBH', 'VBH', 'UBH'];
    }
  }

  const nextHostels = allHostels.filter((h) => nextHostelIds.includes(h.hostel_id));
  return { currentHostel, nextHostels };
}

// ==============================================================================
// 2. ROOMS & STUDENTS DATA LOADED FROM GENERATED JSON
// ==============================================================================
const initialRooms: Room[] = (nithRoomsData as unknown as Room[]).map((r) => ({
  ...r,
  status: r.status || 'free',
}));

const initialStudents: Student[] = (nithStudentsData as unknown as Student[]).map((s) => {
  const pathway = getStudentHostelPathway(s);
  return {
    ...s,
    current_hostel: pathway.currentHostel,
  };
});

// Helper to pre-populate realistic locked roommate choice groups across all cohorts
function buildPreSeededGroups(students: Student[], rooms: Room[]) {
  const groups: Group[] = [];
  const groupMembers: GroupMember[] = [];
  const preferences: Preference[] = [];

  // Exclude test and demo students so they can freely test creating lobbies in test suite and demo
  const reservedRolls = new Set(['25BEE012', '25BCH076']);

  // Pool students by year and gender
  const pools = {
    y2m: students.filter((s) => s.year === 2 && s.gender === 'Male' && !reservedRolls.has(s.roll_no)),
    y2f: students.filter((s) => s.year === 2 && s.gender === 'Female' && !reservedRolls.has(s.roll_no)),
    y3m: students.filter((s) => s.year === 3 && s.gender === 'Male' && !reservedRolls.has(s.roll_no)),
    y3f: students.filter((s) => s.year === 3 && s.gender === 'Female' && !reservedRolls.has(s.roll_no)),
    y4m: students.filter((s) => s.year === 4 && s.gender === 'Male' && !reservedRolls.has(s.roll_no)),
    y4f: students.filter((s) => s.year === 4 && s.gender === 'Female' && !reservedRolls.has(s.roll_no)),
  };

  let groupCounter = 1;
  const createCohort = (
    pool: Student[],
    sharingType: 'Triplets' | 'Fourlets',
    hostelId: string,
    prefix: string,
    count: number
  ) => {
    const capacity = sharingType === 'Fourlets' ? 4 : 3;
    const availableRooms = rooms.filter((r) => r.hostel_id === hostelId && r.capacity === capacity);

    for (let c = 0; c < count; c++) {
      if (pool.length < capacity) break;
      const members = pool.splice(0, capacity);
      const leader = members[0];
      const maxCgpa = Math.max(...members.map((m) => m.cgpa));
      const groupId = `grp-seed-${prefix.toLowerCase()}-${groupCounter}`;
      const groupCode = `LOBBY-${prefix}-${String(groupCounter).padStart(2, '0')}`;
      const timestamp = new Date(Date.now() - (40 - groupCounter) * 3600 * 1000).toISOString();

      groups.push({
        group_id: groupId,
        group_code: groupCode,
        leader_roll_no: leader.roll_no,
        sharing_type: sharingType,
        max_cgpa: Number(maxCgpa.toFixed(2)),
        required_capacity: capacity,
        is_locked: true,
        created_at: timestamp,
      });

      members.forEach((m, idx) => {
        groupMembers.push({
          member_id: `m-seed-${groupId}-${idx + 1}`,
          group_id: groupId,
          roll_no: m.roll_no,
          status: 'accepted',
          joined_at: timestamp,
        });
      });

      // 3 Ranked Room Preferences
      const startIndex = (c * 2) % Math.max(1, availableRooms.length - 3);
      const prefRooms = availableRooms.slice(startIndex, startIndex + 3);
      prefRooms.forEach((rm, rIdx) => {
        preferences.push({
          pref_id: `p-seed-${groupId}-${rIdx + 1}`,
          group_id: groupId,
          preference_rank: rIdx + 1,
          room_id: rm.room_id,
          created_at: timestamp,
        });
      });

      groupCounter++;
    }
  };

  // Seed Cohorts:
  // Year 2 Boys: 5 Fourlets & 3 Triplets in Himadri (HBH)
  createCohort(pools.y2m, 'Fourlets', 'HBH', 'HBH-F', 5);
  createCohort(pools.y2m, 'Triplets', 'HBH', 'HBH-T', 3);

  // Year 2 Girls: 3 Fourlets & 2 Triplets in Ambika (AGH)
  createCohort(pools.y2f, 'Fourlets', 'AGH', 'AGH-F', 3);
  createCohort(pools.y2f, 'Triplets', 'AGH', 'AGH-T', 2);

  // Year 3 Boys: 4 Triplets in Dhauladhar (DBH)
  createCohort(pools.y3m, 'Triplets', 'DBH', 'DBH-T', 4);

  // Year 3 Girls: 3 Triplets in Parvati (PGH)
  createCohort(pools.y3f, 'Triplets', 'PGH', 'PGH-T', 3);

  // Year 4 Boys: 3 Triplets in Himgiri (HGBH)
  createCohort(pools.y4m, 'Triplets', 'HGBH', 'HGBH-T', 3);

  return { groups, groupMembers, preferences };
}

// Generate pre-seeded locked groups
const {
  groups: initialGroups,
  groupMembers: initialGroupMembers,
  preferences: initialPreferences,
} = buildPreSeededGroups([...initialStudents], [...initialRooms]);

const initialInvites: GroupInvite[] = [];

const initialRoundsConfig: RoundConfig[] = [
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
    auto_release_interval_ms: 2 * 60 * 60 * 1000, // 2 hours in ms
    auto_release_enabled: true,
    total_rounds: 5,
    final_round_active: false,
    final_round_completed: false,
  },
];

// In-Memory Storage Container (Global across hot reloads in dev)
class MockDatabase {
  hostels: Hostel[] = [...initialHostels];
  rooms: Room[] = [...initialRooms];
  students: Student[] = [...initialStudents];
  groups: Group[] = JSON.parse(JSON.stringify(initialGroups));
  groupMembers: GroupMember[] = JSON.parse(JSON.stringify(initialGroupMembers));
  invites: GroupInvite[] = [...initialInvites];
  preferences: Preference[] = JSON.parse(JSON.stringify(initialPreferences));
  allotments: Allotment[] = [];
  hostelHistory: HostelHistory[] = [];
  roundsConfig: RoundConfig[] = [...initialRoundsConfig];
  gateLogs: GateLog[] = [];
  otps: Map<string, { otp: string; expires_at: number }> = new Map();

  // Reset to initial state
  reset() {
    this.hostels = JSON.parse(JSON.stringify(initialHostels));
    this.rooms = JSON.parse(JSON.stringify(initialRooms));
    this.students = JSON.parse(JSON.stringify(initialStudents));
    this.groups = JSON.parse(JSON.stringify(initialGroups));
    this.groupMembers = JSON.parse(JSON.stringify(initialGroupMembers));
    this.invites = JSON.parse(JSON.stringify(initialInvites));
    this.preferences = JSON.parse(JSON.stringify(initialPreferences));
    this.allotments = [];
    this.hostelHistory = [];
    this.roundsConfig = JSON.parse(JSON.stringify(initialRoundsConfig));
    this.gateLogs = [];
    this.otps.clear();
  }
}

// Ensure singleton across modules
declare global {
  // eslint-disable-next-line no-var
  var __mockDbInstance: MockDatabase | undefined;
}

if (!global.__mockDbInstance) {
  global.__mockDbInstance = new MockDatabase();
}

export const mockDb = global.__mockDbInstance;
