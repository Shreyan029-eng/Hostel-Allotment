# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

1. **Enrolled Students (NIT Hamirpur)**: Undergraduate students from cohorts 2025 (Year 2), 2024 (Year 3), and 2023 (Year 4). They form roommate groups, choose hostel preferences according to eligibility, and monitor JOSAA seat allocation.
2. **Hostel Administration & Wardens**: Hostel wardens, Chief Warden, and Dean of Student Welfare (DoSW) who oversee quota matrices, trigger JOSAA allocation rounds, resolve disputes, and publish allotment results.
3. **Campus Gate Security Guards**: Security personnel scanning student barcode cards at campus entry gates, verifying room allotment status, and logging late entries.

## Product Purpose

A mission-critical, high-concurrency campus accommodation management and gate security ecosystem for National Institute of Technology Hamirpur (NITH), serving 5,000+ students. It replaces chaotic manual room allocation with transparent, merit-based JOSAA-style allocation while providing a decoupled gate entry terminal with curfew alerts.

## Positioning

Institutional fairness and auditability over generic SaaS. Transparent CGPA-ranked roommate grouping with atomic batch seat resolution, paired with a sub-millisecond barcode security verification engine decoupled from transactional booking tables.

## Operating Context

- High-stakes, time-sensitive allotment cycles where students experience anxiety over roommate selection and hostel seniority.
- Gate security desks operating outdoors or in campus gate cabins late at night with barcode scanners, requiring high contrast and instant feedback under varied lighting.
- Wardens requiring clear tabular oversight over seat occupancy, floor maps, and curfew exception logs.

## Capabilities and Constraints

- **Multi-Year Dynamic Eligibility**: Year 2 students view 1 hostel; Year 3 students view 2; Year 4 students view 3.
- **Roommate Pooling Algorithm**: Students form lobbies matching room capacity; allocation rank is dynamically computed using the group's highest `max_cgpa`.
- **Atomic Batch Engine**: JOSAA seat allocation executed via PostgreSQL `SELECT FOR UPDATE` atomic row locking to prevent race conditions.
- **Decoupled Security Database**: Independent gate entry schema with automated curfew violation detection (post-22:00:00) and warden dispatch.
- **Roll Number & Email Authentication**: NITH domain (`roll_no@nith.ac.in`) with 6-digit OTP verification.

## Brand Commitments

- **Tone**: Authoritative, calm, institutional, transparent, and dignified. Not a flashy gamer portal, neon crypto app, or generic purple SaaS.
- **Identity**: National Institute of Technology Hamirpur (NITH). Clean architectural styling, deep obsidian slate, academic navy, clear emerald/amber/crimson state indicators.

## Evidence on Hand

- Database schemas: `supabase/schema.sql`, `supabase/schema_allotment.sql`, `supabase/schema_gate.sql`, `supabase/seed.sql` (2,767 student records).
- Allotment engine scripts: `scripts/run-allotment.ts`, `scripts/generate-himadri-rooms.ts`.

## Product Principles

1. **Clarity Over Flash**: Information density, legible tabular hierarchy, and unambiguous status states over decorative animations and glowing card borders.
2. **Dignity in High-Stakes Moments**: Students waiting for seat allocation need clear timelines, verifiable rank rules, and transparent allotment records.
3. **Purposeful Semantics**: Every color signifies state (Allotted, Pending, Verified, Curfew Exception, Vacant). Never paint gradients or decorative color for its own sake.
4. **Resilient Touch & Visual Hierarchy**: High contrast, tactile controls, and solid text readability for mobile phone screens and handheld gate scanner tablets.

## Accessibility & Inclusion

- WCAG AA compliant contrast ratios (>= 4.5:1 for body copy, >= 3:1 for large headings).
- Semantic landmark navigation (`<main>`, `<header>`, `<nav>`, `<section>`).
- Touch targets >= 44x44px for primary interactions and scan triggers.
- Intentional, reduced-motion friendly transitions without disorienting bounce or jitter.
