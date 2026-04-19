# Spec: Permission Relay — v1

**Status**: Approved
**Created**: 2026-04-19
**Supersedes**: N/A
**Related plan**: [.sdd/plans/permission-relay-v1.md]

---

## Overview

Channel MCP 서버에 permission relay 기능을 추가하여, agent가 tool 사용 승인이 필요할 때 등록된 master agent에게 승인 요청을 전달하고, 원격으로 승인/거부할 수 있게 한다. Master agent는 브로커 API를 통해 동적으로 등록/변경한다.

## User Scenarios

### Master Agent 등록 · P1

**As a** Session A (master) 사용자
**I want to** Session B의 master agent로 자신을 등록하고
**So that** Session B의 permission 요청을 이 세션에서 처리할 수 있다

**Acceptance criteria:**

- Given Session A와 B가 브로커에 등록되어 있을 때, when `set_master(agentId: "session-b", masterAgentId: "session-a")` 를 호출하면, then 브로커에 master 관계가 저장된다
- Given master가 등록된 후, when `get_master(agentId: "session-b")` 를 호출하면, then `session-a`가 반환된다

### 원격 Permission 승인 · P1

**As a** Master agent 사용자
**I want to** 하위 agent가 permission이 필요한 작업을 할 때 이 세션에서 승인/거부하고
**So that** 하위 agent 터미널에 직접 가지 않아도 된다

**Acceptance criteria:**

- Given Session B에 master가 등록되어 있고 Bash tool 등이 permission을 요구할 때, when broker-channel이 permission request를 브로커를 통해 master에 전달하면, then master 세션에 승인 요청이 `<channel>` 태그로 도착한다
- Given master가 `reply(targetAgent: "session-b", text: "yes abcde")` 로 응답하면, then Session B의 permission dialog가 승인되어 tool이 실행된다

### 원격 Permission 거부 · P1

**As a** Master agent 사용자
**I want to** 위험한 작업을 거부하고
**So that** 하위 agent가 해당 tool을 실행하지 않는다

**Acceptance criteria:**

- Given master가 `reply(targetAgent: "session-b", text: "no abcde")` 로 응답하면, then Session B의 permission dialog가 거부된다

### Master 동적 변경 · P2

**As a** 개발자
**I want to** runtime에 master agent를 변경하고
**So that** permission 관리 주체를 유연하게 바꿀 수 있다

**Acceptance criteria:**

- Given Session B의 master가 session-a일 때, when `set_master(agentId: "session-b", masterAgentId: "session-c")` 를 호출하면, then 이후 permission은 session-c에 전달된다

---

## Functional Requirements

| ID     | Requirement                                                                                  |
|--------|----------------------------------------------------------------------------------------------|
| FR-001 | broker-channel은 `claude/channel/permission` capability를 항상 선언해야 한다 (MUST)         |
| FR-002 | 브로커는 `POST /master` API를 제공해야 한다. body: `{ agentId, masterAgentId }` (MUST)       |
| FR-003 | 브로커는 `GET /master?agentId=<id>` API를 제공해야 한다 (MUST)                               |
| FR-004 | broker-channel은 `set_master` tool을 노출해야 한다 (MUST)                                    |
| FR-005 | broker-channel은 `get_master` tool을 노출해야 한다 (MUST)                                    |
| FR-006 | broker-channel은 polling 시 브로커에서 master 정보를 갱신해야 한다 (MUST)                    |
| FR-007 | permission request 수신 시 등록된 master agent에 브로커를 통해 전달해야 한다 (MUST)          |
| FR-008 | 전달 메시지에 request_id, tool_name, description, input_preview를 포함해야 한다 (MUST)       |
| FR-009 | 수신 메시지 중 `yes <id>` / `no <id>` 패턴을 verdict로 인식해야 한다 (MUST)                 |
| FR-010 | verdict 인식 시 `notifications/claude/channel/permission`을 발행해야 한다 (MUST)             |
| FR-011 | verdict가 아닌 일반 메시지는 기존대로 channel notification으로 전달해야 한다 (MUST)          |
| FR-012 | master 미등록 시 permission request는 stderr 경고 후 skip해야 한다 (MUST)                    |

## Edge Cases & Constraints

- master agent가 브로커에 등록되지 않은 경우 → `POST /master`에서 404 반환
- master agent가 설정되지 않은 agent에서 permission 발생 → stderr 경고, relay skip
- 잘못된 request_id로 verdict 전송 → Claude Code가 무시 (기존 동작)
- 이 기능은 `--dangerously-skip-permissions` 없이 실행한 세션에서만 의미 있음
- master 등록은 브로커 메모리에만 저장 (PoC 범위)

## Success Criteria

| ID     | Criterion                                                                            |
|--------|--------------------------------------------------------------------------------------|
| SC-001 | `set_master` tool로 master 등록 성공                                                 |
| SC-002 | `get_master` tool로 master 조회 성공                                                 |
| SC-003 | Session B의 permission 요청이 master session에 `<channel>` 태그로 도착               |
| SC-004 | master에서 `yes <id>` 응답 시 Session B의 tool이 실행됨                              |
| SC-005 | master에서 `no <id>` 응답 시 Session B의 tool이 거부됨                               |

---

## Open Questions

- [x] input_preview도 함께 전달할 것인가? → 전달한다
- [x] master 등록 방식 → 환경변수 아닌 브로커 API로 동적 등록
