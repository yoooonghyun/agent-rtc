# Spec: Permission Relay — v2

**Status**: Draft
**Created**: 2026-04-19
**Supersedes**: permission-relay-v1 (per-agent master → global master pool + fan-out)
**Related plan**: [.sdd/plans/permission-relay-v2.md]

---

## Overview

Master agent를 per-agent가 아닌 브로커 글로벌로 등록한다. 여러 master를 등록할 수 있으며, permission relay 시 모든 master에게 fan-out한다. 먼저 도착한 verdict가 적용된다.

## User Scenarios

### Global Master 등록 · P1

**As a** 개발자
**I want to** 브로커에 master agent를 글로벌로 등록하고
**So that** 모든 agent의 permission이 해당 master들에게 전달된다

**Acceptance criteria:**

- Given 브로커가 실행 중일 때, when `add_master(masterAgentId: "session-a")` 를 호출하면, then session-a가 global master pool에 추가된다
- Given session-a와 session-c가 master로 등록되어 있을 때, when `list_masters()` 를 호출하면, then 두 agent가 모두 반환된다

### Fan-out Permission Relay · P1

**As a** master agent 사용자
**I want to** 어떤 agent든 permission이 필요할 때 모든 master에게 동시에 요청이 오고
**So that** 어느 master든 먼저 응답할 수 있다

**Acceptance criteria:**

- Given session-a, session-c가 master로 등록되고 session-b에서 permission이 발생할 때, when broker-channel이 permission request를 relay하면, then session-a와 session-c 모두에게 요청이 도착한다
- Given session-a가 `yes abcde`로 먼저 응답하면, then session-b의 tool이 실행되고 session-c의 응답은 무시된다

### Master 제거 · P2

**As a** 개발자
**I want to** 등록된 master를 제거하고
**So that** 더 이상 permission 요청을 받지 않는다

**Acceptance criteria:**

- Given session-a가 master로 등록되어 있을 때, when `remove_master(masterAgentId: "session-a")` 를 호출하면, then session-a가 master pool에서 제거된다

---

## Functional Requirements

| ID     | Requirement                                                                          |
|--------|--------------------------------------------------------------------------------------|
| FR-001 | 브로커는 `POST /masters/add` API를 제공해야 한다. body: `{ masterAgentId }` (MUST)   |
| FR-002 | 브로커는 `POST /masters/remove` API를 제공해야 한다. body: `{ masterAgentId }` (MUST)|
| FR-003 | 브로커는 `GET /masters` API를 제공해야 한다 — master pool 목록 반환 (MUST)           |
| FR-004 | broker-channel은 `add_master` tool을 노출해야 한다 (MUST)                            |
| FR-005 | broker-channel은 `remove_master` tool을 노출해야 한다 (MUST)                         |
| FR-006 | broker-channel은 `list_masters` tool을 노출해야 한다 (MUST)                          |
| FR-007 | permission request 발생 시 모든 global master에게 fan-out 전송해야 한다 (MUST)       |
| FR-008 | 기존 per-agent master API(`POST /master`, `GET /master`)는 제거한다 (MUST)           |
| FR-009 | broker-channel의 `set_master`, `get_master` tool은 제거한다 (MUST)                   |
| FR-010 | master pool이 비어있으면 permission relay를 skip하고 stderr 경고 (MUST)               |
| FR-011 | polling 시 master pool을 브로커에서 갱신해야 한다 (MUST)                              |

## Edge Cases & Constraints

- master pool에 등록되지 않은 agentId로 add → 브로커에 agent 등록 여부와 무관하게 허용 (나중에 등록될 수 있음)
- 같은 agentId를 중복 add → idempotent
- 존재하지 않는 agentId를 remove → 무시 (200 반환)
- 여러 master가 동시에 verdict 전송 → 먼저 도착한 것이 적용 (Claude Code 기본 동작)

## Success Criteria

| ID     | Criterion                                                                    |
|--------|------------------------------------------------------------------------------|
| SC-001 | `add_master` / `list_masters` / `remove_master` 정상 동작                    |
| SC-002 | permission 발생 시 모든 등록된 master에게 요청 도착                           |
| SC-003 | 아무 master의 verdict가 도착하면 permission이 처리됨                          |

---

## Open Questions

- [x] master 등록에 agent 사전 등록이 필요한가? → 불필요 (유연성 우선)
