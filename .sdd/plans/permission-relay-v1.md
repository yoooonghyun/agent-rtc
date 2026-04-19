# Plan: Permission Relay — v1

**Status**: Done
**Created**: 2026-04-19
**Last updated**: 2026-04-19
**Spec**: [.sdd/specs/permission-relay-v1.md]

---

## Summary

브로커에 master agent 등록 API를 추가하고, broker-channel에 permission relay handler와 set_master/get_master tool을 구현한다. permission 발생 시 등록된 master에게 브로커를 통해 전달하고, master의 verdict를 polling으로 수신하여 처리한다.

## Technical Context

| Item              | Value                                     |
|-------------------|-------------------------------------------|
| Language          | TypeScript (Node.js v25+)                 |
| Key dependencies  | `@modelcontextprotocol/sdk`, `zod`        |
| Files to modify   | `src/broker.ts`, `src/broker-channel.ts`  |

---

## Implementation Checklist

### Phase 1 — Interface

- [x] types.ts는 기존 타입으로 충분 (추가 불필요)

### Phase 2 — Testing

- [x] broker.test.ts: 기존 8개 테스트 pass (regression 없음)
- [ ] master API 테스트 추가 필요 (후속)

### Phase 3 — Implementation

- [x] broker.ts: `POST /master`, `GET /master` API 추가
- [x] broker-channel.ts: `claude/channel/permission` capability 항상 선언
- [x] broker-channel.ts: `PermissionRequestSchema` notification handler
- [x] broker-channel.ts: poll 시 verdict 패턴 인식 → permission notification 발행
- [x] broker-channel.ts: `set_master`, `get_master` tool 추가
- [x] broker-channel.ts: poll 주기마다 `fetchMaster()` 호출
- [x] All existing tests pass (8/8)

### Phase 4 — Docs

- [x] Spec 업데이트 (환경변수 → 브로커 API 방식으로 변경 반영)
- [x] Plan 작성

---

## Deviations & Notes

- **2026-04-19**: 초기 구현에서 `PERMISSION_RELAY_TO` 환경변수 → `lastMessageFrom` 동적 추적 → 최종적으로 `MASTER_AGENT` 환경변수 → 브로커 API 동적 등록으로 3차례 변경됨. 스펙이 구현 후에 정리됨 (SDD 위반).
- **2026-04-19**: master API 전용 테스트는 아직 미작성. E2E 테스트로 대체 예정.
