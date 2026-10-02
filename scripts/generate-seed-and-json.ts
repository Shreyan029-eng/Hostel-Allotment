import fs from 'fs';
import { parseActiveNithStudents } from './analyze-csv';

async function main() {
  const students = await parseActiveNithStudents();

  // 1. Write nith-students.json
  const jsonPath = 'src/lib/db/nith-students.json';
  fs.writeFileSync(jsonPath, JSON.stringify(students, null, 2), 'utf-8');
  console.log(`Saved ${students.length} students to ${jsonPath}`);

  // 2. Generate Supabase SQL Insert Statements
  let sql = `-- ==============================================================================
-- SEED DATA: 2023, 2024, 2025 BATCH NITH STUDENTS FROM results_rows.csv
-- Total Students: ${students.length}
-- Batches: 2025 (Year 2), 2024 (Year 3), 2023 (Year 4)
-- ==============================================================================

-- 1. HOSTELS CONFIGURATION
INSERT INTO hostels (hostel_id, name, gender_allowed, allowed_years, warden_id, warden_name, warden_phone, capacity, curfew_time)
VALUES
    ('BH-1', 'Kailash Boys Hostel (BH-1)', 'Male', '[2, 3, 4]'::jsonb, 'WARDEN-01', 'Dr. Ramesh Sharma', '+91 98765 43210', 800, '22:00:00'),
    ('BH-2', 'Himadri Boys Hostel (BH-2)', 'Male', '[3, 4]'::jsonb, 'WARDEN-02', 'Prof. Arvind Kumar', '+91 98765 43211', 800, '22:00:00'),
    ('BH-3', 'Shivalik Boys Hostel (BH-3)', 'Male', '[4]'::jsonb, 'WARDEN-03', 'Dr. Suresh Verma', '+91 98765 43212', 600, '22:30:00'),
    ('GH-1', 'Parvati Girls Hostel (GH-1)', 'Female', '[2, 3, 4]'::jsonb, 'WARDEN-04', 'Dr. Sunita Rao', '+91 98765 43213', 400, '21:30:00'),
    ('GH-2', 'Ambika Girls Hostel (GH-2)', 'Female', '[3, 4]'::jsonb, 'WARDEN-05', 'Prof. Meenakshi Sundaram', '+91 98765 43214', 400, '21:30:00'),
    ('GH-3', 'Manimahesh Girls Hostel (GH-3)', 'Female', '[4]'::jsonb, 'WARDEN-06', 'Dr. Ananya Mukherjee', '+91 98765 43215', 300, '22:00:00')
ON CONFLICT (hostel_id) DO NOTHING;

-- 2. SAMPLE ROOMS WITH MIXED CAPACITIES (1, 2, 3, 4 BEDS)
INSERT INTO rooms (room_id, hostel_id, room_number, floor, capacity, status)
VALUES
    -- BH-1 (Kailash)
    ('BH-1-101', 'BH-1', '101', 1, 1, 'free'),
    ('BH-1-102', 'BH-1', '102', 1, 1, 'free'),
    ('BH-1-103', 'BH-1', '103', 1, 2, 'free'),
    ('BH-1-104', 'BH-1', '104', 1, 2, 'free'),
    ('BH-1-201', 'BH-1', '201', 2, 3, 'free'),
    ('BH-1-202', 'BH-1', '202', 2, 3, 'free'),
    ('BH-1-203', 'BH-1', '203', 2, 4, 'free'),
    ('BH-1-204', 'BH-1', '204', 2, 4, 'free'),

    -- BH-2 (Himadri)
    ('BH-2-101', 'BH-2', '101', 1, 2, 'free'),
    ('BH-2-102', 'BH-2', '102', 1, 2, 'free'),
    ('BH-2-103', 'BH-2', '103', 1, 3, 'free'),
    ('BH-2-201', 'BH-2', '201', 2, 3, 'free'),
    ('BH-2-202', 'BH-2', '202', 2, 4, 'free'),
    ('BH-2-203', 'BH-2', '203', 2, 4, 'free'),

    -- BH-3 (Shivalik Senior)
    ('BH-3-101', 'BH-3', '101', 1, 1, 'free'),
    ('BH-3-102', 'BH-3', '102', 1, 1, 'free'),
    ('BH-3-201', 'BH-3', '201', 2, 2, 'free'),
    ('BH-3-202', 'BH-3', '202', 2, 2, 'free'),

    -- GH-1 (Parvati)
    ('GH-1-101', 'GH-1', '101', 1, 1, 'free'),
    ('GH-1-102', 'GH-1', '102', 1, 2, 'free'),
    ('GH-1-103', 'GH-1', '103', 1, 2, 'free'),
    ('GH-1-201', 'GH-1', '201', 2, 3, 'free'),
    ('GH-1-202', 'GH-1', '202', 2, 4, 'free'),

    -- GH-2 (Ambika)
    ('GH-2-101', 'GH-2', '101', 1, 2, 'free'),
    ('GH-2-102', 'GH-2', '102', 1, 2, 'free'),
    ('GH-2-201', 'GH-2', '201', 2, 3, 'free'),
    ('GH-2-202', 'GH-2', '202', 2, 4, 'free'),

    -- GH-3 (Manimahesh Senior)
    ('GH-3-101', 'GH-3', '101', 1, 1, 'free'),
    ('GH-3-102', 'GH-3', '102', 1, 1, 'free'),
    ('GH-3-201', 'GH-3', '201', 2, 2, 'free')
ON CONFLICT (room_id) DO NOTHING;

-- 3. ROUNDS CONFIG
INSERT INTO rounds_config (round_number, academic_year, is_published, is_active)
VALUES (1, '2026-2027', false, true)
ON CONFLICT (round_number) DO NOTHING;

-- 4. INSERT NITH STUDENTS (Batches 2023, 2024, 2025)
INSERT INTO students (roll_no, name, email, gender, year, cgpa, phone, guardian_contact, barcode_id, is_active)
VALUES\n`;

  const studentSqlValues = students.map((s) => {
    const escName = s.name.replace(/'/g, "''");
    const escGuardian = s.guardian_contact.replace(/'/g, "''");
    return `    ('${s.roll_no}', '${escName}', '${s.email}', '${s.gender}', ${s.year}, ${s.cgpa.toFixed(2)}, '${s.phone}', '${escGuardian}', '${s.barcode_id}', true)`;
  });

  sql += studentSqlValues.join(',\n') + '\nON CONFLICT (roll_no) DO UPDATE SET cgpa = EXCLUDED.cgpa, email = EXCLUDED.email, year = EXCLUDED.year;\n';

  fs.writeFileSync('supabase/seed.sql', sql, 'utf-8');
  console.log(`Generated supabase/seed.sql with ${students.length} students across 2023, 2024, and 2025 batches.`);
}

main().catch(console.error);
