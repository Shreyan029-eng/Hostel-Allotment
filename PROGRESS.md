# HostelMatrix Allotment Portal — Progress Report

**Timestamp**: 2026-10-06T02:40:00+05:30  
**Project**: High-Concurrency JOSAA-Style Smart Hostel Management & Allotment Portal  
**Institution**: National Institute of Technology Hamirpur (NITH)  
**Target Concurrency**: 5,000+ Concurrent Students  
**Status**: Production Ready & Fully Verified  

---

## 🚀 Milestones Completed

### Phase 1: Institutional Data Ingestion & Dual Database Architecture
- [x] Ingested all active students from `results_rows.csv` across cohorts 2023, 2024, and 2025:
  - **Batch 2025 (Year 2)**: 937 students (727 Boys, 210 Girls)
  - **Batch 2024 (Year 3)**: 920 students (723 Boys, 197 Girls)
  - **Batch 2023 (Year 4)**: 910 students (737 Boys, 173 Girls)
  - **Total Active Students**: **2,767 Students**
- [x] Preserved each student's `name`, `father_name`, `roll_no`, and cumulative CGPA.
- [x] Strict dual-database isolation:
  - **Database 1 (Hostel Allotment DB)**: High-concurrency ACID PostgreSQL schema (`supabase/schema.sql` / `supabase/schema_allotment.sql`) managing student profiles, roommate lobbies, ranked preferences, and JOSAA round batch allocations.
  - **Database 2 (Gate Entry Security DB)**: Decoupled admin-only security database (`supabase/schema_gate.sql` & `src/lib/db/gate-db.ts`) with barcode scanner and curfew violations tracking.

### Phase 2: Vite + React 19 SPA & Express REST API Backend Migration
- [x] Migrated architecture from hybrid server components to a high-speed decoupled SPA:
  - **Vite 8 + React 19** frontend with Tailwind CSS v4 and React Router v7.
  - Dedicated **Express API server** (`server/index.ts`) handling all REST endpoints and business logic.
  - Hot module replacement (HMR) and concurrent development scripts (`npm run dev`).
  - Fast client-side routing across `/`, `/student`, `/admin`, `/admin/gate`, `/login`, `/login/student`, `/login/admin`, and `/auth/callback`.

### Phase 3: Official Google OAuth SSO & Institutional Domain Security
- [x] Implemented Google OAuth Single Sign-On (SSO) via Supabase Auth with strict institutional domain enforcement:
  - **Student Login**: Restricted to `^[0-9]{2}[a-z]{3}[0-9]{3}@\.?nith\.ac\.in$` (e.g., `25bee012@nith.ac.in`). Automatically links Google account to student record.
  - **Admin Login**: Restricted to official `@nith.ac.in` administrative accounts without requiring student roll numbers.
  - **Database Trigger**: Created PostgreSQL function and trigger `trg_check_nith_email_format` on `auth.users` to block unauthorized sign-ins at the database level.
  - **Hosted Callback (`/auth/callback`)**: Real-time account verification, role assignment, and redirection.
  - **Automated Fallback**: Retained 6-digit OTP and demo credentials for sandboxed testing.

### Phase 4: Student Profile Card & NITH Official Hostel Pathways
- [x] Student dashboard displays all required profile attributes:
  - **Name**
  - **Father's Name**
  - **Current CGPA**
  - **Year**
  - **Current Hostel**
  - **Next Hostel(s) Available**
- [x] Official NITH Hostel Pathway Implementation:
  - **Girls**:
    - **2nd Year**: Ambika Girls Hostel (`AGH`)
    - **3rd Year**: Parvati Girls Hostel (`PGH`), Satpura Girls Hostel (`SGH`)
    - **Final Year**: Manimahesh Girls Hostel (`MMGH`), Satpura (`SGH`), Parvati (`PGH`)
  - **Boys**:
    - **2nd Year**: Himadri Boys Hostel (`HBH`) (Current: Kailash Boys Hostel `KBH`)
    - **3rd Year**: Dhauladhar Boys Hostel (`DBH`), Neelkanth Boys Hostel (`NBH`)
    - **Final Year**: Himgiri Boys Hostel (`HGBH`), Vidhyanchal Boys Hostel (`VBH`), Udaygiri Boys Hostel (`UBH`)

### Phase 5: Game-Style Roommate Lobby (Invite & Accept System)
- [x] Multiplayer game lobby model:
  - Supports shared rooms only: **Fourlets (4 beds)** or **Triplets (3 beds)** (no singlets).
  - Visual player slots display: Slot 1 (Leader), Slot 2, Slot 3, Slot 4.
  - **Strict Peer Privacy Constraint**:
    - Students can **ONLY** browse, search, and invite peers of their **exact same academic year and gender**.
    - Boys only see boys of their year; girls only see girls of their year.
    - Cross-gender and cross-year invitations are strictly rejected by the backend repository.
  - Real-time incoming invite banners with **[Accept]** and **[Decline]** actions.
  - Automatic calculation of lobby priority merit score:
    $$\text{max\_cgpa} = \max_{m \in \text{accepted members}} (\text{CGPA}_m)$$

### Phase 6: Himadri Boys Hostel Layout & Step-by-Step Drill-Down Buttons
- [x] Exact floor-by-floor Fourlet and Triplet layout for Himadri Boys Hostel (`HBH`):
  - **Level G1**: 6 Fourlets (G-101, G-102, G-107..G-110), 6 Triplets (G-133..G-138)
  - **Level 1**: 12 Fourlets (101, 102, 107..116), 18 Triplets (118, 119, 124, 125, 127..140)
  - **Level 2**: 21 Fourlets (201..219, 224, 225), 15 Triplets (226..240)
  - **Level 3**: 25 Fourlets (301..325), 15 Triplets (326..340)
  - **Level 4**: 26 Fourlets (401..425, 439), 14 Triplets (426..438, 440)
  - **Level 5**: 27 Fourlets (501..525, 539, 540), 13 Triplets (526..538)
  - **Total Rooms**: Exactly 198 rooms (117 Fourlets, 81 Triplets)
- [x] **Step-by-Step Drill-Down Buttons**:
  - `Hostel -> Floor (Level) -> Room`
  - Grouping strictly filters room selection by the team's sharing choice (`Fourlets` vs `Triplets`).
  - Preference ranking with Move Up, Move Down, and Remove controls.
  - Final choice locking (`POST /api/group/preferences`).

### Phase 7: Multi-Round Automated Release & 30-Minute Choice Window Protocol
- [x] Multi-round JOSAA batch scheduling across 5 standard rounds + 1 Final Spot Round:
  - Automated 2-hour release timer (`auto_release_interval_ms = 7200000`).
  - Automatic background round advancement (`checkAutoAdvanceRound()`).
- [x] **30-Minute Choice Window Protocol**:
  - Following round publication, all unallotted groups are unlocked (`is_locked = false`).
  - Groups have a 30-minute window (`choice_filling_end_time`) to modify, add, or reprioritize preferences for subsequent rounds.
  - Groups can unlock locked choices via `POST /api/group/unlock` during the window.
  - Submissions and unlocks after window expiration are strictly rejected.
- [x] **Admin Early-Publish Guard**:
  - Early publishing during the active 30-minute choice window is strictly blocked with HTTP 403 Forbidden.
  - After the 30-minute window, admins can immediately trigger round release (`POST /api/admin/publish-next-round`), overriding the remaining 2-hour countdown.
- [x] **Final Spot Round & Round Reset**:
  - Following Round 5, unallotted students enter Final Spot Round (`POST /api/admin/run-final-round`) with access to all remaining vacant rooms.
  - Full system reset endpoint (`POST /api/admin/reset-rounds`) to restore all rooms and reset rounds to initial state.

### Phase 8: Real-Time Room Occupancy & Vacancy Auditing
- [x] Room Occupancy Report endpoint `GET /api/admin/room-occupancy-report`:
  - Tracks total rooms (902), available vacant rooms, occupied/allotted rooms, and overall occupancy rate.
  - Detailed hostel-by-hostel breakdown of Triplet and Fourlet vacancies.
  - Occupant lists with student roll numbers, names, CGPAs, genders, and allotment round numbers.
  - Mathematical room conservation invariant verified:
    $$\text{Available Rooms} + \text{Occupied Rooms} \equiv \text{Total Campus Rooms } (902)$$
- [x] Interactive UI dashboards in both Admin and Student portals displaying live occupancy metrics and vacancy badges.

### Phase 9: Gate Security Terminal & Admin Governance
- [x] Protected endpoint `GET /api/student/[barcode_id]` checking `admin_session` cookie (403 forbidden for unauthorized students).
- [x] Curfew checking against 22:00:00 (or hostel-specific curfew) with automated warden alert dispatch.
- [x] Top-level 2-option system switcher between Allotment Engine and Gate Terminal.

---

## 📊 Testing & Build Metrics

| Metric | Result |
|---|---|
| Active Students Ingested | **2,767 Students** (100% of 2023, 2024, 2025 cohorts) |
| Total Hostel Rooms Generated | **902 Rooms** |
| Himadri Boys Hostel Rooms | **198 Rooms** (Exact specification match) |
| Core Automated Integration Tests | **56 / 56 Passed (100%)** (`scripts/test-portal.ts`) |
| API Occupancy & Choice Window Tests | **22 / 22 Passed (100%)** (`scripts/test-api-occupancy.ts`) |
| **Total Automated Tests** | **78 / 78 Passed (100%)** |
| Production Build Status | **Compiled successfully with Vite (0 errors)** |

---

## 🛠️ Verification Commands

```bash
# Run core 56-point automated business logic test suite
npm test

# Run 22-point API occupancy & 30-minute choice window test suite
npx tsx scripts/test-api-occupancy.ts

# Run offline JOSAA allotment CLI batch engine
npm run allot

# Run production build check
npm run build

# Start local server (Express API + Vite SPA)
npm run dev
```
