# HostelMatrix — Project Context & System Architecture

## 🏛️ 1. Institutional Context (NITH)

This portal is designed for **National Institute of Technology Hamirpur (NITH)**, Himachal Pradesh, India.

- **Student Identity**: Students are uniquely identified across college systems by their **Roll Number** (e.g., `25BEE012`, `24BCS048`, `23BMS022`).
- **Institutional Email Format**:
  - **Students**: Strictly formatted as $\text{roll\_number} + \text{"@nith.ac.in"}$ (e.g., `25bee012@nith.ac.in`, `24bme039@nith.ac.in`, `23bms022@nith.ac.in`). Enforced via regex `^[0-9]{2}[a-z]{3}[0-9]{3}@\.?nith\.ac\.in$`.
  - **Administrators**: Official administrative email ending in `@nith.ac.in` (e.g., `admin@nith.ac.in`, `warden.himadri@nith.ac.in`, `security@nith.ac.in`).
- **Active Cohorts (2026–2027)**:
  - **Batch 2025** $\rightarrow$ **2nd Year** ($N = 937$)
  - **Batch 2024** $\rightarrow$ **3rd Year** ($N = 920$)
  - **Batch 2023** $\rightarrow$ **Final Year** ($N = 910$)
  - **Total Active Students**: **2,767 Students**
  - Cohorts prior to 2023 (2020, 2021, 2022) have graduated and are excluded from active allotment.

---

## 🏗️ 2. Full-Stack System Architecture

The application is structured as a high-performance decoupled Single Page Application (SPA) with an Express REST API backend:

- **Frontend Client**: Vite + React 19 SPA with Tailwind CSS v4, Lucide React icons, and React Router v7.
- **Backend API Server**: Node.js Express server (`server/index.ts`) running TypeScript via `tsx`.
- **Concurrency & Process Management**: `concurrently` orchestrating API (`npm run server`) on port 3001 and Web Client (`npm run client`) on port 5173 with Vite proxying `/api` requests.
- **Persistence Layer**: Dual-mode data access layer (`src/lib/db/repository.ts`) operating seamlessly across live Supabase PostgreSQL (with ACID transactions and Row-Level Security) and an in-memory ACID mock repository for instant local execution and automated testing.

---

## 🗄️ 3. Dual Database Architecture (Strict Decoupling)

To guarantee high availability and prevent performance degradation during peak JOSAA traffic (5,000+ concurrent requests), the system is partitioned into two isolated databases:

### Database 1: Hostel Allotment Database (`supabase/schema.sql` / `supabase/schema_allotment.sql`)
- Strict ACID PostgreSQL database with row-level locking.
- Tables: `students`, `hostels`, `rooms`, `groups`, `group_members`, `group_invites`, `preferences`, `allotments`, `rounds_config`.
- Manages student sessions, roommate lobbies, ranked preference lists, automated multi-round releases, and offline JOSAA batch scheduling.

### Database 2: Campus Gate Entry Security Database (`supabase/schema_gate.sql`)
- Dedicated security operations database accessible **strictly to college administrators, wardens, and security officers**.
- Tables: `gate_students_registry`, `gate_logs`, `gate_admins`.
- Optimized for sub-millisecond barcode scanning (`GET /api/student/[barcode_id]`) and curfew violation alerting.
- Unauthorized students attempting to access gate data receive an HTTP 403 Forbidden response.

---

## 🔐 4. Authentication & Navigation Flows

### A. Welcome / Entry Screen (`/`)
Presents **exactly two options**:
1. **Student Login** $\rightarrow$ `/login/student`
2. **Admin Login** $\rightarrow$ `/login/admin`

### B. Admin Navigation (2 Options)
When an administrator logs in, they are presented with **exactly two options**:
1. **Hostel Allotment System** $\rightarrow$ `/admin` (JOSAA multi-round management, quota monitor, publish controls, room occupancy audit)
2. **Gate Entry Security System** $\rightarrow$ `/admin/gate` (Barcode scanner HUD, curfew alert logs)

### C. Official Google OAuth SSO & Institutional Verification (`/auth/callback`)
- **Student Sign-In**:
  - Initiates Google OAuth via Supabase Auth restricted to the `nith.ac.in` domain.
  - Callback verifies email against `^[0-9]{2}[a-z]{3}[0-9]{3}@\.?nith\.ac\.in$`.
  - Links Google `auth.users` ID directly to student profile in `students` table.
  - Rejects unauthorized external or non-student emails with clear institutional feedback.
- **Admin Sign-In**:
  - Initiates Google OAuth for administrators.
  - Enforces official `@nith.ac.in` domain.
  - Automatically provisions or matches authorized administrative roles (`super_admin`, `warden`, `security_officer`).
- **Database Trigger Security**:
  - PostgreSQL trigger `trg_check_nith_email_format` executes `BEFORE INSERT ON auth.users` to block non-NITH accounts at the database engine level.
- **6-Digit OTP Fallback**:
  - Retained for automated testing and sandbox environments (`POST /api/auth/student/send-otp` & `POST /api/auth/student/verify-otp`).

---

## 🏠 5. Official NITH Hostel Pathways & Pathways Matrix

### A. Girls Hostels Pathway
- **2nd Year**: Ambika Girls Hostel (`AGH`)
- **3rd Year**: Parvati Girls Hostel (`PGH`), Satpura Girls Hostel (`SGH`)
- **Final Year**: Manimahesh Girls Hostel (`MMGH`), Satpura Girls Hostel (`SGH`), Parvati Girls Hostel (`PGH`)

### B. Boys Hostels Pathway
- **2nd Year**: Himadri Boys Hostel (`HBH`) (Current: Kailash Boys Hostel `KBH`)
- **3rd Year**: Dhauladhar Boys Hostel (`DBH`), Neelkanth Boys Hostel (`NBH`)
- **Final Year**: Himgiri Boys Hostel (`HGBH`), Vidhyanchal Boys Hostel (`VBH`), Udaygiri Boys Hostel (`UBH`)

---

## 🎮 6. Game-Style Roommate Lobby (Invite & Accept System)

Instead of code-based joining, roommate formation mirrors multiplayer game custom rooms:
- **Shared Rooms Only**: Lobbies are created for **Fourlets (4 beds)** or **Triplets (3 beds)**; singlets are excluded.
- **Player Slots**:
  - Slot 1: [Leader Badge] Student details (Name, Roll, Father's Name, CGPA)
  - Slots 2, 3, 4: Occupied member cards or empty slot with `+ Invite Peer` action.
- **Strict Peer Privacy Constraint**:
  - A student can **ONLY** browse, search, and invite peers of their **exact same academic year and gender**.
  - Boys can only invite boys of their year; girls can only invite girls of their year.
  - The repository strictly blocks cross-gender or cross-cohort invites.
- **Incoming Invites Panel**:
  - Displays inviter name, lobby type, and current count with **[Accept]** and **[Decline]** buttons.
- **Group Priority Metric**:
  $$\text{max\_cgpa} = \max_{m \in \text{accepted members}} (\text{CGPA}_m)$$

---

## 📐 7. Himadri Boys Hostel (`HBH`) Exact Room Layout

Himadri Boys Hostel accommodates 2nd-year students with exactly **198 rooms** across 6 levels:

| Level | Floor Index | Fourlet Rooms (4 Beds) | Triplet Rooms (3 Beds) | Total Rooms |
|---|---|---|---|---|
| **Level G1** | Floor 0 | G-101, G-102, G-107, G-108, G-109, G-110 ($N=6$) | G-133 to G-138 ($N=6$) | **12 Rooms** |
| **Level 1** | Floor 1 | 101, 102, 107 to 116 ($N=12$) | 118, 119, 124, 125, 127 to 140 ($N=18$) | **30 Rooms** |
| **Level 2** | Floor 2 | 201 to 219, 224, 225 ($N=21$) | 226 to 240 ($N=15$) | **36 Rooms** |
| **Level 3** | Floor 3 | 301 to 325 ($N=25$) | 326 to 340 ($N=15$) | **40 Rooms** |
| **Level 4** | Floor 4 | 401 to 425, 439 ($N=26$) | 426 to 438, 440 ($N=14$) | **40 Rooms** |
| **Level 5** | Floor 5 | 501 to 525, 539, 540 ($N=27$) | 526 to 538 ($N=13$) | **40 Rooms** |
| **Total** | | **117 Fourlet Rooms** | **81 Triplet Rooms** | **198 Rooms** |

---

## 🔘 8. Step-by-Step Choice Filling & Post-Round Modification

Room selection follows an intuitive drill-down flow:
$$\text{Hostel Button} \longrightarrow \text{Floor / Level Button} \longrightarrow \text{Room Button}$$

- **Sharing Type Filter**: The room grid **strictly displays only rooms matching the group's sharing choice** (Fourlets vs. Triplets).
- **Preference List**: Selected rooms are added to ranked choices (Choice 1, Choice 2, Choice 3...) with Move Up, Move Down, and Remove options.
- **30-Minute Choice Window Protocol**:
  - Immediately following any round publication, all unallotted groups are unlocked (`is_locked = false`).
  - Groups have a strict 30-minute window (`choice_filling_end_time`) to add, modify, or reorder their preferences for the next round.
  - The group leader can unlock choices via `POST /api/group/unlock` or re-lock choices via `POST /api/group/preferences`.
  - Once the 30-minute window ends, choices are permanently locked for allocation execution.

---

## 🔄 9. Multi-Round Automated Release & JOSAA Cycle Engine

The allocation engine executes in structured JOSAA-style rounds with automated cycle timers:
- **5 Regular Rounds + 1 Final Spot Round**:
  - Round 1 through Round 5 process candidates in descending order of group max CGPA.
  - Default cycle duration: **2 hours (7,200,000 ms)** per round.
  - Cycle breakdown: **30-minute choice modification window** + **90-minute batch allocation phase**.
- **Admin Early-Publish Guard**:
  - During the active 30-minute choice window, admin early publication is strictly rejected with HTTP 403 Forbidden to protect student submission rights.
  - Once the 30-minute window closes, administrators can manually trigger immediate round release (`POST /api/admin/publish-next-round`), overriding the remaining countdown.
- **Final Spot Round (Round 6)**:
  - Following Round 5, remaining unallotted groups enter the Final Spot Round (`POST /api/admin/run-final-round`).
  - Candidates can view and choose from all remaining vacant rooms across their designated hostel pathways.
- **Round Reset Protocol**:
  - Admins can trigger a complete system reset (`POST /api/admin/reset-rounds`) to restore all rooms to vacant status and re-initialize round tracking to Round 1 (unpublished).

---

## 📊 10. Real-Time Room Occupancy & Vacancy Auditing

The system maintains real-time tracking of room occupancy and vacancies:
- **Endpoint**: `GET /api/admin/room-occupancy-report`
- **Invariant Guarantee**:
  $$\text{Available Rooms} + \text{Occupied Rooms} \equiv \text{Total Campus Rooms } (902)$$
- **Audit Attributes**:
  - Total rooms count, vacant rooms left, occupied rooms, occupancy percentage.
  - Per-hostel breakdown of Triplet and Fourlet vacancies.
  - Detailed room records with occupant names, roll numbers, CGPAs, genders, and allotment round numbers.
- **Student Visibility**: Students can view live occupancy status to make informed choices during preference filling.

---

## 🗂️ 11. Key Repository Files

- **Vite & React Setup**: `src/App.tsx`, `vite.config.ts`, `index.html`
- **Express Server**: `server/index.ts`
- **Supabase Integration**: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`, `scripts/setup-supabase.ts`
- **Allotment Engine**: `src/lib/engine/allotment-engine.ts`
- **Hostel Repository**: `src/lib/db/repository.ts`
- **Room Registry JSON**: `src/lib/db/nith-rooms.json` (902 total rooms)
- **Student Registry JSON**: `src/lib/db/nith-students.json` (2,767 active students)
- **Gate Database**: `src/lib/db/gate-db.ts`
- **Components**: `src/components/StudentPortal.tsx`, `src/components/AdminDashboard.tsx`, `src/components/Navbar.tsx`
- **Pages**: `src/pages/HomePage.tsx`, `src/pages/StudentLoginPage.tsx`, `src/pages/AdminLoginPage.tsx`, `src/pages/AuthCallbackPage.tsx`, `src/pages/StudentPage.tsx`, `src/pages/AdminPage.tsx`, `src/pages/GatePage.tsx`
- **Automated Test Suites**:
  - `scripts/test-portal.ts` (56 automated tests)
  - `scripts/test-api-occupancy.ts` (22 automated tests)
