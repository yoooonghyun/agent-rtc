# Spec: Agent Bridge Channel — v1

**Status**: Draft
**Created**: 2026-04-19
**Supersedes**: N/A
**Related plan**: [.sdd/plans/agent-bridge-channel-v1.md]

---

## Overview

Claude Code 세션 간 양방향 메시지 통신을 가능하게 하는 커스텀 Channel MCP 서버. 각 세션이 로컬 HTTP 서버를 통해 상대 세션에 메시지를 push하고, reply tool로 응답을 보낼 수 있다.

## User Scenarios

### 세션 간 메시지 전송 · P1

**As a** Claude Code 사용자
**I want to** Session A에서 Session B로 메시지를 보내고
**So that** Session B의 Claude가 해당 메시지를 수신하여 작업을 수행한다

**Acceptance criteria:**

- Given Session B가 channel 서버와 함께 실행 중일 때, when Session A가 Session B의 HTTP 포트로 메시지를 POST하면, then Session B의 Claude에 `<channel>` 이벤트가 도착한다
- Given Session B가 메시지를 수신했을 때, when Claude가 reply tool을 호출하면, then 응답이 Session A의 HTTP 포트로 전달된다

### 양방향 통신 · P1

**As a** Claude Code 사용자
**I want to** 두 세션이 서로 메시지를 주고받을 수 있고
**So that** 세션 간 협업 작업이 가능하다

**Acceptance criteria:**

- Given 두 세션이 각각 다른 포트로 channel 서버를 실행 중일 때, when 양쪽에서 서로에게 메시지를 보내면, then 각 세션의 Claude가 상대방의 메시지를 수신한다

### 외부 프로세스에서 작업 지시 · P2

**As a** 개발자
**I want to** curl 등 외부 프로세스에서 실행 중인 Claude 세션에 작업을 지시하고
**So that** 프로그래밍 방식으로 Claude에 태스크를 dispatch할 수 있다

**Acceptance criteria:**

- Given Session이 channel 서버와 함께 실행 중일 때, when `curl -X POST localhost:<port> -d "메시지"` 를 실행하면, then Claude가 해당 메시지를 수신하고 처리한다

---

## Functional Requirements

| ID     | Requirement                                                              |
|--------|--------------------------------------------------------------------------|
| FR-001 | 서버는 MCP `claude/channel` capability를 선언해야 한다 (MUST)           |
| FR-002 | 서버는 stdio transport로 Claude Code와 통신해야 한다 (MUST)             |
| FR-003 | 서버는 설정된 포트에서 HTTP 요청을 수신해야 한다 (MUST)                 |
| FR-004 | 수신된 HTTP POST body를 `notifications/claude/channel`로 push해야 한다 (MUST) |
| FR-005 | `reply` tool을 노출하여 Claude가 응답을 보낼 수 있어야 한다 (MUST)      |
| FR-006 | reply tool 호출 시 대상 세션의 HTTP 포트로 메시지를 전달해야 한다 (MUST) |
| FR-007 | 포트 번호는 환경변수(`BRIDGE_PORT`)로 설정 가능해야 한다 (MUST)         |
| FR-008 | `meta`에 `sender_port`를 포함하여 응답 대상을 식별할 수 있어야 한다 (SHOULD) |
| FR-009 | 서버는 `instructions`를 통해 Claude에게 채널 사용법을 안내해야 한다 (MUST) |

## Edge Cases & Constraints

- 상대 세션이 꺼져 있을 때 reply가 실패할 수 있다 → HTTP 에러를 tool 결과로 반환
- 같은 포트로 두 서버를 실행하면 충돌 → 포트 설정을 환경변수로 분리
- 대용량 메시지 → 본 PoC에서는 범위 외. 일반 텍스트 메시지만 지원
- 인증/보안 → 본 PoC에서는 localhost only, allowlist 미적용

## Success Criteria

| ID     | Criterion                                                                |
|--------|--------------------------------------------------------------------------|
| SC-001 | Session A에서 보낸 메시지가 Session B의 Claude에 `<channel>` 태그로 도착 |
| SC-002 | Session B의 Claude가 reply tool로 Session A에 응답 전달 성공             |
| SC-003 | curl로 보낸 메시지가 Claude 세션에 정상 도착                             |
| SC-004 | 두 세션 간 왕복(round-trip) 메시지 교환 성공                             |

---

## Open Questions

- [x] Runtime: Node.js 사용 확정
- [ ] 메시지 포맷을 JSON으로 구조화할 필요가 있는가? → v1에서는 plain text로 시작
