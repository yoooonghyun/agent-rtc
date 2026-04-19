# Plan: Central Broker — v1

**Status**: Done
**Created**: 2026-04-19
**Last updated**: 2026-04-19
**Spec**: [.sdd/specs/central-broker-v1.md]

---

## Summary

단일 HTTP 브로커 서버와, 브로커에 연결하는 channel MCP 서버를 구현한다. 브로커는 agent 등록/메시지 큐/라우팅을 담당하고, channel MCP는 브로커를 polling하여 수신 메시지를 Claude에 push한다.

## Technical Context

| Item              | Value                                              |
|-------------------|----------------------------------------------------|
| Language          | TypeScript (Node.js v25+)                          |
| Key dependencies  | `@modelcontextprotocol/sdk`                        |
| Files to create   | `src/broker.ts`, `src/broker-channel.ts`, `src/broker.test.ts`, `src/broker-channel.test.ts` |
| Files to modify   | `src/types.ts`, `.mcp.json`                        |

---

## Implementation Checklist

### Phase 1 — Interface

- [x] 기존 types.ts에 브로커 관련 타입 추가: Agent, SendPayload, PollResponse 등
- [x] Review types with the spec

### Phase 2 — Testing

- [x] broker.test.ts: register → send → poll 흐름 테스트
- [x] broker.test.ts: 존재하지 않는 agentId로 send → 404
- [x] broker.test.ts: 중복 등록 → idempotent
- [x] broker.test.ts: GET /agents 목록 반환
- [x] broker.test.ts: 메시지가 대상 agent에만 전달됨
- [ ] broker-channel.test.ts: 스킵 — E2E로 대체

### Phase 3 — Implementation

- [x] `src/broker.ts`: HTTP 브로커 서버 (register, send, poll, agents, health)
- [x] `src/broker-channel.ts`: 브로커 연동 Channel MCP 서버
- [x] `.mcp.json` 업데이트
- [x] broker.test.ts 8/8 pass

### Phase 4 — Docs

- [x] Update this plan with any deviations
- [x] Update `.sdd/design.md`

---

## Deviations & Notes

- **2026-04-19**: broker-channel.test.ts는 MCP stdio 연결이 필요하여 단위 테스트가 복잡. 브로커 자체 테스트(8개)와 E2E 테스트로 대체.
- **2026-04-19**: list_agents tool 추가 — 스펙에는 없었으나 agent 목록 확인이 실용적이라 판단.
