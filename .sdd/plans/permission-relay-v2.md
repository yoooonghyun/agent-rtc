# Plan: Permission Relay — v2

**Status**: Done
**Created**: 2026-04-19
**Last updated**: 2026-04-19
**Spec**: [.sdd/specs/permission-relay-v2.md]

---

## Summary

브로커의 per-agent master를 global master pool로 전환하고, broker-channel의 permission relay를 fan-out 방식으로 변경한다.

## Technical Context

| Item              | Value                                     |
|-------------------|-------------------------------------------|
| Language          | TypeScript (Node.js v25+)                 |
| Key dependencies  | `@modelcontextprotocol/sdk`, `zod`        |
| Files to modify   | `src/broker.ts`, `src/broker-channel.ts`, `src/types.ts`, `src/broker.test.ts` |

---

## Implementation Checklist

### Phase 1 — Interface

- [x] types.ts: 변경 불필요

### Phase 2 — Testing

- [x] broker.test.ts: `POST /masters/add` 테스트
- [x] broker.test.ts: `GET /masters` 목록 반환 테스트
- [x] broker.test.ts: `POST /masters/remove` 테스트
- [x] broker.test.ts: 중복 add → idempotent 테스트
- [x] broker.test.ts: 존재하지 않는 master remove → 200 테스트

### Phase 3 — Implementation

- [x] broker.ts: per-agent master API 제거 → global master pool API 추가
- [x] broker-channel.ts: `set_master`, `get_master` 제거 → `add_master`, `remove_master`, `list_masters` 추가
- [x] broker-channel.ts: permission relay를 `Promise.allSettled` fan-out으로 변경
- [x] broker-channel.ts: `fetchMaster()` → `fetchMasters()` 변경
- [x] All tests pass (13/13)

### Phase 4 — Docs

- [x] Update plan
- [x] Update design.md

---

## Deviations & Notes

- **2026-04-19**: 스펙대로 구현, 특이 사항 없음.
