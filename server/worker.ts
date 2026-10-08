import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { HostelRepository } from '../src/lib/db/repository';
import { mockDb, getStudentHostelPathway } from '../src/lib/db/mock-store';
import { gateDb } from '../src/lib/db/gate-db';
import { JosaaAllotmentEngine } from '../src/lib/engine/allotment-engine';
import { createAdminClient } from '../src/lib/supabase/admin';
import { Room, Hostel, SharingType } from '../src/lib/db/types';

const STUDENT_EMAIL_REGEX = /^[0-9]{2}[a-z]{2,4}[0-9]{2,4}@\.?nith\.ac\.in$/i;
const ADMIN_EMAIL_REGEX = /@\.?nith\.ac\.in$/i;

const app = new Hono();

app.use(
  '*',
  cors({
    origin: (origin) => origin || '*',
    credentials: true,
  })
);

// Helper for auto-advancing rounds
async function checkAutoAdvanceRound() {
  try {
    const config = mockDb.roundsConfig[0];
    if (!config || !config.is_published) return;

    if (config.choice_filling_end_time) {
      const choiceEndTime = new Date(config.choice_filling_end_time).getTime();
      if (Date.now() >= choiceEndTime) {
        const allottedGroupIds = new Set(
          mockDb.allotments.filter((a) => a.is_active).map((a) => a.group_id).filter(Boolean)
        );
        for (const g of mockDb.groups) {
          if (!allottedGroupIds.has(g.group_id)) {
            const hasPrefs = mockDb.preferences.some((p) => p.group_id === g.group_id);
            if (hasPrefs) {
              g.is_locked = true;
            }
          }
        }
      }
    }

    if (!config.auto_release_enabled || !config.next_release_time) return;

    const releaseTime = new Date(config.next_release_time).getTime();
    if (Date.now() >= releaseTime) {
      if (config.round_number < 5) {
        await JosaaAllotmentEngine.advanceToNextRound(config.academic_year);
      } else if (config.round_number === 5 && !config.final_round_active && !config.final_round_completed) {
        config.final_round_active = true;
        config.next_release_time = null;
      }
    }
  } catch (err) {
    console.error('[AUTO-RELEASE] Round auto-advance check error:', err);
  }
}

// --------------------------------------------------------------------------
// Public Portal Status
// --------------------------------------------------------------------------
app.get('/api/public/status', async (c) => {
  try {
    await checkAutoAdvanceRound();
    const roundConfig = await HostelRepository.getRoundConfig(1);
    const roomReport = await HostelRepository.getRoomOccupancyReport();

    return c.json({
      success: true,
      is_published: Boolean(roundConfig.is_published),
      round_number: roundConfig.round_number,
      total_rounds: roundConfig.total_rounds || 5,
      academic_year: roundConfig.academic_year,
      published_at: roundConfig.published_at,
      choice_filling_end_time: roundConfig.choice_filling_end_time,
      choice_window_duration_ms: roundConfig.choice_window_duration_ms,
      next_release_time: roundConfig.next_release_time,
      auto_release_enabled: Boolean(roundConfig.auto_release_enabled),
      final_round_active: Boolean(roundConfig.final_round_active),
      final_round_completed: Boolean(roundConfig.final_round_completed),
      room_summary: roomReport.summary,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Status error';
    return c.json({ success: false, error: message }, 500);
  }
});

app.get('/api/public/room-occupancy', async (c) => {
  try {
    await checkAutoAdvanceRound();
    const report = await HostelRepository.getRoomOccupancyReport();
    return c.json({
      success: true,
      ...report,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching room occupancy';
    return c.json({ success: false, error: message }, 500);
  }
});

// --------------------------------------------------------------------------
// Auth: Student
// --------------------------------------------------------------------------
app.get('/api/auth/me', async (c) => {
  try {
    let studentRoll = getCookie(c, 'student_session') || getCookie(c, 'student_roll');

    const authHeader = c.req.header('authorization');
    if (!studentRoll && authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const adminClient = createAdminClient();
      if (adminClient) {
        const { data } = await adminClient.auth.getUser(token);
        if (data?.user?.email && STUDENT_EMAIL_REGEX.test(data.user.email)) {
          const student = await HostelRepository.getStudentByCollegeId(data.user.email);
          if (student) {
            return c.json({ authenticated: true, student });
          }
        }
      }
    }

    if (!studentRoll) {
      return c.json({ authenticated: false, student: null });
    }
    const student = await HostelRepository.getStudentByRoll(studentRoll);
    if (!student) {
      return c.json({ authenticated: false, student: null });
    }
    return c.json({ authenticated: true, student });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Auth verification error';
    return c.json({ authenticated: false, error: message }, 500);
  }
});

app.post('/api/auth/google-session', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { email, access_token } = body as { email?: string; access_token?: string };
    if (!email || typeof email !== 'string') {
      return c.json({ success: false, error: 'Email is required' }, 400);
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!STUDENT_EMAIL_REGEX.test(cleanEmail)) {
      return c.json(
        {
          success: false,
          error: 'Access denied: Student email must be in the format roll_number@nith.ac.in',
        },
        403
      );
    }

    if (access_token) {
      const adminClient = createAdminClient();
      if (adminClient) {
        const { data: userData } = await adminClient.auth.getUser(access_token);
        if (userData?.user?.email) {
          const verifiedEmail = userData.user.email.toLowerCase();
          if (!STUDENT_EMAIL_REGEX.test(verifiedEmail)) {
            return c.json(
              {
                success: false,
                error: 'Access denied: Student email must be in the format roll_number@nith.ac.in',
              },
              403
            );
          }
        }
      }
    }

    let student = await HostelRepository.getStudentByCollegeId(cleanEmail);

    if (!student) {
      const rollMatch = cleanEmail.match(/^([0-9]{2})([a-z]{2,4})([0-9]{2,4})/i);
      if (rollMatch) {
        const batchYear = parseInt(rollMatch[1], 10);
        const rollNo = `${rollMatch[1]}${rollMatch[2]}${rollMatch[3]}`.toUpperCase();
        const year: 2 | 3 | 4 = batchYear === 25 ? 2 : batchYear === 24 ? 3 : batchYear === 23 ? 4 : 2;
        const newStudent = {
          roll_no: rollNo,
          name: rollNo,
          email: cleanEmail,
          gender: 'Male' as const,
          year,
          cgpa: 8.0,
          phone: '',
          guardian_contact: '',
          barcode_id: `BARCODE-${rollNo}`,
          is_active: true,
        };

        const adminClient = createAdminClient();
        if (adminClient) {
          await adminClient.from('students').upsert(newStudent);
        }
        mockDb.students.push(newStudent);
        student = newStudent;
      }
    }

    if (!student) {
      return c.json(
        {
          success: false,
          error: 'Access denied: Student record not found. Expected format: roll_number@nith.ac.in',
        },
        404
      );
    }

    const cookieOptions = {
      httpOnly: true,
      sameSite: 'Lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    };

    setCookie(c, 'student_session', student.roll_no, cookieOptions);
    setCookie(c, 'student_roll', student.roll_no, cookieOptions);

    return c.json({
      success: true,
      message: `Welcome back, ${student.name}!`,
      student,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Google session failed';
    return c.json({ success: false, error: message }, 500);
  }
});

app.post('/api/auth/google-admin-session', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { email, access_token } = body as { email?: string; access_token?: string };
    if (!email || typeof email !== 'string') {
      return c.json({ success: false, error: 'Email is required' }, 400);
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!ADMIN_EMAIL_REGEX.test(cleanEmail)) {
      return c.json(
        {
          success: false,
          error: 'Access denied: Admin email must end with @nith.ac.in',
        },
        403
      );
    }

    if (access_token) {
      const adminClient = createAdminClient();
      if (adminClient) {
        const { data: userData } = await adminClient.auth.getUser(access_token);
        if (userData?.user?.email) {
          const verifiedEmail = userData.user.email.toLowerCase();
          if (!ADMIN_EMAIL_REGEX.test(verifiedEmail)) {
            return c.json(
              {
                success: false,
                error: 'Access denied: Admin email must end with @nith.ac.in',
              },
              403
            );
          }
        }
      }
    }

    let admin = gateDb.admins.find((a) => a.email.toLowerCase() === cleanEmail);

    if (!admin) {
      const adminClient = createAdminClient();
      if (adminClient) {
        const { data } = await adminClient
          .from('gate_admins')
          .select('*')
          .ilike('email', cleanEmail)
          .single();
        if (data) {
          admin = data;
        }
      }
    }

    if (!admin) {
      const adminId = `ADMIN-${Date.now().toString(36).toUpperCase()}`;
      const prefix = cleanEmail.split('@')[0];
      const isSecurity = prefix.includes('security');
      const isMasterAdmin = cleanEmail === 'iste@nith.ac.in' || prefix === 'iste';
      const role = isMasterAdmin ? 'super_admin' : isSecurity ? 'security_officer' : 'warden';
      const formattedName = isMasterAdmin
        ? 'ISTE NITH Master Administrator'
        : prefix
            .split(/[._]/)
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join(' ');

      const newAdmin = {
        admin_id: adminId,
        name: formattedName || 'Institute Administrator',
        email: cleanEmail,
        role: role as 'super_admin' | 'warden' | 'security_officer',
        designation: isMasterAdmin
          ? 'Master Central Administrator (Allotment & Gate)'
          : isSecurity
          ? 'Campus Security Officer'
          : 'Hostel Warden',
        assigned_hostel: isMasterAdmin || isSecurity ? null : 'HBH',
        password: '',
      };

      gateDb.admins.push(newAdmin);
      const adminClient = createAdminClient();
      if (adminClient) {
        await adminClient.from('gate_admins').insert({
          admin_id: newAdmin.admin_id,
          name: newAdmin.name,
          email: newAdmin.email,
          password_hash: 'google_oauth',
          role: newAdmin.role,
          designation: newAdmin.designation,
          assigned_hostel: newAdmin.assigned_hostel,
          is_active: true,
        });
      }
      admin = newAdmin;
    }

    const { password, ...safeAdmin } = admin as any;

    const cookieOptions = {
      httpOnly: true,
      sameSite: 'Lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    };

    setCookie(c, 'admin_session', safeAdmin.admin_id, cookieOptions);

    return c.json({
      success: true,
      message: `Welcome, ${safeAdmin.name}!`,
      admin: safeAdmin,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Google admin session failed';
    return c.json({ success: false, error: message }, 500);
  }
});

app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const identifier = (body as any).email_or_roll || (body as any).email || (body as any).roll_no;
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return c.json(
        {
          success: false,
          error: 'Please enter your NITH College Email or Roll Number',
        },
        400
      );
    }

    const student = await HostelRepository.getStudentByCollegeId(identifier);
    if (!student) {
      return c.json(
        {
          success: false,
          error: `No registered student record found for "${identifier}".`,
        },
        404
      );
    }

    setCookie(c, 'student_roll', student.roll_no, {
      path: '/',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'Lax',
    });

    return c.json({
      success: true,
      message: `Welcome back, ${student.name}!`,
      student,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return c.json({ success: false, error: message }, 500);
  }
});

app.post('/api/auth/logout', (c) => {
  deleteCookie(c, 'student_roll', { path: '/' });
  deleteCookie(c, 'student_session', { path: '/' });
  return c.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

app.post('/api/auth/student/send-otp', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { identifier } = body as { identifier?: string };
    if (!identifier || typeof identifier !== 'string') {
      return c.json({ error: 'College email or roll number is required' }, 400);
    }

    const clean = identifier.trim().toLowerCase();
    const result = await HostelRepository.generateStudentOtp(clean);

    if (!result.success || !result.student) {
      return c.json({ error: result.error || 'Student not found in NITH records' }, 404);
    }

    return c.json({
      success: true,
      message: `A 6-digit verification OTP has been dispatched to ${result.student.email}`,
      roll_no: result.student.roll_no,
      email: result.student.email,
      name: result.student.name,
      otp: result.otp,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send OTP';
    return c.json({ error: message }, 500);
  }
});

app.post('/api/auth/student/verify-otp', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { identifier, otp } = body as { identifier?: string; otp?: string };
    if (!identifier || !otp) {
      return c.json({ error: 'Both identifier and 6-digit OTP are required' }, 400);
    }

    const result = await HostelRepository.verifyStudentOtp(identifier, otp);
    if (!result.success || !result.student) {
      return c.json({ error: result.error || 'Invalid or expired OTP' }, 401);
    }

    const cookieOptions = {
      httpOnly: true,
      sameSite: 'Lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    };

    setCookie(c, 'student_session', result.student.roll_no, cookieOptions);
    setCookie(c, 'student_roll', result.student.roll_no, cookieOptions);

    return c.json({
      success: true,
      message: 'Student authentication successful',
      student: result.student,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return c.json({ error: message }, 500);
  }
});

app.get('/api/auth/admin/me', (c) => {
  try {
    const adminId = getCookie(c, 'admin_session');
    if (!adminId) {
      return c.json({ authenticated: false, admin: null });
    }

    const admin = gateDb.getAdminById(adminId);
    if (!admin) {
      return c.json({ authenticated: false, admin: null });
    }

    return c.json({ authenticated: true, admin });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Admin auth error';
    return c.json({ authenticated: false, error: message }, 500);
  }
});

app.post('/api/auth/admin/login', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { email, password } = body as { email?: string; password?: string };
    if (!email) {
      return c.json(
        {
          success: false,
          error: 'Please enter your Admin/Warden official email',
        },
        400
      );
    }

    if (email.trim().toLowerCase() === 'iste@nith.ac.in' || email.trim().toLowerCase().startsWith('iste@')) {
      return c.json(
        {
          success: false,
          error: 'Master Admin (ISTE) account requires Google OAuth authentication. Please use "Sign In with Google".',
        },
        403
      );
    }

    const admin = gateDb.authenticate(email, password || '');
    if (!admin) {
      return c.json(
        {
          success: false,
          error: 'Invalid admin credentials or unauthorized account',
        },
        401
      );
    }

    setCookie(c, 'admin_session', admin.admin_id, {
      path: '/',
      httpOnly: true,
      maxAge: 24 * 60 * 60,
      sameSite: 'Lax',
    });

    return c.json({
      success: true,
      message: `Welcome, ${admin.name} (${admin.designation})`,
      admin,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Admin authentication failure';
    return c.json({ success: false, error: message }, 500);
  }
});

app.post('/api/auth/admin/logout', (c) => {
  deleteCookie(c, 'admin_session', { path: '/' });
  return c.json({
    success: true,
    message: 'Admin session terminated successfully.',
  });
});

// --------------------------------------------------------------------------
// Admin Data & Management
// --------------------------------------------------------------------------
app.get('/api/admin/data', async (c) => {
  try {
    await checkAutoAdvanceRound();
    const students = await HostelRepository.getStudents();
    const hostels = await HostelRepository.getHostels();
    const rooms = await HostelRepository.getRooms();
    const allotments = await HostelRepository.getAllAllotments();
    const roundConfig = await HostelRepository.getRoundConfig(1);
    const gateLogs = await HostelRepository.getGateLogs();

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
    const occupiedRooms = rooms.filter((r) => r.status === 'locked' || r.status === 'occupied').length;
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

    const search = c.req.query('search')?.trim().toLowerCase() || '';
    const filter = c.req.query('filter')?.trim().toLowerCase() || 'all';

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
    const limitQuery = c.req.query('limit');
    const isAll = limitQuery === 'all' || c.req.query('all') === 'true';
    const rawLimit = limitQuery ? parseInt(limitQuery) : 25;
    const limit = isAll ? totalFiltered : Math.max(1, Math.min(250, isNaN(rawLimit) ? 25 : rawLimit));
    const rawPage = c.req.query('page') ? parseInt(c.req.query('page')!) : 1;
    const page = isAll ? 1 : Math.max(1, isNaN(rawPage) ? 1 : rawPage);
    const offsetQuery = c.req.query('offset');
    const offset = offsetQuery !== undefined ? Math.max(0, parseInt(offsetQuery) || 0) : (page - 1) * limit;

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

    const logPage = Math.max(1, parseInt(c.req.query('log_page') || '1') || 1);
    const logLimitQuery = c.req.query('log_limit');
    const isLogsAll = logLimitQuery === 'all';
    const rawLogLimit = logLimitQuery ? parseInt(logLimitQuery) : 25;
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

    return c.json({
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
    return c.json({ error: message }, 500);
  }
});

app.delete('/api/admin/data', (c) => {
  mockDb.reset();
  return c.json({ success: true, message: 'Database reset to initial seed state.' });
});

app.post('/api/admin/publish', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const roundNumber = (body as any).round_number || 1;
    const isPublished = Boolean((body as any).is_published);

    const config = await HostelRepository.setRoundPublishStatus(roundNumber, isPublished);
    return c.json({
      success: true,
      message: isPublished
        ? `Round ${roundNumber} results are now PUBLISHED and visible to students!`
        : `Round ${roundNumber} results have been UNPUBLISHED and hidden from students.`,
      config,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Publish toggle error';
    return c.json({ success: false, error: message }, 500);
  }
});

app.post('/api/admin/publish-next-round', async (c) => {
  try {
    const currentConfig = await HostelRepository.getRoundConfig(1);
    if (currentConfig.is_published && currentConfig.choice_filling_end_time) {
      const lockTime = new Date(currentConfig.choice_filling_end_time).getTime();
      if (Date.now() < lockTime) {
        const remainingSeconds = Math.ceil((lockTime - Date.now()) / 1000);
        const remainingMinutes = Math.ceil(remainingSeconds / 60);
        return c.json(
          {
            success: false,
            error: `Choice filling is currently active! Students have 30 minutes to modify or add choices. Early publishing locked for another ${remainingMinutes}m (${remainingSeconds}s remaining).`,
            remaining_seconds: remainingSeconds,
            choice_filling_end_time: currentConfig.choice_filling_end_time,
          },
          403
        );
      }
    }

    const body = await c.req.json().catch(() => ({}));
    const academicYear = (body as any).academic_year || '2026-2027';
    const result = await JosaaAllotmentEngine.advanceToNextRound(academicYear);
    const config = await HostelRepository.getRoundConfig(result.roundNumber);
    return c.json({
      success: true,
      message: `Round ${result.roundNumber === 6 ? 'FINAL (Spot Round)' : result.roundNumber} published successfully!`,
      config,
      result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error publishing next round';
    return c.json({ success: false, error: message }, 500);
  }
});

app.post('/api/admin/run-final-round', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const academicYear = (body as any).academic_year || '2026-2027';
    const result = await JosaaAllotmentEngine.runFinalRound(academicYear);
    const config = await HostelRepository.getRoundConfig(6);
    return c.json({
      success: true,
      message: 'Final Spot Round has been executed and published for all unallotted groups.',
      config,
      result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error executing final spot round';
    return c.json({ success: false, error: message }, 500);
  }
});

app.post('/api/admin/reset-rounds', (c) => {
  try {
    JosaaAllotmentEngine.resetAllRounds();
    return c.json({
      success: true,
      message: 'Allotment rounds and room occupancy have been reset to Round 1 (unpublished).',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Reset error';
    return c.json({ success: false, error: message }, 500);
  }
});

app.post('/api/admin/toggle-auto-release', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const config = await HostelRepository.getRoundConfig(1);
    if (typeof (body as any).enabled === 'boolean') {
      config.auto_release_enabled = (body as any).enabled;
    }
    if (typeof (body as any).interval_ms === 'number' && (body as any).interval_ms > 0) {
      config.auto_release_interval_ms = (body as any).interval_ms;
      if (config.is_published && config.round_number < 5 && config.auto_release_interval_ms) {
        config.next_release_time = new Date(Date.now() + config.auto_release_interval_ms).toISOString();
      }
    }
    return c.json({
      success: true,
      message: `Auto-release updated (Enabled: ${config.auto_release_enabled})`,
      config,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error configuring auto-release';
    return c.json({ success: false, error: message }, 500);
  }
});

app.post('/api/admin/run-allotment', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const roundNumber = (body as any).round_number || 1;
    const academicYear = (body as any).academic_year || '2026-2027';

    const result = await JosaaAllotmentEngine.runBatchAllotment(roundNumber, academicYear);
    return c.json({
      success: true,
      message: `Batch JOSAA Allotment for Round ${roundNumber} completed successfully.`,
      result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown allotment engine error';
    return c.json({ success: false, error: message }, 500);
  }
});

app.get('/api/admin/export', async (c) => {
  try {
    const filter = c.req.query('filter') || 'all';
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
    c.header('Content-Type', 'text/csv; charset=utf-8');
    c.header('Content-Disposition', `attachment; filename="josaa_hostel_allotments_${filter}_${Date.now()}.csv"`);
    return c.text(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    return c.json({ error: 'Failed to export CSV' }, 500);
  }
});

// --------------------------------------------------------------------------
// Student Portal
// --------------------------------------------------------------------------
app.get('/api/student/me', async (c) => {
  try {
    await checkAutoAdvanceRound();

    let rollNo = c.req.query('roll_no');
    if (!rollNo) {
      rollNo = getCookie(c, 'student_session') || getCookie(c, 'student_roll');
    }

    if (!rollNo) {
      return c.json({ error: 'roll_no parameter or active session is required' }, 400);
    }

    const student = await HostelRepository.getStudentByRoll(rollNo);
    if (!student) {
      return c.json({ error: 'Student not found' }, 404);
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

    const assignedRound = groupDetails ? JosaaAllotmentEngine.getGroupAssignedRound(groupDetails.group_id) : 1;
    let remainingRooms: (Room & { hostel: Hostel })[] = [];
    if (roundConfig.final_round_active) {
      remainingRooms = await HostelRepository.getRemainingRooms(
        allowedHostelIds,
        groupDetails?.required_capacity
      );
    }

    return c.json({
      student: {
        ...student,
        current_hostel: student.current_hostel || pathway.currentHostel,
      },
      pathway,
      allowedHostels,
      availableRooms,
      remainingRooms,
      groupDetails,
      incomingInvites,
      roundConfig,
      allotment,
      assignedRound,
      canFillFinalChoices: Boolean(roundConfig.final_round_active && !allotment && groupDetails),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching student data';
    return c.json({ error: message }, 500);
  }
});

// --------------------------------------------------------------------------
// Gate Security Scanner
// --------------------------------------------------------------------------
app.get('/api/student/:barcode_id', (c) => {
  try {
    const barcode_id = c.req.param('barcode_id');
    const direction = (c.req.query('direction')?.toUpperCase() === 'EXIT' ? 'EXIT' : 'ENTRY') as 'ENTRY' | 'EXIT';

    const adminSession = getCookie(c, 'admin_session');
    const authHeader = c.req.header('authorization');

    if (!adminSession && authHeader !== 'Bearer gate-terminal-token') {
      return c.json(
        {
          error: 'Forbidden: Gate Entry system is restricted to authenticated Administrators.',
          code: 'ADMIN_ACCESS_REQUIRED',
        },
        403
      );
    }

    if (!barcode_id) {
      return c.json({ error: 'Missing barcode_id parameter' }, 400);
    }

    const scanResult = gateDb.scan(barcode_id, direction, adminSession);
    if (!scanResult.success || !scanResult.studentRecord) {
      return c.json(
        {
          status: 'NOT_FOUND',
          barcode_id,
          message: scanResult.error || 'Student not found in registry',
          timestamp: new Date().toISOString(),
        },
        404
      );
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

    c.header('X-Gate-Status', is_late ? 'CURFEW_VIOLATION' : 'CLEAR');
    c.header('X-Gate-Database', 'NITH_GATE_ENTRY_DB');
    return c.json(responsePayload);
  } catch (error) {
    console.error('Error processing gate scan:', error);
    return c.json({ error: 'Internal gate scanner service error' }, 500);
  }
});

// --------------------------------------------------------------------------
// Roommate Groups & Preferences
// --------------------------------------------------------------------------
app.post('/api/group/create', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { leader_roll_no, required_capacity, sharing_type } = body as any;
    if (!leader_roll_no) {
      return c.json({ success: false, error: 'leader_roll_no is required' }, 400);
    }

    const sharing: SharingType =
      sharing_type === 'Twolets' || required_capacity === 2
        ? 'Twolets'
        : sharing_type === 'Triplets' || required_capacity === 3
        ? 'Triplets'
        : 'Fourlets';

    const result = await HostelRepository.createLobby(leader_roll_no, sharing);
    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({
      success: true,
      message: `Room lobby created successfully! You can now invite roommates to your ${sharing} room.`,
      group: result.group,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create room lobby';
    return c.json({ success: false, error: message }, 500);
  }
});

app.post('/api/group/join', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { group_code, roll_no } = body as any;
    if (!group_code || !roll_no) {
      return c.json({ success: false, error: 'group_code and roll_no are required' }, 400);
    }

    const result = await HostelRepository.joinGroupByCode(group_code.trim(), roll_no.trim());
    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({
      success: true,
      message: 'Successfully joined group! Group priority max_cgpa updated.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to join group';
    return c.json({ success: false, error: message }, 500);
  }
});

app.post('/api/group/leave', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { rollNo } = body as any;
    if (!rollNo) {
      return c.json({ error: 'rollNo is required' }, 400);
    }

    const result = await HostelRepository.leaveOrDisbandGroup(rollNo);
    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ success: true, message: 'Successfully updated group status' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to leave group';
    return c.json({ error: message }, 500);
  }
});

app.post('/api/group/invite', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { groupId, fromRollNo, toRollNo } = body as any;
    if (!groupId || !fromRollNo || !toRollNo) {
      return c.json({ error: 'groupId, fromRollNo, and toRollNo are required' }, 400);
    }

    const result = await HostelRepository.sendInvite(groupId, fromRollNo, toRollNo);
    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ success: true, invite: result.invite });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send invite';
    return c.json({ error: message }, 500);
  }
});

app.get('/api/group/invites', async (c) => {
  try {
    let rollNo = c.req.query('roll_no');
    if (!rollNo) {
      rollNo = getCookie(c, 'student_session') || getCookie(c, 'student_roll');
    }

    if (!rollNo) {
      return c.json({ error: 'roll_no parameter is required' }, 400);
    }

    const invites = await HostelRepository.getStudentInvites(rollNo);
    return c.json({ success: true, invites });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch invites';
    return c.json({ error: message }, 500);
  }
});

app.post('/api/group/invite/respond', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { inviteId, studentRoll, action } = body as any;
    if (!inviteId || !studentRoll || !action) {
      return c.json({ error: 'inviteId, studentRoll, and action ("accept" | "decline") are required' }, 400);
    }

    if (action !== 'accept' && action !== 'decline') {
      return c.json({ error: 'Action must be "accept" or "decline"' }, 400);
    }

    const result = await HostelRepository.respondInvite(inviteId, studentRoll, action);
    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ success: true, message: `Invite successfully ${action}ed` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to respond to invite';
    return c.json({ error: message }, 500);
  }
});

app.get('/api/group/peers', async (c) => {
  try {
    let rollNo = c.req.query('roll_no');
    if (!rollNo) {
      rollNo = getCookie(c, 'student_session') || getCookie(c, 'student_roll');
    }

    if (!rollNo) {
      return c.json({ error: 'roll_no parameter is required' }, 400);
    }

    let peers = await HostelRepository.getEligiblePeers(rollNo);

    const search = c.req.query('search')?.trim().toLowerCase() || '';
    if (search) {
      peers = peers.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.roll_no.toLowerCase().includes(search) ||
          p.email.toLowerCase().includes(search)
      );
    }

    const total = peers.length;
    const limitQuery = c.req.query('limit');
    const isAll = limitQuery === 'all' || !limitQuery;

    if (isAll) {
      return c.json({ success: true, peers, total });
    }

    const rawLimit = parseInt(limitQuery);
    const limit = Math.max(1, Math.min(100, isNaN(rawLimit) ? 20 : rawLimit));
    const rawPage = parseInt(c.req.query('page') || '1');
    const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
    const offsetQuery = c.req.query('offset');
    const offset = offsetQuery !== undefined ? Math.max(0, parseInt(offsetQuery) || 0) : (page - 1) * limit;

    const paginatedPeers = peers.slice(offset, offset + limit);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return c.json({
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
    return c.json({ error: message }, 500);
  }
});

app.post('/api/group/preferences', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { group_id, leader_roll_no, room_ids } = body as any;
    if (!group_id || !leader_roll_no || !Array.isArray(room_ids)) {
      return c.json({ success: false, error: 'group_id, leader_roll_no, and room_ids array are required' }, 400);
    }

    const result = await HostelRepository.submitAndLockPreferences(group_id, leader_roll_no, room_ids);
    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({
      success: true,
      message: 'Preferences submitted and locked successfully on behalf of the group!',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to submit preferences';
    return c.json({ success: false, error: message }, 500);
  }
});

app.post('/api/group/unlock', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { group_id, leader_roll_no } = body as any;
    if (!group_id || !leader_roll_no) {
      return c.json({ success: false, error: 'group_id and leader_roll_no are required' }, 400);
    }

    const result = await HostelRepository.unlockPreferences(group_id, leader_roll_no);
    if (!result.success) {
      return c.json({ success: false, error: result.error }, 400);
    }

    return c.json({
      success: true,
      message: 'Preferences unlocked! You can now modify and re-lock your preferences.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to unlock preferences';
    return c.json({ success: false, error: message }, 500);
  }
});

// --------------------------------------------------------------------------
// Cloudflare Worker Default Export (Static Assets + API Routing)
// --------------------------------------------------------------------------
interface WorkerEnv {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  [key: string]: unknown;
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: unknown): Promise<Response> {
    if (env && typeof process !== 'undefined' && process.env) {
      for (const [k, v] of Object.entries(env)) {
        if (typeof v === 'string' && !process.env[k]) {
          process.env[k] = v;
        }
      }
    }

    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return app.fetch(request, env as any, ctx as any);
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Assets binding not configured', { status: 500 });
  },
};
