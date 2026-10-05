import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { initialHostels } from '../src/lib/db/mock-store';
import { INITIAL_ADMINS } from '../src/lib/db/gate-db';

const dbUrl = process.env.DATABASE_URL;
const DB_CONFIG = dbUrl
  ? { connectionString: dbUrl, ssl: { rejectUnauthorized: false } }
  : {
      host: process.env.PGHOST || 'aws-0-ap-northeast-1.pooler.supabase.com',
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER || 'postgres.oyxfyfuelukhihmkdfoh',
      password: process.env.PGPASSWORD || process.env.SUPABASE_DB_PASSWORD || 'Epo5k6dfN0uqrRnV',
      database: process.env.PGDATABASE || 'postgres',
      ssl: { rejectUnauthorized: false },
    };


async function main() {
  console.log('Connecting to Supabase PostgreSQL at:', DB_CONFIG.host);
  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log('Connected successfully!');

  // 1. Run core schema.sql
  console.log('Applying supabase/schema.sql...');
  const schemaSql = fs.readFileSync(path.resolve('supabase/schema.sql'), 'utf-8');
  await client.query(schemaSql);
  console.log('Core schema.sql applied successfully.');

  // 2. Add Gate & Extended tables & columns
  console.log('Applying Gate & Extended Schema...');
  const extendedSchemaSql = `
    -- Admin & Security Users Table
    CREATE TABLE IF NOT EXISTS gate_admins (
        admin_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(120) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'warden', 'security_officer')),
        designation VARCHAR(100) NOT NULL,
        assigned_hostel VARCHAR(20),
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Gate Student Registry Cache
    CREATE TABLE IF NOT EXISTS gate_students_registry (
        barcode_id VARCHAR(50) PRIMARY KEY,
        roll_no VARCHAR(20) NOT NULL,
        name VARCHAR(100) NOT NULL,
        gender VARCHAR(10) NOT NULL,
        year INT NOT NULL,
        phone VARCHAR(20) NOT NULL,
        guardian_contact VARCHAR(100) NOT NULL,
        hostel_id VARCHAR(20),
        hostel_name VARCHAR(100),
        room_number VARCHAR(10),
        warden_name VARCHAR(100),
        warden_phone VARCHAR(20),
        curfew_time TIME NOT NULL DEFAULT '22:00:00',
        last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_gate_students_roll ON gate_students_registry(roll_no);

    -- Extend gate_logs with full scan metadata if missing
    ALTER TABLE gate_logs ADD COLUMN IF NOT EXISTS student_name VARCHAR(100);
    ALTER TABLE gate_logs ADD COLUMN IF NOT EXISTS hostel_name VARCHAR(100);
    ALTER TABLE gate_logs ADD COLUMN IF NOT EXISTS room_number VARCHAR(10);
    ALTER TABLE gate_logs ADD COLUMN IF NOT EXISTS scanned_by_admin VARCHAR(50);

    -- Extend rounds_config with multi-round automated release columns
    ALTER TABLE rounds_config ADD COLUMN IF NOT EXISTS total_rounds INT DEFAULT 5;
    ALTER TABLE rounds_config ADD COLUMN IF NOT EXISTS auto_release_interval_ms BIGINT DEFAULT 7200000;
    ALTER TABLE rounds_config ADD COLUMN IF NOT EXISTS auto_release_enabled BOOLEAN DEFAULT false;
    ALTER TABLE rounds_config ADD COLUMN IF NOT EXISTS next_release_time TIMESTAMPTZ;
    ALTER TABLE rounds_config ADD COLUMN IF NOT EXISTS final_round_active BOOLEAN DEFAULT false;
    ALTER TABLE rounds_config ADD COLUMN IF NOT EXISTS final_round_completed BOOLEAN DEFAULT false;

    -- Optional auth linking on students table
    ALTER TABLE students ADD COLUMN IF NOT EXISTS auth_user_id UUID;
    CREATE INDEX IF NOT EXISTS idx_students_auth_user ON students(auth_user_id);

    -- Widen guardian_contact if needed
    ALTER TABLE students ALTER COLUMN guardian_contact TYPE VARCHAR(150);

    -- Widen phone if needed
    ALTER TABLE students ALTER COLUMN phone TYPE VARCHAR(50);
  `;
  await client.query(extendedSchemaSql);
  console.log('Extended tables & columns applied successfully.');

  // 3. Email Validation Trigger on auth.users
  console.log('Setting up Google / Auth email validation trigger on auth.users...');
  const authTriggerSql = `
    CREATE OR REPLACE FUNCTION public.check_nith_email_format()
    RETURNS TRIGGER AS $$
    DECLARE
        extracted_email TEXT;
        clean_email TEXT;
    BEGIN
        clean_email := lower(trim(NEW.email));
        
        -- Must end with @nith.ac.in (or @.nith.ac.in) for all institutional users (students and admins)
        IF clean_email !~* '@\\.?nith\\.ac\\.in$' THEN
            RAISE EXCEPTION 'Access denied: Only official NITH institutional accounts (@nith.ac.in) are permitted to authenticate. Received: %', NEW.email;
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    DROP TRIGGER IF EXISTS trg_check_nith_email_format ON auth.users;
    CREATE TRIGGER trg_check_nith_email_format
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.check_nith_email_format();

    -- Also link auth.users to students table on sign-up / sign-in
    CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
    RETURNS TRIGGER AS $$
    DECLARE
        v_email TEXT;
        v_roll TEXT;
    BEGIN
        v_email := lower(trim(NEW.email));
        -- Extract roll number if student email
        IF v_email ~* '^[0-9]{2}[a-z]{3}[0-9]{3}@\\.?nith\\.ac\\.in$' THEN
            v_roll := upper(split_part(v_email, '@', 1));
            UPDATE public.students
            SET auth_user_id = NEW.id
            WHERE upper(roll_no) = v_roll;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    DROP TRIGGER IF EXISTS trg_link_auth_user_to_student ON auth.users;
    CREATE TRIGGER trg_link_auth_user_to_student
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();
  `;
  await client.query(authTriggerSql);
  console.log('Auth email validation trigger & linker created successfully.');

  // 4. Seed Hostels
  console.log('Seeding hostels...');
  const legacyHostels = [
    {
      hostel_id: 'BH-1',
      name: 'Kailash Boys Hostel (BH-1)',
      gender_allowed: 'Male',
      allowed_years: [2, 3, 4],
      warden_id: 'WARDEN-01',
      warden_name: 'Dr. Ramesh Sharma',
      warden_phone: '+91 98765 43210',
      capacity: 800,
      curfew_time: '22:00:00',
    },
    {
      hostel_id: 'BH-2',
      name: 'Himadri Boys Hostel (BH-2)',
      gender_allowed: 'Male',
      allowed_years: [3, 4],
      warden_id: 'WARDEN-02',
      warden_name: 'Prof. Arvind Kumar',
      warden_phone: '+91 98765 43211',
      capacity: 800,
      curfew_time: '22:00:00',
    },
    {
      hostel_id: 'BH-3',
      name: 'Shivalik Boys Hostel (BH-3)',
      gender_allowed: 'Male',
      allowed_years: [4],
      warden_id: 'WARDEN-03',
      warden_name: 'Dr. Suresh Verma',
      warden_phone: '+91 98765 43212',
      capacity: 600,
      curfew_time: '22:30:00',
    },
    {
      hostel_id: 'GH-1',
      name: 'Parvati Girls Hostel (GH-1)',
      gender_allowed: 'Female',
      allowed_years: [2, 3, 4],
      warden_id: 'WARDEN-04',
      warden_name: 'Dr. Sunita Rao',
      warden_phone: '+91 98765 43213',
      capacity: 400,
      curfew_time: '21:30:00',
    },
    {
      hostel_id: 'GH-2',
      name: 'Ambika Girls Hostel (GH-2)',
      gender_allowed: 'Female',
      allowed_years: [3, 4],
      warden_id: 'WARDEN-05',
      warden_name: 'Prof. Meenakshi Sundaram',
      warden_phone: '+91 98765 43214',
      capacity: 400,
      curfew_time: '21:30:00',
    },
    {
      hostel_id: 'GH-3',
      name: 'Manimahesh Girls Hostel (GH-3)',
      gender_allowed: 'Female',
      allowed_years: [4],
      warden_id: 'WARDEN-06',
      warden_name: 'Dr. Ananya Mukherjee',
      warden_phone: '+91 98765 43215',
      capacity: 300,
      curfew_time: '22:00:00',
    },
  ];

  const allHostelsToSeed = [...legacyHostels, ...initialHostels];
  for (const h of allHostelsToSeed) {
    await client.query(
      `INSERT INTO hostels (hostel_id, name, gender_allowed, allowed_years, warden_id, warden_name, warden_phone, capacity, curfew_time)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9)
       ON CONFLICT (hostel_id) DO UPDATE SET
         name = EXCLUDED.name,
         gender_allowed = EXCLUDED.gender_allowed,
         allowed_years = EXCLUDED.allowed_years,
         warden_name = EXCLUDED.warden_name,
         warden_phone = EXCLUDED.warden_phone,
         capacity = EXCLUDED.capacity,
         curfew_time = EXCLUDED.curfew_time;`,
      [
        h.hostel_id,
        h.name,
        h.gender_allowed,
        JSON.stringify(h.allowed_years),
        h.warden_id,
        h.warden_name,
        h.warden_phone,
        h.capacity,
        h.curfew_time,
      ]
    );
  }
  console.log(`Seeded ${allHostelsToSeed.length} hostels.`);

  // 5. Seed Rooms
  console.log('Seeding rooms from nith-rooms.json...');
  const roomsJsonPath = path.resolve('src/lib/db/nith-rooms.json');
  const roomsData = JSON.parse(fs.readFileSync(roomsJsonPath, 'utf-8'));

  // Batch insert rooms
  const ROOM_BATCH_SIZE = 100;
  for (let i = 0; i < roomsData.length; i += ROOM_BATCH_SIZE) {
    const batch = roomsData.slice(i, i + ROOM_BATCH_SIZE);
    const valueStrings: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    for (const r of batch) {
      valueStrings.push(`($${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3}, $${pIdx + 4}, $${pIdx + 5})`);
      params.push(r.room_id, r.hostel_id, r.room_number, r.floor, r.capacity, r.status || 'free');
      pIdx += 6;
    }

    const query = `
      INSERT INTO rooms (room_id, hostel_id, room_number, floor, capacity, status)
      VALUES ${valueStrings.join(', ')}
      ON CONFLICT (room_id) DO UPDATE SET
        capacity = EXCLUDED.capacity,
        floor = EXCLUDED.floor,
        room_number = EXCLUDED.room_number,
        status = EXCLUDED.status;
    `;
    await client.query(query, params);
  }
  console.log(`Seeded ${roomsData.length} rooms from nith-rooms.json.`);

  // Seed sample legacy rooms from seed.sql if needed
  const legacyRooms = [
    { room_id: 'BH-1-101', hostel_id: 'BH-1', room_number: '101', floor: 1, capacity: 1 },
    { room_id: 'BH-1-102', hostel_id: 'BH-1', room_number: '102', floor: 1, capacity: 1 },
    { room_id: 'BH-1-103', hostel_id: 'BH-1', room_number: '103', floor: 1, capacity: 2 },
    { room_id: 'BH-1-104', hostel_id: 'BH-1', room_number: '104', floor: 1, capacity: 2 },
    { room_id: 'BH-2-101', hostel_id: 'BH-2', room_number: '101', floor: 1, capacity: 2 },
    { room_id: 'BH-2-102', hostel_id: 'BH-2', room_number: '102', floor: 1, capacity: 2 },
    { room_id: 'BH-3-101', hostel_id: 'BH-3', room_number: '101', floor: 1, capacity: 1 },
    { room_id: 'GH-1-101', hostel_id: 'GH-1', room_number: '101', floor: 1, capacity: 1 },
    { room_id: 'GH-2-101', hostel_id: 'GH-2', room_number: '101', floor: 1, capacity: 2 },
    { room_id: 'GH-3-101', hostel_id: 'GH-3', room_number: '101', floor: 1, capacity: 1 },
  ];
  for (const r of legacyRooms) {
    await client.query(
      `INSERT INTO rooms (room_id, hostel_id, room_number, floor, capacity, status)
       VALUES ($1, $2, $3, $4, $5, 'free')
       ON CONFLICT (room_id) DO NOTHING;`,
      [r.room_id, r.hostel_id, r.room_number, r.floor, r.capacity]
    );
  }

  // 6. Seed Students
  console.log('Seeding students from nith-students.json...');
  const studentsJsonPath = path.resolve('src/lib/db/nith-students.json');
  const studentsData = JSON.parse(fs.readFileSync(studentsJsonPath, 'utf-8'));

  const STUDENT_BATCH_SIZE = 100;
  for (let i = 0; i < studentsData.length; i += STUDENT_BATCH_SIZE) {
    const batch = studentsData.slice(i, i + STUDENT_BATCH_SIZE);
    const valueStrings: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    for (const s of batch) {
      valueStrings.push(
        `($${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3}, $${pIdx + 4}, $${pIdx + 5}, $${pIdx + 6}, $${pIdx + 7}, $${pIdx + 8}, true)`
      );
      params.push(
        s.roll_no,
        s.name,
        s.email,
        s.gender,
        s.year,
        s.cgpa,
        s.phone,
        s.guardian_contact,
        s.barcode_id
      );
      pIdx += 9;
    }

    const query = `
      INSERT INTO students (roll_no, name, email, gender, year, cgpa, phone, guardian_contact, barcode_id, is_active)
      VALUES ${valueStrings.join(', ')}
      ON CONFLICT (roll_no) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        cgpa = EXCLUDED.cgpa,
        year = EXCLUDED.year,
        gender = EXCLUDED.gender,
        phone = EXCLUDED.phone,
        guardian_contact = EXCLUDED.guardian_contact,
        barcode_id = EXCLUDED.barcode_id;
    `;
    await client.query(query, params);
  }
  console.log(`Seeded ${studentsData.length} students.`);

  // 7. Seed Gate Admins
  console.log('Seeding gate admins...');
  for (const admin of INITIAL_ADMINS) {
    await client.query(
      `INSERT INTO gate_admins (admin_id, name, email, password_hash, role, designation, assigned_hostel, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       ON CONFLICT (admin_id) DO UPDATE SET
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         role = EXCLUDED.role,
         designation = EXCLUDED.designation,
         assigned_hostel = EXCLUDED.assigned_hostel;`,
      [
        admin.admin_id,
        admin.name,
        admin.email,
        admin.password || 'admin',
        admin.role,
        admin.designation,
        admin.assigned_hostel,
      ]
    );
  }
  console.log(`Seeded ${INITIAL_ADMINS.length} gate admins.`);

  // 8. Seed Rounds Config
  console.log('Ensuring Round 1 config...');
  await client.query(`
    INSERT INTO rounds_config (round_number, academic_year, is_published, is_active, total_rounds, auto_release_enabled, final_round_active, final_round_completed)
    VALUES (1, '2026-2027', false, true, 5, false, false, false)
    ON CONFLICT (round_number) DO NOTHING;
  `);

  // 9. Verify counts
  const studentCount = await client.query('SELECT count(*) FROM students;');
  const hostelCount = await client.query('SELECT count(*) FROM hostels;');
  const roomCount = await client.query('SELECT count(*) FROM rooms;');
  const adminCount = await client.query('SELECT count(*) FROM gate_admins;');
  const roundCount = await client.query('SELECT count(*) FROM rounds_config;');

  console.log('====================================================');
  console.log('SUPABASE DEPLOYMENT VERIFICATION:');
  console.log('Students count in DB:   ', studentCount.rows[0].count);
  console.log('Hostels count in DB:    ', hostelCount.rows[0].count);
  console.log('Rooms count in DB:      ', roomCount.rows[0].count);
  console.log('Gate Admins count in DB:', adminCount.rows[0].count);
  console.log('Rounds Config in DB:    ', roundCount.rows[0].count);
  console.log('====================================================');

  await client.end();
  console.log('Supabase schema setup and database migration completed successfully!');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
