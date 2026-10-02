# HostelMatrix Allotment Portal — Progress Report

**Timestamp**: 2026-10-03T02:28:00+05:30  
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
  - **Database 1 (Hostel Allotment DB)**: High-concurrency ACID PostgreSQL schema (`supabase/schema_allotment.sql`) managing student profiles, roommate lobbies, ranked preferences, and JOSAA round batch allocations.
  - **Database 2 (Gate Entry Security DB)**: Decoupled admin-only security database (`supabase/schema_gate.sql` & `src/lib/db/gate-db.ts`) with barcode scanner and curfew violations tracking.

### Phase 2: Navigation & Authentication Protocol
- [x] **Entry Portal (`/`)**: Exactly two primary login paths:
  1. **Student Login** (`/login/student`)
  2. **Admin Login** (`/login/admin`)
- [x] **Admin Entry**: Exactly two options presented upon login and at the top of the admin suite:
  1. **Hostel Allotment System** (`/admin`)
  2. **Gate Entry Security System** (`/admin/gate`)
- [x] **Student 6-Digit OTP Authentication**:
  - Student logs in using their official college email (`roll_number@nith.ac.in`).
  - System generates a random 6-digit OTP code dispatched to their email (`POST /api/auth/student/send-otp`).
  - Student enters the 6-digit code for verification (`POST /api/auth/student/verify-otp`).
  - Sets secure HTTP-only cookies (`student_session`, `student_roll`).
  - Includes simulated dispatch banner and quick-pick demo chips for instant testing.

### Phase 3: Student Profile Card & NITH Official Hostel Pathways
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

### Phase 4: Game-Style Roommate Lobby (Invite & Accept System)
- [x] Completely removed code-based joining in favor of custom room lobby mechanics (like game lobbies).
- [x] Supports shared rooms only: **Fourlets (4 beds)** or **Triplets (3 beds)** (no singlets).
- [x] Visual player slots display: Slot 1 (Leader), Slot 2, Slot 3, Slot 4.
- [x] **Strict Peer Privacy Constraint**:
  - Students can **ONLY** browse and invite students of their **exact same academic year and gender**.
  - Boys only see boys of their year; girls only see girls of their year.
  - Cross-gender and cross-year invitations are strictly rejected by the backend repository.
- [x] Real-time incoming invite banners with **[Accept]** and **[Decline]** buttons.
- [x] Automatic calculation of lobby priority merit score:
  $$\text{max\_cgpa} = \max_{m \in \text{accepted members}} (\text{CGPA}_m)$$

### Phase 5: Himadri Boys Hostel Layout & Step-by-Step Drill-Down Buttons
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

### Phase 6: Gate Security Terminal & Admin Governance
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
| Automated Integration Tests | **36 / 36 Passed (100%)** |
| Production Build Status | **Compiled successfully (0 errors across 31 routes)** |

---

## 🛠️ Verification Commands

```bash
# Run 36-point automated business logic test suite
npm test

# Run offline JOSAA allotment CLI batch engine
npm run allot

# Run production build check
npm run build

# Start local server
npm run dev
```
