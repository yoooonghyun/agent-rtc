# Plan: Console routing — v1

**Status**: Complete
**Spec**: .sdd/specs/console-routing-v1.md
**Created**: 2026-05-01

---

## Tasks

### 1. Refactor Shell to use Link-based navigation — Done

- Removed `activeNav` / `onNav` props from Shell
- Replaced `<button>` nav items with Next.js `<Link>` components
- Used `usePathname()` to determine active state
- Removed `NavId` type export

### 2. Create shared dashboard layout — Done

- Created `app/(dashboard)/layout.tsx` with Shell, RightRail, and DashboardProvider
- Created `components/dashboard/dashboard-provider.tsx` for polling logic
- All dashboard pages share this layout

### 3. Create per-section pages — Done

- `app/(dashboard)/page.tsx` — Overview: stats bar + agent/master summary cards
- `app/(dashboard)/agents/page.tsx` — AgentList with detail panel
- `app/(dashboard)/masters/page.tsx` — MasterPool management
- `app/(dashboard)/messages/page.tsx` — MessageLog with queue stats table

### 4. Enhance messages page — Done

- Added informational note about session-only messages
- Added queue message stats table showing queued messages, consumers, and status per agent

### 5. Clean up — Done

- Removed old single-page `app/page.tsx`
- Build passes with all routes: `/`, `/agents`, `/masters`, `/messages`

## Deviations

- Used route group `(dashboard)` instead of individual route segments to keep a single shared layout
- Created `DashboardProvider` as a separate component rather than inlining polling in the layout, for cleaner separation of concerns
