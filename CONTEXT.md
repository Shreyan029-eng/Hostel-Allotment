# HostelMatrix — Project Context & System Architecture

## 🏛️ 1. Institutional Context (NITH)

This portal is designed for **National Institute of Technology Hamirpur (NITH)**, Himachal Pradesh, India.

- **Student Identity**: Students are uniquely identified across college systems by their **Roll Number** (e.g., `25BEE012`, `24BCS048`, `23BMS022`).
- **Institutional Email**: Every student possesses a college email formatted strictly as:
  $$\text{roll\_number} + \text{"@nith.ac.in"} \quad \text{e.g., } \texttt{25bee012@nith.ac.in}, \texttt{24bme039@nith.ac.in}, \texttt{23bms022@nith.ac.in}$$
- **Active Cohorts (2026–2027)**:
  - **Batch 2025** $\rightarrow$ **2nd Year** ($N = 937$)
  - **Batch 2024** $\rightarrow$ **3rd Year** ($N = 920$)
  - **Batch 2023** $\rightarrow$ **Final Year** ($N = 910$)
  - **Total Active Students**: **2,767 Students**
  - Cohorts prior to 2023 (2020, 2021, 2022) have graduated and are excluded from active allotment.

---

## 🗄️ 2. Dual Database Architecture (Strict Decoupling)

To guarantee high availability and prevent performance degradation during peak JOSAA traffic (5,000+ concurrent requests), the system is partitioned into two isolated databases:

### Database 1: Hostel Allotment Database (`schema_allotment.sql`)
- Strict ACID PostgreSQL database with row-level locking.
- Tables: `STUDENTS`, `HOSTELS`, `ROOMS`, `GROUPS`, `GROUP_MEMBERS`, `GROUP_INVITES`, `PREFERENCES`, `ALLOTMENTS`, `ROUNDS_CONFIG`.
- Manages student OTP sessions, custom game-style roommate lobbies, ranked preference lists, and offline JOSAA batch scheduling.

### Database 2: Campus Gate Entry Security Database (`schema_gate.sql`)
- Dedicated security operations database accessible **strictly to college administrators, wardens, and security officers**.
- Tables: `GATE_STUDENT_REGISTRY`, `GATE_LOGS`, `ADMIN_USERS`.
- Optimized for sub-millisecond barcode scanning (`GET /api/student/[barcode_id]`) and curfew violation alerting.
- Unauthorized students attempting to access gate data receive an HTTP 403 Forbidden response.

---

## 🔐 3. Authentication & Navigation Flows

### A. Welcome / Entry Screen (`/`)
Presents **exactly two options**:
1. **Student Login** $\rightarrow$ `/login/student`
2. **Admin Login** $\rightarrow$ `/login/admin`

### B. Admin Navigation (2 Options)
When an administrator logs in, they are presented with **exactly two options**:
1. **Hostel Allotment System** $\rightarrow$ `/admin` (JOSAA batch allocation, quota monitor, publish controls)
2. **Gate Entry Security System** $\rightarrow$ `/admin/gate` (Barcode scanner HUD, curfew alert logs)

### C. Student 6-Digit OTP Authentication
- Student submits their college email (`roll_number@nith.ac.in`) or roll number.
- The server generates a random 6-digit OTP code (`POST /api/auth/student/send-otp`).
- Dispatched to their institutional inbox (simulated in UI with instant dispatch details and autofill capability for demonstration).
- Verification (`POST /api/auth/student/verify-otp`) authenticates the student and sets secure HTTP-only cookies (`student_session`, `student_roll`).

---

## 🏠 4. Official NITH Hostel Pathways & Pathways Matrix

### A. Girls Hostels Pathway
- **2nd Year**: Ambika Girls Hostel (`AGH`)
- **3rd Year**: Parvati Girls Hostel (`PGH`), Satpura Girls Hostel (`SGH`)
- **Final Year**: Manimahesh Girls Hostel (`MMGH`), Satpura Girls Hostel (`SGH`), Parvati Girls Hostel (`PGH`)

### B. Boys Hostels Pathway
- **2nd Year**: Himadri Boys Hostel (`HBH`) (Current: Kailash Boys Hostel `KBH`)
- **3rd Year**: Dhauladhar Boys Hostel (`DBH`), Neelkanth Boys Hostel (`NBH`)
- **Final Year**: Himgiri Boys Hostel (`HGBH`), Vidhyanchal Boys Hostel (`VBH`), Udaygiri Boys Hostel (`UBH`)

---

## 🎮 5. Game-Style Roommate Lobby (Invite & Accept System)

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

## 📐 6. Himadri Boys Hostel (`HBH`) Exact Room Layout

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

## 🔘 7. Step-by-Step Choice Filling Buttons

Room selection follows an intuitive drill-down flow:
$$\text{Hostel Button} \longrightarrow \text{Floor / Level Button} \longrightarrow \text{Room Button}$$

- **Sharing Type Filter**: The room grid **strictly displays only rooms matching the group's sharing choice** (Fourlets vs. Triplets).
- **Preference List**: Selected rooms are added to ranked choices (Choice 1, Choice 2, Choice 3...) with Move Up, Move Down, and Remove options.
- **Locking Protocol**: The leader freezes and locks preferences once the lobby is complete.

---

## 🗂️ 8. Key Repository Files

- **Room Layout Generator**: `scripts/generate-himadri-rooms.ts`
- **Room Registry JSON**: `src/lib/db/nith-rooms.json` (902 total rooms)
- **Student Registry JSON**: `src/lib/db/nith-students.json` (2,767 active students)
- **Hostel Repository**: `src/lib/db/repository.ts`
- **Gate Database**: `src/lib/db/gate-db.ts`
- **Student Portal Component**: `src/components/StudentPortal.tsx`
- **Automated Test Suite**: `scripts/test-portal.ts` (36 test cases)
