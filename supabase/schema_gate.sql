-- ==============================================================================
-- DATABASE 2: NITH GATE ENTRY & SECURITY DATABASE (ADMIN-ONLY ACCESS)
-- Isolated from core allotment transactions for independent high-throughput scanning
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ADMIN & SECURITY USERS
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

-- 2. GATE STUDENT CACHE REGISTRY (Synced from Allotment DB)
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

-- 3. GATE LOGS TABLE
CREATE TABLE IF NOT EXISTS gate_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode_id VARCHAR(50) NOT NULL,
    roll_no VARCHAR(20) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('ENTRY', 'EXIT')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_late BOOLEAN NOT NULL DEFAULT false,
    curfew_time TIME NOT NULL,
    warden_alerted BOOLEAN NOT NULL DEFAULT false,
    warden_alert_details JSONB,
    hostel_name VARCHAR(100),
    room_number VARCHAR(10),
    scanned_by_admin VARCHAR(50) REFERENCES gate_admins(admin_id) ON DELETE SET NULL,
    remarks TEXT
);

CREATE INDEX IF NOT EXISTS idx_gate_logs_timestamp ON gate_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gate_logs_late ON gate_logs(is_late) WHERE is_late = true;

-- 4. ROW LEVEL SECURITY (ADMIN ONLY ACCESS)
ALTER TABLE gate_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_students_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_logs ENABLE ROW LEVEL SECURITY;

-- Students are strictly forbidden from viewing Gate Entry tables
CREATE POLICY "Admin Only Gate Registry" ON gate_students_registry
    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'warden', 'service_role'));

CREATE POLICY "Admin Only Gate Logs" ON gate_logs
    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'warden', 'service_role'));
