# Design System (JoSAA / NTA Institutional Clean Theme)

<!-- impeccable:design-schema 1 -->

## Design Intent & Atmosphere
Modeled after national engineering allocation portals like JoSAA (`josaa.nic.in`) and NTA (`nta.ac.in`). The visual language emphasizes administrative clarity, structural simplicity, low cognitive load, and disciplined color usage. It avoids multiple unnecessary colors, cuts out marketing fluff, and focuses strictly on candidate workflows: Choice Filling, Roommate Lobbies, Allotment Letters, and Gate Entry.

**Critical Instruction**: Never claim "official page of nit hamirpur" anywhere in copy or titles. Use clean institutional titles: "National Institute of Technology Hamirpur", "Hostel Allotment Portal", "HostelMatrix".

## Color Discipline (Minimal & Cohesive)

### Primary Institutional Colors
- **JoSAA Academic Navy**: `#0A2540` / `#003366` / Tailwind `blue-900` (`#1E3A8A`) — Primary header, navigation bar, primary buttons, and section title bars.
- **Deep Navy Hover**: `#081D33` / Tailwind `blue-950`.
- **Navy Tint**: `#EFF6FF` (`blue-50`), border `#BFDBFE` (`blue-200`), text `#1E3A8A` (`blue-900`).

### Surfaces & Backgrounds
- **Page Ground**: `#F8FAFC` (`slate-50`) / `#FFFFFF` (`white`) — Clean, neutral, high-readability backdrop.
- **Container / Card**: `#FFFFFF` (`white`) — Clean institutional panels with crisp 1px hairline border (`#E2E8F0` / `border-slate-200`).
- **Secondary Surfaces**: `#F1F5F9` (`slate-100`) / `#F8FAFC` (`slate-50`) — Table headers, informational banners.
- **Dividers**: `#E2E8F0` (`border-slate-200`).

### Semantic Color Restraint (No Multi-Color Clutter)
- Avoid using multiple decorative colors simultaneously.
- **Verified / Confirmed**: Green (`emerald-700`, `bg-emerald-50`, `border-emerald-200`) — strictly for confirmed room allotment and on-time gate scans.
- **Violation / Alert**: Red (`rose-700`, `bg-rose-50`, `border-rose-200`) — strictly for curfew violations and error alerts.
- **All other elements**: Use Academic Navy (`#1E3A8A`) or neutral Slate (`slate-700`, `slate-900`). No decorative purple, amber, or cyan badges.

### Text & Typography
- **Primary Typography**: `Albert Sans` (Interface) and `JetBrains Mono` (Roll numbers, ranks, timestamps, barcodes).
- **Headings**: `#0F172A` (`slate-900`) — Bold, solid, no gradient text.
- **Body / Labels**: `#334155` (`slate-700`).
- **Muted Notes**: `#64748B` (`slate-500`).
- **Low-Text Philosophy**: Eliminate walls of text. Replace paragraphs with compact bullet points, concise table columns, and clear action buttons.

## Components & JoSAA Patterns

### Header
- Structured institutional masthead with bilingual/national styling:
  - Top institutional identifier: "National Institute of Technology Hamirpur"
  - Portal Title: "Hostel Allotment & Security Portal"
  - Navy blue banner navigation.

### Candidate Activity Boards
- JoSAA-style candidate service cards with a crisp navy header, concise description, and direct action link.
- Notice ticker / Announcement strip for round deadlines and notifications.

### Candidate Dashboard (Student Portal)
- Candidate summary bar: Roll No, Name, Year, Branch, Merit CGPA.
- Tabular preference list with sequential rank order (#1, #2, #3).
- Clean room selection drill-down without excessive decoration.
