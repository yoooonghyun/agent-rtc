# Plan: Console dashboard — v1

**Status**: Done
**Created**: 2026-05-01
**Last updated**: 2026-05-01
**Spec**: .sdd/specs/console-dashboard-v1.md

---

## Summary

Build a monitoring console dashboard for agent-rtc using Next.js with shadcn/ui components. The dashboard follows the Toss design system with a 3-column layout (left nav, main canvas, right rail). Data is fetched from RabbitMQ Management API and managed via Zustand stores with polling auto-refresh.

## Technical Context

| Item              | Value                                                    |
|-------------------|----------------------------------------------------------|
| Language          | TypeScript (React / Next.js 16)                          |
| Key dependencies  | zustand, shadcn/ui, lucide-react, tailwindcss            |
| Files to create   | lib/api.ts, lib/stores.ts, lib/types.ts, app/page.tsx (rewrite), components/dashboard/* |
| Files to modify   | app/layout.tsx, app/globals.css                          |

---

## Implementation Checklist

### Phase 1 — Interface

- [x] Define types in lib/types.ts (Agent, Master, Message, Stats)
- [x] Define API client interface in lib/api.ts
- [x] Define Zustand store interface in lib/stores.ts

### Phase 2 — Testing

- [x] Skip for UI components (visual testing per task instructions)

### Phase 3 — Implementation

- [x] Create lib/types.ts — shared type definitions
- [x] Create lib/api.ts — RabbitMQ Management API client
- [x] Create lib/stores.ts — Zustand stores with polling
- [x] Update app/globals.css — add Toss design tokens
- [x] Update app/layout.tsx — Pretendard font, metadata
- [x] Create components/dashboard/shell.tsx — 3-column layout
- [x] Create components/dashboard/stats-bar.tsx — stat cards
- [x] Create components/dashboard/agent-list.tsx — agent table
- [x] Create components/dashboard/master-pool.tsx — master list
- [x] Create components/dashboard/message-log.tsx — message table
- [x] Create components/dashboard/right-rail.tsx — right rail with system status and online agents
- [x] Rewrite app/page.tsx — compose dashboard

### Phase 4 — Docs

- [x] Update this plan with any deviations

---

## Deviations & Notes

> Record here anything that differed from the plan during implementation. Date each entry.

- **2026-05-01**: Added `components/dashboard/right-rail.tsx` (not in original plan) to populate the 3-column layout's right rail with system status summary and online agent list.
- **2026-05-01**: Used inline `style` attributes for Toss design token CSS variables alongside Tailwind utility classes, since the shadcn/tailwind theme doesn't include Toss-specific color tokens natively.
