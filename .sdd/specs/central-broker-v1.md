# Spec: Central Broker — v1

**Status**: Draft
**Created**: 2026-04-19
**Supersedes**: agent-bridge-channel-v1 (포트 기반 직접 통신 → 브로커 기반으로 전환)
**Related plan**: [.sdd/plans/central-broker-v1.md]

---

## Overview

단일 HTTP 서버(브로커)가 모든 agent 세션의 메시지를 중계한다. 각 agent는 고유 ID로 등록되며, 포트를 알 필요 없이 agentId로 메시지를 주고받는다.

## User Scenarios

### Agent 등록 및 메시지 전송 · P1

**As a** Claude Code 세션
**I want to** 브로커에 등록 후 다른 agent에게 agentId로 메시지를 전송하고
**So that** 상대 포트를 몰라도 통신할 수 있다

**Acceptance criteria:**

- Given 브로커가 실행 중일 때, when agent가 `POST /register` 하면, then agentId가 등록된다
- Given agent-a와 agent-b가 등록되어 있을 때, when agent-a가 `POST /send` 로 agent-b에 메시지를 보내면, then agent-b가 `GET /poll` 로 해당 메시지를 수신한다

### 다수 Agent 지원 · P1

**As a** 개발자
**I want to** 3개 이상의 agent를 동시에 등록하고
**So that** 다자간 통신이 가능하다

**Acceptance criteria:**

- Given 3개 agent가 등록되어 있을 때, when agent-a가 agent-c에게 메시지를 보내면, then agent-b는 수신하지 않고 agent-c만 수신한다

### Channel MCP 통합 · P1

**As a** Claude Code 세션
**I want to** channel MCP 서버가 브로커와 자동으로 통신하고
**So that** Claude가 reply tool로 자연스럽게 메시지를 보낼 수 있다

**Acceptance criteria:**

- Given Claude가 channel과 함께 실행 중일 때, when 브로커에서 메시지가 도착하면, then `<channel>` 태그로 Claude에 push된다
- Given Claude가 reply tool을 호출할 때, when targetAgent와 text를 전달하면, then 브로커를 통해 대상 agent에 전달된다

---

## Functional Requirements

| ID     | Requirement                                                              |
|--------|--------------------------------------------------------------------------|
| FR-001 | 브로커는 단일 포트에서 HTTP 서버로 실행되어야 한다 (MUST)               |
| FR-002 | `POST /register` — agent 등록. body: `{ agentId, displayName }` (MUST). agentId는 human-readable 문자열이거나, displayName으로 별도 지정 가능 |
| FR-003 | `POST /send` — 메시지 전송. body: `{ from, to, text }` (MUST)           |
| FR-004 | `GET /poll?agentId=<id>` — 수신 메시지 조회 및 소비 (MUST)              |
| FR-005 | `GET /agents` — 등록된 agent 목록 반환 (agentId + displayName) (SHOULD) |
| FR-006 | `GET /health` — 헬스체크 (MUST)                                          |
| FR-007 | channel MCP 서버는 브로커에 자동 등록하고 polling해야 한다 (MUST)       |
| FR-008 | reply tool은 targetAgent(agentId)와 text를 인자로 받아야 한다 (MUST)    |
| FR-009 | 브로커 URL은 환경변수(`BROKER_URL`)로 설정 가능해야 한다 (MUST)         |
| FR-010 | agentId는 환경변수(`AGENT_ID`), displayName은 환경변수(`AGENT_DISPLAY_NAME`)로 설정 가능해야 한다 (MUST) |

## Edge Cases & Constraints

- 존재하지 않는 agentId로 send → 404 반환
- 같은 agentId로 중복 등록 → 기존 등록 덮어쓰기 (idempotent)
- 브로커 다운 시 channel 서버의 polling 실패 → 재시도 (간격: 3초)
- 메시지 큐는 메모리에만 유지 (PoC 범위, persistence 없음)

## Success Criteria

| ID     | Criterion                                                                |
|--------|--------------------------------------------------------------------------|
| SC-001 | 브로커에 2개 agent 등록 후 메시지 송수신 성공                            |
| SC-002 | channel MCP를 통해 Claude 세션 간 양방향 통신 성공                       |
| SC-003 | 모든 agent가 단일 브로커 포트만 알면 통신 가능                           |

---

## Open Questions

- [ ] Polling 간격은 얼마가 적절한가? → 1초로 시작
- [ ] broadcast(전체 발송) 기능이 필요한가? → v1에서는 범위 외
