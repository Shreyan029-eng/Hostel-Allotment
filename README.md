# HostelMatrix — JOSAA-Style Smart Hostel Management & Allotment Portal

> High-concurrency campus accommodation portal accommodating **5,000+ concurrent students** during peak allotment traffic. Built with **Next.js (App Router, Cloudflare Pages/Edge ready)** and **Supabase (PostgreSQL with strict ACID transactions and Row-Level Security)**.

---

## 🏛️ System Architecture & Key Capabilities

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Next.js 16 App Router (Edge Ready)                   │
├─────────────────────┬──────────────────────────┬───────────────────────┤
│   Student Portal    │     Admin & Wardens      │     Gate Security     │
│  - Year/Gender Matrix│  - JOSAA Batch Engine   │  - /api/student/[id]  │
│  - Roommate Groups  │  - ACID SELECT FOR UPDATE│  - Curfew Monitor     │
│  - Max CGPA Priority│  - Results Publishing    │  - Warden Auto Alert  │
│  - Preference Lock  │  - CSV / Excel Export    │  - Barcode Scanner    │
└──────────┬──────────┴────────────┬─────────────┴───────────┬───────────┘
           │                       │                         │
           ▼                       ▼                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Supabase / PostgreSQL Database                      │
│ - PK: roll_no (No student duplicates)                                   │
│ - Indexes on barcode_id & (max_cgpa DESC, created_at ASC)              │
│ - Triggers: Auto recalculate max_cgpa & validate member eligibility     │
│ - Stored Procedure: run_josaa_allotment_procedure()                     │
│ - Strict Row-Level Security (RLS) & Published Results Cloak             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Database Schema (`supabase/schema.sql`)

All primary keys, foreign keys, and RLS policies are strictly configured:

- **`STUDENTS`**: `roll_no` (PK, eliminates duplicates), `name`, `email` (unique), `gender` (Male/Female/Other), `year` (2/3/4), `cgpa` (numeric 0.00-10.00), `phone`, `guardian_contact`, `barcode_id` (unique index), `is_active` (boolean guaranteeing exactly one active entry per student).
- **`HOSTELS`**: `hostel_id` (PK), `name`, `gender_allowed`, `allowed_years` (JSONB array e.g. `[2]`, `[3, 4]`), `warden_id`, `warden_name`, `warden_phone`, `capacity`, `curfew_time`.
- **`ROOMS`**: `room_id` (PK), `hostel_id` (FK), `room_number`, `floor`, `capacity`, `status` (`free`/`locked`), unique on `(hostel_id, room_number)`.
- **`GROUPS`**: `group_id` (PK, UUID), `group_code` (unique code), `leader_roll_no` (FK), `max_cgpa` (numeric), `required_capacity` (1-6), `is_locked`, `created_at`.
- **`GROUP_MEMBERS`**: `member_id` (PK), `group_id` (FK), `roll_no` (FK), `status` (`pending`/`accepted`), `joined_at`.
- **`PREFERENCES`**: `pref_id` (PK), `group_id` (FK), `preference_rank` (INT), `room_id` (FK).
- **`ALLOTMENTS`**: `allotment_id` (PK), `roll_no` (FK), `room_id` (FK), `group_id` (FK), `round_number`, `academic_year`, `is_active`. Unique partial index on `(roll_no) WHERE is_active = true`.
- **`HOSTEL_HISTORY`**: `history_id` (PK), `roll_no` (FK), `old_hostel`, `old_room`, `year` (archives past assignments without mixing with active data).
- **`ROUNDS_CONFIG`**: `round_number` (PK), `academic_year`, `is_published` (boolean default false), `is_active`.
- **`GATE_LOGS`**: `log_id` (PK), `roll_no` (FK), `barcode_id`, `direction` (ENTRY/EXIT), `timestamp`, `is_late`, `curfew_time`, `warden_alerted`, `warden_alert_details`.

---

## 2. Business Rules & Logic Implementation

### A. Dynamic Eligibility Matrix
- **2nd-Year Students**: Only see rooms in **1 specific hostel** matching their gender.
- **3rd-Year Students**: See rooms in **2 hostels** matching their gender.
- **4th-Year Students**: See rooms in **3 hostels** matching their gender.

### B. Roommate Groups & Verification
- Students desiring shared rooms form groups matching the room capacity (e.g. 2, 3, or 4 beds).
- The Group Leader generates a Group Code (e.g. `GRP-4A9F`).
- **Strict Validation**: When a candidate enters the code, the backend trigger & API verify:
  1. `candidate.gender == leader.gender`
  2. `candidate.year == leader.year`
  3. `current_members < required_capacity`
- **Priority Calculation**: Group `max_cgpa` is automatically computed and stored as the highest individual CGPA among accepted group members (`MAX(student.cgpa)`).

### C. Ranked Choice Locking
- Group Leader submits an ordered preference list (Choice 1, Choice 2, Choice 3...).
- Locking is allowed only when all members have accepted and the group count equals `required_capacity`.
- Freezes the group to prevent further modifications.

### D. JOSAA-Style Allotment Engine
- **Offline Batch Processing**: Does not run synchronously during user traffic spikes, preventing DB lock contention.
- **Sorting**: Groups are sorted by `max_cgpa DESC`. Ties are broken by `created_at ASC` (earliest group creation wins).
- **Atomic Locking**: Uses PostgreSQL `SELECT FOR UPDATE` to lock free rooms and assign all members simultaneously.
- **Publishing Cloak**: Allocation results remain hidden in the database until the admin clicks **Publish Round Results**, which toggles `ROUNDS_CONFIG.is_published = true`.

### E. Gate Security API (`GET /api/student/[barcode_id]`)
- Fast lookup for barcode scanners at the campus gate.
- Returns student identification, active hostel allotment, room number, and warden details.
- Checks arrival time against hostel curfew. If late, sets `is_late = true` and dispatches automated alerts to the warden.

---

## 3. Quick Start & Execution

### Install Dependencies
```bash
npm install
```

### Run Automated Test Suite (16/16 Verification Tests)
```bash
npm test
```

### Run Offline JOSAA Batch Allotment (CLI)
```bash
npm run allot
```

### Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## 4. API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/student/[barcode_id]?direction=ENTRY` | Gate security scanner endpoint with curfew check |
| `POST` | `/api/admin/run-allotment` | Triggers offline batch JOSAA allocation process |
| `POST` | `/api/admin/publish` | Toggles publishing flag for round results |
| `GET` | `/api/admin/export?filter=all` | Downloads formatted CSV of student allotments |
| `POST` | `/api/group/create` | Creates new roommate group with specified capacity |
| `POST` | `/api/group/join` | Joins roommate group with year & gender validation |
| `POST` | `/api/group/preferences` | Leader submits and freezes ranked room choices |
| `GET` | `/api/student/me?roll_no=[roll]` | Fetches student profile, allowed hostels, and group |
