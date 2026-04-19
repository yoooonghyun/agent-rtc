# Plan: Dashboard — v1

**Status**: In Progress
**Created**: 2026-04-19
**Last updated**: 2026-04-19
**Spec**: [.sdd/specs/dashboard-v1.md]

---

## Summary

Port the broker from standalone HTTP server to Next.js Route Handlers. Extract state to a shared module. Add Tailwind CSS with DESIGN.md tokens. Dashboard UI comes after API porting is verified.

## Technical Context

| Item              | Value                                              |
|-------------------|----------------------------------------------------|
| Language          | TypeScript                                         |
| Key dependencies  | next, react, react-dom, tailwindcss                |
| Files to create   | `app/`, `lib/broker-state.ts`, `tailwind.config.ts` |
| Files to modify   | `package.json`, `tsconfig.json`                    |

---

## Implementation Checklist

### Phase 1 — Broker Porting

- [ ] Install Next.js + React + Tailwind
- [ ] Extract broker state (agents, queues, masterPool) to `lib/broker-state.ts`
- [ ] Port `POST /register` → `app/api/register/route.ts`
- [ ] Port `POST /send` → `app/api/send/route.ts`
- [ ] Port `GET /poll` → `app/api/poll/route.ts`
- [ ] Port `GET /agents` → `app/api/agents/route.ts`
- [ ] Port `GET /health` → `app/api/health/route.ts`
- [ ] Port `POST /masters/add` → `app/api/masters/add/route.ts`
- [ ] Port `POST /masters/remove` → `app/api/masters/remove/route.ts`
- [ ] Port `GET /masters` → `app/api/masters/route.ts`
- [ ] Verify broker-channel works against new API

### Phase 2 — Tailwind + Theme

- [ ] Configure tailwind.config.ts with DESIGN.md color tokens
- [ ] Set up global styles (parchment background, typography)

### Phase 3 — Dashboard UI

- [ ] Agent list component
- [ ] Master pool management component
- [ ] Message activity log component
- [ ] Auto-refresh via polling

### Phase 4 — Docs

- [ ] Update ARCHITECTURE.md
- [ ] Update plan with deviations

---

## Deviations & Notes
