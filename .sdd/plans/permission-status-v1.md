# Plan: Permission status matching and auto-approve — v1

**Status**: Done
**Created**: 2026-05-01
**Last updated**: 2026-05-01
**Spec**: .sdd/specs/permission-status-v1.md

---

## Summary

Add two features to the console chat component: (1) match permission_response messages to their originating permission_request by requestId and replace approve/deny buttons with a status badge, and (2) add an auto-approve toggle switch in the chat header that automatically approves incoming permission requests.

## Technical Context

| Item              | Value                                          |
|-------------------|------------------------------------------------|
| Language          | TypeScript / React (Next.js)                   |
| Key dependencies  | shadcn Badge, shadcn Switch, Zustand (optional)|
| Files to create   | None (may need to add shadcn Switch component) |
| Files to modify   | console/components/dashboard/chat.tsx          |

---

## Implementation Checklist

### Phase 1 — Setup

- [ ] Add shadcn Switch component if not present: `npx shadcn@latest add switch`
- [ ] Verify shadcn Badge component exists

### Phase 2 — Permission status matching

- [ ] In Chat component, compute a Map of requestId -> verdict ("approved"|"denied") from all permission_response messages
- [ ] Parse response text for patterns: `yes {requestId}` or `no {requestId}` (possibly prefixed with "Approved..." or "Denied...")
- [ ] Pass responded status to PermissionBubble component
- [ ] In PermissionBubble: if request is already responded, hide approve/deny buttons and show Badge instead
- [ ] Badge uses design system colors: success variant for approved, destructive for denied

### Phase 3 — Auto-approve toggle

- [ ] Add auto-approve state (useState or useRef) in Chat component
- [ ] Add Switch + label in the chat header, next to the filter dropdown
- [ ] Track previously-seen message IDs to distinguish new arrivals from existing messages
- [ ] In poll callback: when auto-approve is on and a new permission_request arrives, call sendPermissionVerdict automatically
- [ ] Style toggle per design system (no hardcoded hex)

### Phase 4 — Verification

- [ ] TypeScript compiles cleanly (`npx tsc --noEmit`)
- [ ] Manual visual check: responded requests show badges, auto-approve works
- [ ] Update this plan with deviations

---

## Deviations & Notes

> Record here anything that differed from the plan during implementation. Date each entry.

- **2026-05-01**: Used component-local useState for auto-approve state rather than Zustand, keeping it simple since persistence across reloads was explicitly out of scope.
- **2026-05-01**: Used a seenMessageIdsRef with an initial-load effect to prevent auto-approve from firing on existing messages when the toggle is first enabled. The auto-approve effect only fires for messages not yet in the seen set.
- **2026-05-01**: Badge uses inline style with design system CSS variables rather than shadcn variant classes, since the Badge component's built-in variants don't map directly to the design system's success/error colors.
