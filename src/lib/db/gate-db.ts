import { GateLog, GateStudentRecord, AdminUser, GateDirection } from './types';
import { mockDb } from './mock-store';

// Default Authorized Admins & Wardens
export const INITIAL_ADMINS: (AdminUser & { password: string })[] = [
  {
    admin_id: 'ADMIN-CHIEF',
    name: 'Prof. Anup Kumar',
    email: 'admin@nith.ac.in',
    password: 'admin',
    role: 'super_admin',
    designation: 'Chief Warden & Dean of Student Affairs',
    assigned_hostel: null,
  },
  {
    admin_id: 'WARDEN-01',
    name: 'Dr. Ramesh Sharma',
    email: 'warden.kailash@nith.ac.in',
    password: 'warden',
    role: 'warden',
    designation: 'Warden, Kailash Boys Hostel (BH-1)',
    assigned_hostel: 'BH-1',
  },
  {
    admin_id: 'WARDEN-02',
    name: 'Prof. Arvind Kumar',
    email: 'warden.himadri@nith.ac.in',
    password: 'warden',
    role: 'warden',
    designation: 'Warden, Himadri Boys Hostel (BH-2)',
    assigned_hostel: 'BH-2',
  },
  {
    admin_id: 'WARDEN-04',
    name: 'Dr. Sunita Rao',
    email: 'warden.parvati@nith.ac.in',
    password: 'warden',
    role: 'warden',
    designation: 'Warden, Parvati Girls Hostel (GH-1)',
    assigned_hostel: 'GH-1',
  },
  {
    admin_id: 'SEC-MAIN',
    name: 'Inspector Vikram Rathore',
    email: 'security@nith.ac.in',
    password: 'security',
    role: 'security_officer',
    designation: 'Chief Security Officer (Main Gate)',
    assigned_hostel: null,
  },
];

class GateDatabaseStore {
  admins: (AdminUser & { password: string })[] = [...INITIAL_ADMINS];
  gateLogs: GateLog[] = [];

  // Authenticate Admin
  authenticate(email: string, pass: string): AdminUser | null {
    const cleanEmail = email.trim().toLowerCase();
    const admin = this.admins.find((a) => a.email.toLowerCase() === cleanEmail);
    if (!admin) return null;
    // For demo convenience, accepts the set password or blank/master pass
    if (admin.password && pass && admin.password !== pass) {
      return null;
    }
    const { password, ...safeAdmin } = admin;
    return safeAdmin;
  }

  getAdminById(adminId: string): AdminUser | null {
    const admin = this.admins.find((a) => a.admin_id === adminId);
    if (!admin) return null;
    const { password, ...safeAdmin } = admin;
    return safeAdmin;
  }

  // Scan Barcode (Admin Only)
  scan(barcodeId: string, direction: GateDirection = 'ENTRY', adminId?: string): {
    success: boolean;
    studentRecord?: GateStudentRecord;
    is_late: boolean;
    curfew_time: string;
    warden_alert?: {
      warden_name: string;
      warden_phone: string;
      message: string;
      alert_time: string;
    } | null;
    error?: string;
  } {
    // Look up student from Allotment Database
    const student = mockDb.students.find((s) => s.barcode_id === barcodeId);
    if (!student) {
      return {
        success: false,
        is_late: false,
        curfew_time: '22:00:00',
        error: `Barcode ${barcodeId} not found in NITH Registry`,
      };
    }

    // Check active allotment
    const activeAllotment = mockDb.allotments.find((a) => a.roll_no === student.roll_no && a.is_active);
    const room = activeAllotment ? mockDb.rooms.find((r) => r.room_id === activeAllotment.room_id) : null;
    const hostel = room ? mockDb.hostels.find((h) => h.hostel_id === room.hostel_id) : null;

    const curfewTime = hostel?.curfew_time || '22:00:00';

    const now = new Date();
    const [curfewHour, curfewMin] = curfewTime.split(':').map(Number);
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    const isLate =
      direction === 'ENTRY' &&
      (currentHour > curfewHour || (currentHour === curfewHour && currentMin > curfewMin));

    let wardenAlert = null;
    if (isLate && hostel) {
      wardenAlert = {
        warden_name: hostel.warden_name,
        warden_phone: hostel.warden_phone,
        alert_time: now.toISOString(),
        message: `[SECURITY ALERT] Student ${student.name} (${student.roll_no}) arrived late at ${now.toLocaleTimeString()} to Room ${room?.room_number}, ${hostel.name}. Curfew was ${curfewTime}. Guardian: ${student.guardian_contact}`,
      };
    }

    const gateLog: GateLog = {
      log_id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      barcode_id: barcodeId,
      roll_no: student.roll_no,
      student_name: student.name,
      direction,
      timestamp: now.toISOString(),
      is_late: isLate,
      curfew_time: curfewTime,
      warden_alerted: Boolean(wardenAlert),
      warden_alert_details: wardenAlert,
      hostel_name: hostel?.name || null,
      room_number: room?.room_number || null,
      scanned_by_admin: adminId || 'MAIN_GATE_TERMINAL',
      remarks: isLate ? 'Curfew breach detected. Warden notified.' : 'Authorized entry on time.',
      student,
    };

    this.gateLogs.unshift(gateLog);

    const studentRecord: GateStudentRecord = {
      barcode_id: student.barcode_id,
      roll_no: student.roll_no,
      name: student.name,
      gender: student.gender,
      year: student.year,
      phone: student.phone,
      guardian_contact: student.guardian_contact,
      hostel_id: hostel?.hostel_id || null,
      hostel_name: hostel?.name || null,
      room_number: room?.room_number || null,
      warden_name: hostel?.warden_name || null,
      warden_phone: hostel?.warden_phone || null,
      curfew_time: curfewTime,
      last_synced_at: now.toISOString(),
    };

    return {
      success: true,
      studentRecord,
      is_late: isLate,
      curfew_time: curfewTime,
      warden_alert: wardenAlert,
    };
  }

  getLogs(): GateLog[] {
    return this.gateLogs;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __gateDbInstance: GateDatabaseStore | undefined;
}

if (!global.__gateDbInstance) {
  global.__gateDbInstance = new GateDatabaseStore();
}

export const gateDb = global.__gateDbInstance;
