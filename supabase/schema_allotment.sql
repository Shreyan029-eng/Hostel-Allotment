-- ==============================================================================
-- DATABASE 1: NITH HOSTEL ALLOTMENT DATABASE (ACID JOSAA ENGINE)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    roll_no VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    year INT NOT NULL CHECK (year IN (2, 3, 4)),
    cgpa NUMERIC(4, 2) NOT NULL CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
    phone VARCHAR(20) NOT NULL,
    guardian_contact VARCHAR(100) NOT NULL,
    barcode_id VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_year_gender ON students(year, gender);

-- 2. HOSTELS TABLE
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

-- 3. ROOMS TABLE
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

CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(hostel_id, capacity, status);

-- 4. GROUPS TABLE
CREATE TABLE IF NOT EXISTS groups (
    group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_code VARCHAR(12) UNIQUE NOT NULL,
    leader_roll_no VARCHAR(20) NOT NULL REFERENCES students(roll_no) ON DELETE RESTRICT,
    max_cgpa NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
    required_capacity INT NOT NULL CHECK (required_capacity >= 1 AND required_capacity <= 6),
    is_locked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_groups_merit ON groups(max_cgpa DESC, created_at ASC);

-- 5. GROUP_MEMBERS TABLE
CREATE TABLE IF NOT EXISTS group_members (
    member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    roll_no VARCHAR(20) NOT NULL REFERENCES students(roll_no) ON DELETE CASCADE,
    status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_group_member UNIQUE (group_id, roll_no),
    CONSTRAINT uq_student_single_group UNIQUE (roll_no)
);

-- 6. PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS preferences (
    pref_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    preference_rank INT NOT NULL CHECK (preference_rank >= 1),
    room_id VARCHAR(30) NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_group_rank UNIQUE (group_id, preference_rank),
    CONSTRAINT uq_group_room UNIQUE (group_id, room_id)
);

-- 7. ALLOTMENTS TABLE
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

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_allotment ON allotments(roll_no) WHERE is_active = true;

-- 8. HOSTEL_HISTORY TABLE
CREATE TABLE IF NOT EXISTS hostel_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roll_no VARCHAR(20) NOT NULL REFERENCES students(roll_no) ON DELETE CASCADE,
    old_hostel VARCHAR(100) NOT NULL,
    old_room VARCHAR(20) NOT NULL,
    year VARCHAR(15) NOT NULL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. ROUNDS_CONFIG TABLE
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
