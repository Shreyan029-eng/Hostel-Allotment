-- ==============================================================================
-- JOSAA-STYLE SMART HOSTEL MANAGEMENT & ALLOTMENT PORTAL SCHEMA
-- Target Database: Supabase / PostgreSQL 15+
-- Concurrency Target: 5,000+ Concurrent Users
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. STUDENTS TABLE
-- Primary Key: roll_no (Strictly prevents duplicate student records)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    roll_no VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    year INT NOT NULL CHECK (year IN (2, 3, 4)),
    cgpa NUMERIC(4, 2) NOT NULL CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
    phone VARCHAR(20) NOT NULL,
    guardian_contact VARCHAR(20) NOT NULL,
    barcode_id VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial index for high-concurrency barcode lookups at the campus gate
CREATE INDEX IF NOT EXISTS idx_students_barcode ON students(barcode_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_students_year_gender ON students(year, gender);

-- -----------------------------------------------------------------------------
-- 2. HOSTELS TABLE
-- Allowed years stored as JSONB array [2], [2, 3], or [3, 4]
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hostels (
    hostel_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender_allowed VARCHAR(10) NOT NULL CHECK (gender_allowed IN ('Male', 'Female', 'All')),
    allowed_years JSONB NOT NULL DEFAULT '[]'::jsonb,
    warden_id VARCHAR(50) NOT NULL,
    warden_name VARCHAR(100) NOT NULL,
    warden_phone VARCHAR(20) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    curfew_time TIME NOT NULL DEFAULT '22:00:00'
);

-- -----------------------------------------------------------------------------
-- 3. ROOMS TABLE
-- Status: 'free' or 'locked'
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rooms (
    room_id VARCHAR(30) PRIMARY KEY,
    hostel_id VARCHAR(20) NOT NULL REFERENCES hostels(hostel_id) ON DELETE CASCADE,
    room_number VARCHAR(10) NOT NULL,
    floor INT NOT NULL DEFAULT 1,
    capacity INT NOT NULL CHECK (capacity >= 1 AND capacity <= 6),
    status VARCHAR(10) NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'locked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_hostel_room UNIQUE (hostel_id, room_number)
);

CREATE INDEX IF NOT EXISTS idx_rooms_hostel_capacity_status ON rooms(hostel_id, capacity, status);

-- -----------------------------------------------------------------------------
-- 4. GROUPS TABLE
-- Roommate group for matching room capacity
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS groups (
    group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_code VARCHAR(12) UNIQUE NOT NULL,
    leader_roll_no VARCHAR(20) NOT NULL REFERENCES students(roll_no) ON DELETE RESTRICT,
    max_cgpa NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
    required_capacity INT NOT NULL CHECK (required_capacity >= 1 AND required_capacity <= 6),
    is_locked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_groups_priority ON groups(max_cgpa DESC, created_at ASC);

-- -----------------------------------------------------------------------------
-- 5. GROUP_MEMBERS TABLE
-- Members can be 'pending' or 'accepted'
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS group_members (
    member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    roll_no VARCHAR(20) NOT NULL REFERENCES students(roll_no) ON DELETE CASCADE,
    status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_group_member UNIQUE (group_id, roll_no),
    CONSTRAINT uq_student_single_group UNIQUE (roll_no)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_status ON group_members(group_id, status);

-- -----------------------------------------------------------------------------
-- 6. PREFERENCES TABLE
-- Ranked preference choices submitted by the group leader
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preferences (
    pref_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    preference_rank INT NOT NULL CHECK (preference_rank >= 1),
    room_id VARCHAR(30) NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_group_rank UNIQUE (group_id, preference_rank),
    CONSTRAINT uq_group_room UNIQUE (group_id, room_id)
);

CREATE INDEX IF NOT EXISTS idx_preferences_group_rank ON preferences(group_id, preference_rank ASC);

-- -----------------------------------------------------------------------------
-- 7. ALLOTMENTS TABLE
-- Active room assignments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS allotments (
    allotment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roll_no VARCHAR(20) NOT NULL REFERENCES students(roll_no) ON DELETE CASCADE,
    room_id VARCHAR(30) NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(group_id) ON DELETE SET NULL,
    round_number INT NOT NULL DEFAULT 1,
    academic_year VARCHAR(15) NOT NULL DEFAULT '2026-2027',
    is_active BOOLEAN NOT NULL DEFAULT true,
    allotted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Guarantee exactly one active allotment per student
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_student_allotment 
ON allotments(roll_no) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_allotments_room ON allotments(room_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_allotments_round ON allotments(round_number, academic_year);

-- -----------------------------------------------------------------------------
-- 8. HOSTEL_HISTORY TABLE
-- Archives historical room allocations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hostel_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roll_no VARCHAR(20) NOT NULL REFERENCES students(roll_no) ON DELETE CASCADE,
    old_hostel VARCHAR(100) NOT NULL,
    old_room VARCHAR(20) NOT NULL,
    year VARCHAR(15) NOT NULL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hostel_history_roll ON hostel_history(roll_no);

-- -----------------------------------------------------------------------------
-- 9. ROUNDS_CONFIG TABLE
-- Controls allotment rounds and publishing status
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rounds_config (
    round_number INT PRIMARY KEY,
    academic_year VARCHAR(15) NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    allotment_run_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    total_allotted_groups INT DEFAULT 0,
    total_unallotted_groups INT DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- 10. GATE_LOGS TABLE
-- Barcode scan events and late arrival alerts
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gate_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roll_no VARCHAR(20) NOT NULL REFERENCES students(roll_no) ON DELETE CASCADE,
    barcode_id VARCHAR(50) NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('ENTRY', 'EXIT')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_late BOOLEAN NOT NULL DEFAULT false,
    curfew_time TIME,
    warden_alerted BOOLEAN NOT NULL DEFAULT false,
    warden_alert_details JSONB,
    remarks TEXT
);

CREATE INDEX IF NOT EXISTS idx_gate_logs_roll_time ON gate_logs(roll_no, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gate_logs_late ON gate_logs(is_late) WHERE is_late = true;

-- ==============================================================================
-- TRIGGERS & PROCEDURES FOR DATA INTEGRITY & BUSINESS RULES
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- A. Trigger: Recalculate Group max_cgpa automatically
-- Finds the maximum individual CGPA among accepted members (or leader)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_recalculate_group_max_cgpa()
RETURNS TRIGGER AS $$
DECLARE
    target_group_id UUID;
    calculated_max NUMERIC(4, 2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_group_id := OLD.group_id;
    ELSE
        target_group_id := NEW.group_id;
    END IF;

    -- Calculate max CGPA of all accepted members in the group
    SELECT COALESCE(MAX(s.cgpa), 0.00)
    INTO calculated_max
    FROM group_members gm
    JOIN students s ON s.roll_no = gm.roll_no
    WHERE gm.group_id = target_group_id AND gm.status = 'accepted';

    -- If no accepted members yet, fallback to group leader's CGPA
    IF calculated_max = 0.00 THEN
        SELECT s.cgpa INTO calculated_max
        FROM groups g
        JOIN students s ON s.roll_no = g.leader_roll_no
        WHERE g.group_id = target_group_id;
    END IF;

    UPDATE groups
    SET max_cgpa = COALESCE(calculated_max, 0.00)
    WHERE group_id = target_group_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_group_max_cgpa ON group_members;
CREATE TRIGGER trg_update_group_max_cgpa
AFTER INSERT OR UPDATE OR DELETE ON group_members
FOR EACH ROW
EXECUTE FUNCTION fn_recalculate_group_max_cgpa();

-- -----------------------------------------------------------------------------
-- B. Trigger: Enforce Member Year and Gender Match Leader
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_validate_group_member_constraint()
RETURNS TRIGGER AS $$
DECLARE
    leader_gender VARCHAR(10);
    leader_year INT;
    candidate_gender VARCHAR(10);
    candidate_year INT;
    curr_group_capacity INT;
    curr_member_count INT;
BEGIN
    -- Fetch Leader's Gender & Year
    SELECT s.gender, s.year, g.required_capacity
    INTO leader_gender, leader_year, curr_group_capacity
    FROM groups g
    JOIN students s ON s.roll_no = g.leader_roll_no
    WHERE g.group_id = NEW.group_id;

    -- Fetch Candidate's Gender & Year
    SELECT s.gender, s.year
    INTO candidate_gender, candidate_year
    FROM students s
    WHERE s.roll_no = NEW.roll_no;

    IF leader_gender <> candidate_gender THEN
        RAISE EXCEPTION 'Member gender (%) does not match group leader gender (%)', candidate_gender, leader_gender;
    END IF;

    IF leader_year <> candidate_year THEN
        RAISE EXCEPTION 'Member year (%) does not match group leader year (%)', candidate_year, leader_year;
    END IF;

    -- Validate capacity
    SELECT COUNT(*) INTO curr_member_count
    FROM group_members
    WHERE group_id = NEW.group_id;

    IF curr_member_count >= curr_group_capacity THEN
        RAISE EXCEPTION 'Group has reached its maximum required capacity (%)', curr_group_capacity;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_group_member ON group_members;
CREATE TRIGGER trg_validate_group_member
BEFORE INSERT ON group_members
FOR EACH ROW
EXECUTE FUNCTION fn_validate_group_member_constraint();

-- -----------------------------------------------------------------------------
-- C. PostgreSQL JOSAA Allotment Transaction Engine (Strict ACID)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION run_josaa_allotment_procedure(
    p_round_number INT DEFAULT 1,
    p_academic_year VARCHAR DEFAULT '2026-2027'
)
RETURNS JSONB AS $$
DECLARE
    r_group RECORD;
    r_pref RECORD;
    v_room_id VARCHAR(30);
    v_allotted_groups INT := 0;
    v_unallotted_groups INT := 0;
    v_member_record RECORD;
    v_is_allotted BOOLEAN;
BEGIN
    -- Ensure round config exists
    INSERT INTO rounds_config (round_number, academic_year, is_published, is_active, allotment_run_at)
    VALUES (p_round_number, p_academic_year, false, true, now())
    ON CONFLICT (round_number) DO UPDATE
    SET allotment_run_at = now(), is_published = false;

    -- Iterate through locked groups ordered by max_cgpa DESC, created_at ASC (Tie-breaker)
    FOR r_group IN
        SELECT g.group_id, g.leader_roll_no, g.max_cgpa, g.required_capacity, g.created_at
        FROM groups g
        WHERE g.is_locked = true
        ORDER BY g.max_cgpa DESC, g.created_at ASC
    LOOP
        v_is_allotted := false;

        -- Iterate through group preferences in rank order (1, 2, 3...)
        FOR r_pref IN
            SELECT p.preference_rank, p.room_id, r.capacity, r.status
            FROM preferences p
            JOIN rooms r ON r.room_id = p.room_id
            WHERE p.group_id = r_group.group_id
            ORDER BY p.preference_rank ASC
        LOOP
            -- Check if room is free and matches required capacity
            -- Using SELECT FOR UPDATE to lock room atomically
            SELECT room_id INTO v_room_id
            FROM rooms
            WHERE room_id = r_pref.room_id
              AND status = 'free'
              AND capacity = r_group.required_capacity
            FOR UPDATE SKIP LOCKED;

            IF v_room_id IS NOT NULL THEN
                -- 1. Lock room
                UPDATE rooms
                SET status = 'locked'
                WHERE room_id = v_room_id;

                -- 2. Assign leader and all accepted members
                FOR v_member_record IN
                    SELECT roll_no
                    FROM group_members
                    WHERE group_id = r_group.group_id AND status = 'accepted'
                LOOP
                    -- Archive existing active allotment to history if any
                    INSERT INTO hostel_history (roll_no, old_hostel, old_room, year)
                    SELECT a.roll_no, h.name, r.room_number, a.academic_year
                    FROM allotments a
                    JOIN rooms r ON r.room_id = a.room_id
                    JOIN hostels h ON h.hostel_id = r.hostel_id
                    WHERE a.roll_no = v_member_record.roll_no AND a.is_active = true;

                    UPDATE allotments
                    SET is_active = false
                    WHERE roll_no = v_member_record.roll_no AND is_active = true;

                    -- Insert new active allotment
                    INSERT INTO allotments (roll_no, room_id, group_id, round_number, academic_year, is_active, allotted_at)
                    VALUES (v_member_record.roll_no, v_room_id, r_group.group_id, p_round_number, p_academic_year, true, now());
                END LOOP;

                v_is_allotted := true;
                v_allotted_groups := v_allotted_groups + 1;
                EXIT; -- Room allocated, move to next group
            END IF;
        END LOOP;

        IF NOT v_is_allotted THEN
            v_unallotted_groups := v_unallotted_groups + 1;
        END IF;
    END LOOP;

    -- Update round summary stats
    UPDATE rounds_config
    SET total_allotted_groups = v_allotted_groups,
        total_unallotted_groups = v_unallotted_groups
    WHERE round_number = p_round_number;

    RETURN jsonb_build_object(
        'success', true,
        'round_number', p_round_number,
        'academic_year', p_academic_year,
        'allotted_groups', v_allotted_groups,
        'unallotted_groups', v_unallotted_groups
    );
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- D. Procedure: Publish Round Allotment Results
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION publish_round_results(p_round_number INT)
RETURNS JSONB AS $$
BEGIN
    UPDATE rounds_config
    SET is_published = true,
        published_at = now()
    WHERE round_number = p_round_number;

    RETURN jsonb_build_object(
        'success', true,
        'round_number', p_round_number,
        'is_published', true,
        'published_at', now()
    );
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE allotments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_logs ENABLE ROW LEVEL SECURITY;

-- Hostels & Rooms: Publicly readable for all authenticated/anon for choice filling
DROP POLICY IF EXISTS "Public Read Hostels" ON hostels;
CREATE POLICY "Public Read Hostels" ON hostels FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Rooms" ON rooms;
CREATE POLICY "Public Read Rooms" ON rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Rounds Config" ON rounds_config;
CREATE POLICY "Public Read Rounds Config" ON rounds_config FOR SELECT USING (true);

-- Students: Read public student directory or self
DROP POLICY IF EXISTS "Students Directory View" ON students;
CREATE POLICY "Students Directory View" ON students FOR SELECT USING (true);

-- Groups: View groups
DROP POLICY IF EXISTS "View Groups" ON groups;
CREATE POLICY "View Groups" ON groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage Groups" ON groups;
CREATE POLICY "Manage Groups" ON groups FOR ALL USING (true);

-- Group Members
DROP POLICY IF EXISTS "View Group Members" ON group_members;
CREATE POLICY "View Group Members" ON group_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage Group Members" ON group_members;
CREATE POLICY "Manage Group Members" ON group_members FOR ALL USING (true);

-- Preferences
DROP POLICY IF EXISTS "View Preferences" ON preferences;
CREATE POLICY "View Preferences" ON preferences FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage Preferences" ON preferences;
CREATE POLICY "Manage Preferences" ON preferences FOR ALL USING (true);

-- Allotments: Students can only view if round is published OR if service role / admin
DROP POLICY IF EXISTS "View Allotments When Published" ON allotments;
CREATE POLICY "View Allotments When Published" ON allotments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM rounds_config rc 
        WHERE rc.round_number = allotments.round_number AND rc.is_published = true
    )
);

-- Gate Logs: Read/Write
DROP POLICY IF EXISTS "Gate Logs Access" ON gate_logs;
CREATE POLICY "Gate Logs Access" ON gate_logs FOR ALL USING (true);

