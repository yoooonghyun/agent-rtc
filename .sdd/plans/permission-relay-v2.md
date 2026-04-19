# Plan: Permission Relay — v2

**Status**: Done
**Created**: 2026-04-19
**Last updated**: 2026-04-19
**Spec**: [.sdd/specs/permission-relay-v2.md]

---

## Summary

Convert the broker's per-agent master to a global master pool and change broker-channel's permission relay to fan-out to all registered masters.

## Technical Context

| Item              | Value                                     |
|-------------------|-------------------------------------------|
| Language          | TypeScript (Node.js v25+)                 |
| Key dependencies  | `@modelcontextprotocol/sdk`, `zod`        |
| Files modified    | `src/broker.ts`, `src/broker-channel.ts`, `src/broker.test.ts` |

---

## Implementation Checklist

### Phase 1 — Interface

- [x] types.ts: No changes needed

### Phase 2 — Testing

- [x] broker.test.ts: `POST /masters/add`
- [x] broker.test.ts: `GET /masters` list
- [x] broker.test.ts: `POST /masters/remove`
- [x] broker.test.ts: duplicate add → idempotent
- [x] broker.test.ts: remove non-existent → 200

### Phase 3 — Implementation

- [x] broker.ts: Replace per-agent master API with global master pool API
- [x] broker-channel.ts: Replace `set_master`, `get_master` with `add_master`, `remove_master`, `list_masters`
- [x] broker-channel.ts: Permission relay changed to `Promise.allSettled` fan-out
- [x] broker-channel.ts: `fetchMaster()` → `fetchMasters()`
- [x] All tests pass (13/13)

### Phase 4 — Docs

- [x] Update plan
- [x] Update ARCHITECTURE.md

---

## Deviations & Notes

- **2026-04-19**: Implemented per spec, no deviations.
