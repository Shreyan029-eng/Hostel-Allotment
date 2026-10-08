export type Gender = 'Male' | 'Female' | 'Other';
export type RoomStatus = 'free' | 'locked' | 'occupied';
export type MemberStatus = 'pending' | 'accepted';
export type GateDirection = 'ENTRY' | 'EXIT';
export type AdminRole = 'super_admin' | 'warden' | 'security_officer';

// ==============================================================================
// 1. HOSTEL ALLOTMENT DATABASE TYPES
// ==============================================================================
export interface Student {
  roll_no: string; // Primary Key
  name: string;
  father_name?: string;
  email: string;
  gender: Gender;
  year: 2 | 3 | 4;
  cgpa: number;
  phone: string;
  guardian_contact: string;
  barcode_id: string; // Unique
  is_active: boolean;
  current_hostel?: string;
  created_at?: string;
}

export interface Hostel {
  hostel_id: string; // Primary Key
  name: string;
  gender_allowed: Gender | 'All';
  allowed_years: number[]; // e.g. [2], [2, 3], or [4]
  warden_id: string;
  warden_name: string;
  warden_phone: string;
  capacity: number;
  curfew_time: string; // e.g. "22:00:00"
}

export type SharingType = 'Twolets' | 'Triplets' | 'Fourlets';

export interface Room {
  room_id: string; // Primary Key e.g. "HBH-G-101"
  hostel_id: string;
  room_number: string;
  floor: number;
  floor_label?: string;
  capacity: number; // 2, 3, or 4
  sharing_type?: SharingType;
  status: RoomStatus;
  created_at?: string;
}

export interface Group {
  group_id: string; // UUID Primary Key
  group_code: string; // Unique invite code / Lobby ID e.g. "LOBBY-24B-01"
  leader_roll_no: string;
  sharing_type?: SharingType;
  max_cgpa: number;
  required_capacity: number;
  is_locked: boolean;
  created_at: string;
}

export interface GroupInvite {
  invite_id: string;
  group_id: string;
  from_roll_no: string;
  from_name: string;
  to_roll_no: string;
  to_name: string;
  sharing_type: SharingType;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface GroupMember {
  member_id: string;
  group_id: string;
  roll_no: string;
  status: MemberStatus;
  joined_at: string;
  student?: Student;
}

export interface Preference {
  pref_id: string;
  group_id: string;
  preference_rank: number;
  room_id: string;
  created_at?: string;
  room?: Room & { hostel?: Hostel };
}

export interface Allotment {
  allotment_id: string;
  roll_no: string;
  room_id: string;
  group_id?: string | null;
  round_number: number;
  academic_year: string;
  is_active: boolean;
  allotted_at: string;
  student?: Student;
  room?: Room & { hostel?: Hostel };
}

export interface HostelHistory {
  history_id: string;
  roll_no: string;
  old_hostel: string;
  old_room: string;
  year: string;
  archived_at: string;
}

export interface RoundConfig {
  round_number: number;
  academic_year: string;
  is_published: boolean;
  is_active: boolean;
  allotment_run_at?: string | null;
  published_at?: string | null;
  total_allotted_groups?: number;
  total_unallotted_groups?: number;
  next_release_time?: string | null;
  auto_release_interval_ms?: number;
  auto_release_enabled?: boolean;
  total_rounds?: number;
  final_round_active?: boolean;
  final_round_completed?: boolean;
  choice_filling_end_time?: string | null;
  choice_window_duration_ms?: number;
}

export interface OccupiedRoomDetail {
  room_id: string;
  room_number: string;
  floor: number;
  capacity: number;
  hostel_id: string;
  hostel_name: string;
  gender_allowed: string;
  round_number?: number;
  occupants: {
    roll_no: string;
    name: string;
    cgpa: number;
    round_number: number;
    gender: string;
  }[];
}

export interface AvailableRoomDetail {
  room_id: string;
  room_number: string;
  floor: number;
  capacity: number;
  hostel_id: string;
  hostel_name: string;
  gender_allowed: string;
  curfew_time?: string;
}

export interface RoomOccupancySummary {
  total_rooms: number;
  available_rooms: number;
  occupied_rooms: number;
  occupancy_rate: number;
  by_hostel: {
    hostel_id: string;
    hostel_name: string;
    total: number;
    available: number;
    occupied: number;
    gender_allowed: string;
    twolets_total?: number;
    twolets_available?: number;
    twolets_occupied?: number;
    triplets_total?: number;
    triplets_available?: number;
    triplets_occupied?: number;
    fourlets_total?: number;
    fourlets_available?: number;
    fourlets_occupied?: number;
  }[];
}

export interface RoomOccupancyReport {
  summary: RoomOccupancySummary;
  available_rooms: AvailableRoomDetail[];
  occupied_rooms: OccupiedRoomDetail[];
  is_published: boolean;
  round_number: number;
  published_at?: string | null;
  choice_filling_end_time?: string | null;
  next_release_time?: string | null;
}

export interface GroupDetails extends Group {
  leader: Student;
  members: (GroupMember & { student: Student })[];
  preferences: (Preference & { room: Room & { hostel: Hostel } })[];
}

export interface AllotmentResultDetails {
  allotment: Allotment;
  room: Room;
  hostel: Hostel;
  roommates: Student[];
}

// ==============================================================================
// 2. GATE ENTRY DATABASE TYPES (Dedicated Admin-Only Database)
// ==============================================================================
export interface GateStudentRecord {
  barcode_id: string; // Primary Key in Gate DB
  roll_no: string;
  name: string;
  gender: string;
  year: number;
  phone: string;
  guardian_contact: string;
  hostel_id?: string | null;
  hostel_name?: string | null;
  room_number?: string | null;
  warden_name?: string | null;
  warden_phone?: string | null;
  curfew_time: string;
  last_synced_at?: string;
}

export interface GateLog {
  log_id: string;
  barcode_id: string;
  roll_no: string;
  student_name: string;
  direction: GateDirection;
  timestamp: string;
  is_late: boolean;
  curfew_time: string;
  warden_alerted: boolean;
  warden_alert_details?: {
    warden_name: string;
    warden_phone: string;
    message: string;
    alert_time: string;
  } | null;
  hostel_name?: string | null;
  room_number?: string | null;
  scanned_by_admin?: string;
  remarks?: string;
  student?: Student;
}

// ==============================================================================
// 3. ADMIN & WARDEN AUTHENTICATION TYPES
// ==============================================================================
export interface AdminUser {
  admin_id: string;
  name: string;
  email: string;
  role: AdminRole;
  designation: string;
  assigned_hostel?: string | null;
}
