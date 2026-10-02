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
// 1. OFFICIAL NITH HOSTELS
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

// Initial sample groups for instant demonstration
const initialGroups: Group[] = [
  // 1. Group of 4 (Year 2 Boys - Himadri Fourlet):
  // Leader ANIRUDH BHARDWAJ (7.38) & VIVEK BHARTI (6.7) & ATHRAV SHARMA (7.78)
  {
    group_id: 'grp-hbh-demo',
    group_code: 'LOBBY-HBH-01',
    leader_roll_no: '25BEE012',
    sharing_type: 'Fourlets',
    max_cgpa: 7.78,
    required_capacity: 4,
    is_locked: false,
    created_at: '2026-09-01T10:00:00Z',
  },
  // 2. Group of 3 (Year 3 Boys - Dhauladhar/Neelkanth Triplet)
  {
    group_id: 'grp-dbh-demo',
    group_code: 'LOBBY-DBH-02',
    leader_roll_no: '24BME039',
    sharing_type: 'Triplets',
    max_cgpa: 8.4,
    required_capacity: 3,
    is_locked: false,
    created_at: '2026-09-01T10:15:00Z',
  },
];

const initialGroupMembers: GroupMember[] = [
  // grp-hbh-demo (3 members currently accepted, 1 slot open)
  { member_id: 'm-1', group_id: 'grp-hbh-demo', roll_no: '25BEE012', status: 'accepted', joined_at: '2026-09-01T10:00:00Z' },
  { member_id: 'm-2', group_id: 'grp-hbh-demo', roll_no: '25BCH076', status: 'accepted', joined_at: '2026-09-01T10:05:00Z' },
  { member_id: 'm-3', group_id: 'grp-hbh-demo', roll_no: '25BEC027', status: 'accepted', joined_at: '2026-09-01T10:10:00Z' },

  // grp-dbh-demo (2 members accepted, 1 slot open)
  { member_id: 'm-4', group_id: 'grp-dbh-demo', roll_no: '24BME039', status: 'accepted', joined_at: '2026-09-01T10:15:00Z' },
  { member_id: 'm-5', group_id: 'grp-dbh-demo', roll_no: '24BCS048', status: 'accepted', joined_at: '2026-09-01T10:20:00Z' },
];

const initialPreferences: Preference[] = [
  // Fourlet Preferences for Himadri
  { pref_id: 'p-1', group_id: 'grp-hbh-demo', preference_rank: 1, room_id: 'HBH-G-101' },
  { pref_id: 'p-2', group_id: 'grp-hbh-demo', preference_rank: 2, room_id: 'HBH-G-102' },
];

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
  },
];

// In-Memory Storage Container (Global across hot reloads in dev)
class MockDatabase {
  hostels: Hostel[] = [...initialHostels];
  rooms: Room[] = [...initialRooms];
  students: Student[] = [...initialStudents];
  groups: Group[] = [...initialGroups];
  groupMembers: GroupMember[] = [...initialGroupMembers];
  invites: GroupInvite[] = [...initialInvites];
  preferences: Preference[] = [...initialPreferences];
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
