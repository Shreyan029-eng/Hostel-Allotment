import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { HostelRepository } from '../src/lib/db/repository';
import { mockDb, getStudentHostelPathway } from '../src/lib/db/mock-store';
import { gateDb } from '../src/lib/db/gate-db';
import { JosaaAllotmentEngine } from '../src/lib/engine/allotment-engine';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// --------------------------------------------------------------------------
// Public Portal Status (Round publication state for homepage & banners)
// --------------------------------------------------------------------------
app.get('/api/public/status', async (_req: Request, res: Response) => {
  try {
    const roundConfig = await HostelRepository.getRoundConfig(1);
    return res.json({
      success: true,
      is_published: Boolean(roundConfig.is_published),
      round_number: roundConfig.round_number,
      academic_year: roundConfig.academic_year,
      published_at: roundConfig.published_at,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Status error';
    return res.status(500).json({ success: false, error: message });
  }
});

// --------------------------------------------------------------------------
// Auth: Student
// --------------------------------------------------------------------------

// GET /api/auth/me
app.get('/api/auth/me', async (req: Request, res: Response) => {
  try {
    const studentRoll = req.cookies.student_session || req.cookies.student_roll;
    if (!studentRoll) {
      return res.json({ authenticated: false, student: null });
    }
    const student = await HostelRepository.getStudentByRoll(studentRoll);
    if (!student) {
      return res.json({ authenticated: false, student: null });
    }
    return res.json({ authenticated: true, student });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Auth verification error';
    return res.status(500).json({ authenticated: false, error: message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const identifier = req.body.email_or_roll || req.body.email || req.body.roll_no;
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please enter your NITH College Email or Roll Number',
      });
    }

    const student = await HostelRepository.getStudentByCollegeId(identifier);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: `No registered 2023 student record found for "${identifier}". Must be in format roll_number@nith.ac.in (e.g. 23bcs129@nith.ac.in) or roll number (e.g. 23bcs129).`,
      });
    }

    res.cookie('student_roll', student.roll_no, {
      path: '/',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    return res.json({
      success: true,
      message: `Welcome back, ${student.name}!`,
      student,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return res.status(500).json({ success: false, error: message });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('student_roll', { path: '/' });
  res.clearCookie('student_session', { path: '/' });
  return res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

// POST /api/auth/student/send-otp
app.post('/api/auth/student/send-otp', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;
    if (!identifier || typeof identifier !== 'string') {
      return res.status(400).json({ error: 'College email or roll number is required' });
    }

    const clean = identifier.trim().toLowerCase();
    const result = await HostelRepository.generateStudentOtp(clean);

    if (!result.success || !result.student) {
      return res.status(404).json({ error: result.error || 'Student not found in NITH records' });
    }

    // In dev / demo console, log OTP for verification:
    console.log(`[AUTH-OTP] Dispatched 6-digit OTP for ${result.student.roll_no} (${result.student.email}): ${result.otp}`);

    return res.json({
      success: true,
      message: `A 6-digit verification OTP has been dispatched to ${result.student.email}`,
      roll_no: result.student.roll_no,
      email: result.student.email,
      name: result.student.name,
      otp: result.otp, // Dev helper retained for seamless offline demo
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send OTP';
    return res.status(500).json({ error: message });
  }
});

// POST /api/auth/student/verify-otp
app.post('/api/auth/student/verify-otp', async (req: Request, res: Response) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({ error: 'Both identifier and 6-digit OTP are required' });
    }

    const result = await HostelRepository.verifyStudentOtp(identifier, otp);
    if (!result.success || !result.student) {
      return res.status(401).json({ error: result.error || 'Invalid or expired OTP' });
    }

    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res.cookie('student_session', result.student.roll_no, cookieOptions);
    res.cookie('student_roll', result.student.roll_no, cookieOptions);

    return res.json({
      success: true,
      message: 'Student authentication successful',
      student: result.student,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return res.status(500).json({ error: message });
  }
});

// --------------------------------------------------------------------------
// Auth: Admin / Warden
// --------------------------------------------------------------------------

// GET /api/auth/admin/me
app.get('/api/auth/admin/me', (req: Request, res: Response) => {
  try {
    const adminId = req.cookies.admin_session;
    if (!adminId) {
      return res.json({ authenticated: false, admin: null });
    }

    const admin = gateDb.getAdminById(adminId);
    if (!admin) {
      return res.json({ authenticated: false, admin: null });
    }

    return res.json({ authenticated: true, admin });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Admin auth error';
    return res.status(500).json({ authenticated: false, error: message });
  }
});

// POST /api/auth/admin/login
app.post('/api/auth/admin/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please enter your Admin/Warden official email',
      });
    }

    const admin = gateDb.authenticate(email, password || '');
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin credentials or unauthorized account',
      });
    }

    res.cookie('admin_session', admin.admin_id, {
      path: '/',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    return res.json({
      success: true,
      message: `Welcome, ${admin.name} (${admin.designation})`,
      admin,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Admin authentication failure';
    return res.status(500).json({ success: false, error: message });
  }
});

// POST /api/auth/admin/logout
app.post('/api/auth/admin/logout', (_req: Request, res: Response) => {
  res.clearCookie('admin_session', { path: '/' });
  return res.json({
    success: true,
    message: 'Admin session terminated successfully.',
  });
});

// --------------------------------------------------------------------------
// Admin Dashboard & Allotment Governance
// --------------------------------------------------------------------------

// GET /api/admin/data (Supports pagination: page, limit, offset, search, filter, tab, log_page, log_limit)
app.get('/api/admin/data', async (req: Request, res: Response) => {
  try {
    const students = await HostelRepository.getStudents();
    const hostels = await HostelRepository.getHostels();
    const rooms = await HostelRepository.getRooms();
    const allotments = await HostelRepository.getAllAllotments();
    const roundConfig = await HostelRepository.getRoundConfig(1);
    const gateLogs = await HostelRepository.getGateLogs();

    // High-performance index maps for O(1) lookup
    const studentMap = new Map(students.map((s) => [s.roll_no, s]));
    const roomMap = new Map(rooms.map((r) => [r.room_id, r]));
    const allotmentMap = new Map(allotments.map((a) => [a.roll_no, a]));

    const groups = mockDb.groups.map((g) => {
      const leader = studentMap.get(g.leader_roll_no);
      const members = mockDb.groupMembers
        .filter((m) => m.group_id === g.group_id)
        .map((m) => {
          const student = studentMap.get(m.roll_no);
          return { ...m, student };
        });
      const preferences = mockDb.preferences
        .filter((p) => p.group_id === g.group_id)
        .sort((a, b) => a.preference_rank - b.preference_rank)
        .map((p) => {
          const room = roomMap.get(p.room_id);
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

    const stats = {
      totalStudents: students.length,
      totalHostels: hostels.length,
      totalRooms,
      occupiedRooms,
      freeRooms,
      totalGroups: groups.length,
      lockedGroups: groups.filter((g) => g.is_locked).length,
      totalAllotments: allotments.length,
    };

    // Filter Students by query & allocation status
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const filter = typeof req.query.filter === 'string' ? req.query.filter.trim().toLowerCase() : 'all';

    let filteredStudents = students;
    if (search) {
      filteredStudents = filteredStudents.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.roll_no.toLowerCase().includes(search) ||
          (s.barcode_id && s.barcode_id.toLowerCase().includes(search)) ||
          (s.email && s.email.toLowerCase().includes(search))
      );
    }

    if (filter === 'allotted') {
      filteredStudents = filteredStudents.filter((s) => allotmentMap.has(s.roll_no));
    } else if (filter === 'unallotted') {
      filteredStudents = filteredStudents.filter((s) => !allotmentMap.has(s.roll_no));
    }

    const totalFiltered = filteredStudents.length;

    // Handle limits and offsets
    const isAll = req.query.limit === 'all' || req.query.all === 'true';
    const rawLimit = req.query.limit ? parseInt(req.query.limit as string) : 25;
    const limit = isAll ? totalFiltered : Math.max(1, Math.min(250, isNaN(rawLimit) ? 25 : rawLimit));
    const rawPage = req.query.page ? parseInt(req.query.page as string) : 1;
    const page = isAll ? 1 : Math.max(1, isNaN(rawPage) ? 1 : rawPage);
    const offset =
      req.query.offset !== undefined
        ? Math.max(0, parseInt(req.query.offset as string) || 0)
        : (page - 1) * limit;

    const paginatedStudents = isAll ? filteredStudents : filteredStudents.slice(offset, offset + limit);
    const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalFiltered / limit));

    const pagination = {
      page,
      limit,
      offset,
      total: totalFiltered,
      totalStudents: students.length,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      isAll,
    };

    // Paginate Gate Movement Logs
    const logPage = Math.max(1, parseInt(req.query.log_page as string) || 1);
    const rawLogLimit = req.query.log_limit ? parseInt(req.query.log_limit as string) : 25;
    const isLogsAll = req.query.log_limit === 'all';
    const logLimit = isLogsAll ? gateLogs.length : Math.max(1, Math.min(100, isNaN(rawLogLimit) ? 25 : rawLogLimit));
    const logOffset = (logPage - 1) * logLimit;
    const paginatedGateLogs = isLogsAll ? gateLogs : gateLogs.slice(logOffset, logOffset + logLimit);
    const totalLogPages = isLogsAll ? 1 : Math.max(1, Math.ceil(gateLogs.length / logLimit));

    const gateLogsPagination = {
      page: logPage,
      limit: logLimit,
      offset: logOffset,
      total: gateLogs.length,
      totalPages: totalLogPages,
      hasNext: logPage < totalLogPages,
      hasPrev: logPage > 1,
      isAll: isLogsAll,
    };

    return res.json({
      stats,
      students: paginatedStudents,
      pagination,
      hostels,
      rooms,
      groups,
      allotments,
      roundConfig,
      gateLogs: paginatedGateLogs,
      gateLogsPagination,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching admin data';
    return res.status(500).json({ error: message });
  }
});

// DELETE /api/admin/data
app.delete('/api/admin/data', (_req: Request, res: Response) => {
  mockDb.reset();
  return res.json({ success: true, message: 'Database reset to initial seed state.' });
});

// POST /api/admin/publish
app.post('/api/admin/publish', async (req: Request, res: Response) => {
  try {
    const roundNumber = req.body.round_number || 1;
    const isPublished = Boolean(req.body.is_published);

    const config = await HostelRepository.setRoundPublishStatus(roundNumber, isPublished);
    return res.json({
      success: true,
      message: isPublished
        ? `Round ${roundNumber} results are now PUBLISHED and visible to students!`
        : `Round ${roundNumber} results have been UNPUBLISHED and hidden from students.`,
      config,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Publish toggle error';
    return res.status(500).json({ success: false, error: message });
  }
});

// POST /api/admin/run-allotment
app.post('/api/admin/run-allotment', async (req: Request, res: Response) => {
  try {
    const roundNumber = req.body.round_number || 1;
    const academicYear = req.body.academic_year || '2026-2027';

    const result = await JosaaAllotmentEngine.runBatchAllotment(roundNumber, academicYear);
    return res.json({
      success: true,
      message: `Batch JOSAA Allotment for Round ${roundNumber} completed successfully.`,
      result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown allotment engine error';
    return res.status(500).json({ success: false, error: message });
  }
});

// GET /api/admin/export
app.get('/api/admin/export', async (req: Request, res: Response) => {
  try {
    const filter = (req.query.filter as string) || 'all';
    const students = await HostelRepository.getStudents();
    const allotments = await HostelRepository.getAllAllotments();

    const allotmentMap = new Map<string, (typeof allotments)[0]>();
    allotments.forEach((a) => allotmentMap.set(a.roll_no, a));

    let filteredStudents = students;
    if (filter === 'allotted') {
      filteredStudents = students.filter((s) => allotmentMap.has(s.roll_no));
    } else if (filter === 'unallotted') {
      filteredStudents = students.filter((s) => !allotmentMap.has(s.roll_no));
    }

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
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="josaa_hostel_allotments_${filter}_${Date.now()}.csv"`
    );
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// --------------------------------------------------------------------------
// Student Portal Data & Pathway
// --------------------------------------------------------------------------

// GET /api/student/me
app.get('/api/student/me', async (req: Request, res: Response) => {
  try {
    let rollNo = req.query.roll_no as string;
    if (!rollNo) {
      rollNo = req.cookies.student_session || req.cookies.student_roll;
    }

    if (!rollNo) {
      return res.status(400).json({ error: 'roll_no parameter or active session is required' });
    }

    const student = await HostelRepository.getStudentByRoll(rollNo);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const allHostels = await HostelRepository.getHostels();
    const pathway = getStudentHostelPathway(student, allHostels);

    const allowedHostels = pathway.nextHostels;
    const allowedHostelIds = allowedHostels.map((h) => h.hostel_id);
    const availableRooms = await HostelRepository.getRooms(allowedHostelIds);
    const groupDetails = await HostelRepository.getGroupByRollNo(student.roll_no);
    const incomingInvites = await HostelRepository.getStudentInvites(student.roll_no);
    const roundConfig = await HostelRepository.getRoundConfig(1);
    const allotment = await HostelRepository.getStudentAllotment(student.roll_no, false);

    return res.json({
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
    return res.status(500).json({ error: message });
  }
});

// --------------------------------------------------------------------------
// Gate Security Scanner
// --------------------------------------------------------------------------

// GET /api/student/:barcode_id
app.get('/api/student/:barcode_id', (req: Request, res: Response) => {
  try {
    const rawBarcode = req.params.barcode_id;
    const barcode_id = Array.isArray(rawBarcode) ? rawBarcode[0] : rawBarcode;
    const direction = ((req.query.direction as string)?.toUpperCase() === 'EXIT' ? 'EXIT' : 'ENTRY') as
      | 'ENTRY'
      | 'EXIT';

    const adminSession = req.cookies.admin_session;
    const authHeader = req.headers.authorization;

    if (!adminSession && authHeader !== 'Bearer gate-terminal-token') {
      return res.status(403).json({
        error: 'Forbidden: The Gate Entry system is restricted to authenticated Administrators and Wardens only.',
        code: 'ADMIN_ACCESS_REQUIRED',
      });
    }

    if (!barcode_id) {
      return res.status(400).json({ error: 'Missing barcode_id parameter' });
    }

    const scanResult = gateDb.scan(barcode_id, direction, adminSession);
    if (!scanResult.success || !scanResult.studentRecord) {
      return res.status(404).json({
        status: 'NOT_FOUND',
        barcode_id,
        message: scanResult.error || 'Student not found in registry',
        timestamp: new Date().toISOString(),
      });
    }

    const { studentRecord, is_late, curfew_time, warden_alert } = scanResult;

    const responsePayload = {
      status: is_late ? 'LATE_ENTRY_ALERT' : 'AUTHORIZED',
      barcode_id,
      timestamp: new Date().toISOString(),
      direction,
      student: {
        roll_no: studentRecord.roll_no,
        name: studentRecord.name,
        gender: studentRecord.gender,
        year: studentRecord.year,
        phone: studentRecord.phone,
        guardian_contact: studentRecord.guardian_contact,
      },
      current_allotment: studentRecord.hostel_name
        ? {
            hostel_name: studentRecord.hostel_name,
            room_number: studentRecord.room_number,
            warden_name: studentRecord.warden_name,
            warden_phone: studentRecord.warden_phone,
            curfew_time,
          }
        : null,
      flags: {
        is_late,
        curfew_time,
        warden_alerted: Boolean(warden_alert),
        alert_details: warden_alert || null,
      },
    };

    res.setHeader('X-Gate-Status', is_late ? 'CURFEW_VIOLATION' : 'CLEAR');
    res.setHeader('X-Gate-Database', 'NITH_GATE_ENTRY_DB');
    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error('Error processing gate scan:', error);
    return res.status(500).json({ error: 'Internal gate scanner service error' });
  }
});

// --------------------------------------------------------------------------
// Roommate Groupings & Preferences
// --------------------------------------------------------------------------

// POST /api/group/create
app.post('/api/group/create', async (req: Request, res: Response) => {
  try {
    const { leader_roll_no, required_capacity, sharing_type } = req.body;
    if (!leader_roll_no) {
      return res.status(400).json({ success: false, error: 'leader_roll_no is required' });
    }

    const sharing: 'Triplets' | 'Fourlets' =
      sharing_type === 'Triplets' || required_capacity === 3 ? 'Triplets' : 'Fourlets';

    const result = await HostelRepository.createLobby(leader_roll_no, sharing);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.json({
      success: true,
      message: `Room lobby created successfully! You can now invite roommates to your ${sharing} room.`,
      group: result.group,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create room lobby';
    return res.status(500).json({ success: false, error: message });
  }
});

// POST /api/group/join
app.post('/api/group/join', async (req: Request, res: Response) => {
  try {
    const { group_code, roll_no } = req.body;
    if (!group_code || !roll_no) {
      return res.status(400).json({ success: false, error: 'group_code and roll_no are required' });
    }

    const result = await HostelRepository.joinGroupByCode(group_code.trim(), roll_no.trim());
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.json({
      success: true,
      message: 'Successfully joined group! Group priority max_cgpa updated.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to join group';
    return res.status(500).json({ success: false, error: message });
  }
});

// POST /api/group/leave
app.post('/api/group/leave', async (req: Request, res: Response) => {
  try {
    const { rollNo } = req.body;
    if (!rollNo) {
      return res.status(400).json({ error: 'rollNo is required' });
    }

    const result = await HostelRepository.leaveOrDisbandGroup(rollNo);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({ success: true, message: 'Successfully updated group status' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to leave group';
    return res.status(500).json({ error: message });
  }
});

// POST /api/group/invite
app.post('/api/group/invite', async (req: Request, res: Response) => {
  try {
    const { groupId, fromRollNo, toRollNo } = req.body;
    if (!groupId || !fromRollNo || !toRollNo) {
      return res.status(400).json({
        error: 'groupId, fromRollNo, and toRollNo are required',
      });
    }

    const result = await HostelRepository.sendInvite(groupId, fromRollNo, toRollNo);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({ success: true, invite: result.invite });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send invite';
    return res.status(500).json({ error: message });
  }
});

// GET /api/group/invites
app.get('/api/group/invites', async (req: Request, res: Response) => {
  try {
    let rollNo = req.query.roll_no as string;
    if (!rollNo) {
      rollNo = req.cookies.student_session || req.cookies.student_roll;
    }

    if (!rollNo) {
      return res.status(400).json({ error: 'roll_no parameter is required' });
    }

    const invites = await HostelRepository.getStudentInvites(rollNo);
    return res.json({ success: true, invites });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch invites';
    return res.status(500).json({ error: message });
  }
});

// POST /api/group/invite/respond
app.post('/api/group/invite/respond', async (req: Request, res: Response) => {
  try {
    const { inviteId, studentRoll, action } = req.body;
    if (!inviteId || !studentRoll || !action) {
      return res.status(400).json({
        error: 'inviteId, studentRoll, and action ("accept" | "decline") are required',
      });
    }

    if (action !== 'accept' && action !== 'decline') {
      return res.status(400).json({ error: 'Action must be "accept" or "decline"' });
    }

    const result = await HostelRepository.respondInvite(inviteId, studentRoll, action);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({ success: true, message: `Invite successfully ${action}ed` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to respond to invite';
    return res.status(500).json({ error: message });
  }
});

// GET /api/group/peers (Supports limits, offsets, searching, and pagination)
app.get('/api/group/peers', async (req: Request, res: Response) => {
  try {
    let rollNo = req.query.roll_no as string;
    if (!rollNo) {
      rollNo = req.cookies.student_session || req.cookies.student_roll;
    }

    if (!rollNo) {
      return res.status(400).json({ error: 'roll_no parameter is required' });
    }

    let peers = await HostelRepository.getEligiblePeers(rollNo);

    // Optional Search Filter
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    if (search) {
      peers = peers.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.roll_no.toLowerCase().includes(search) ||
          p.email.toLowerCase().includes(search)
      );
    }

    const total = peers.length;
    const isAll = req.query.limit === 'all' || !req.query.limit;

    if (isAll) {
      return res.json({ success: true, peers, total });
    }

    const rawLimit = parseInt(req.query.limit as string);
    const limit = Math.max(1, Math.min(100, isNaN(rawLimit) ? 20 : rawLimit));
    const rawPage = parseInt(req.query.page as string);
    const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
    const offset =
      req.query.offset !== undefined
        ? Math.max(0, parseInt(req.query.offset as string) || 0)
        : (page - 1) * limit;

    const paginatedPeers = peers.slice(offset, offset + limit);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.json({
      success: true,
      peers: paginatedPeers,
      pagination: {
        page,
        limit,
        offset,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch eligible peers';
    return res.status(500).json({ error: message });
  }
});

// POST /api/group/preferences
app.post('/api/group/preferences', async (req: Request, res: Response) => {
  try {
    const { group_id, leader_roll_no, room_ids } = req.body;
    if (!group_id || !leader_roll_no || !Array.isArray(room_ids)) {
      return res.status(400).json({
        success: false,
        error: 'group_id, leader_roll_no, and room_ids array are required',
      });
    }

    const result = await HostelRepository.submitAndLockPreferences(group_id, leader_roll_no, room_ids);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.json({
      success: true,
      message: 'Preferences submitted and locked successfully on behalf of the group!',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to submit preferences';
    return res.status(500).json({ success: false, error: message });
  }
});

app.listen(PORT, () => {
  console.log(`HostelMatrix API server running on http://localhost:${PORT}`);
});
