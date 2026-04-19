# Agent Bridge Channel — Design

## v1: Direct Port-to-Port (bridge-channel)

```
Session A (port 8001)                    Session B (port 8002)
  Claude ←stdio→ bridge MCP ──HTTP POST→ bridge MCP ←stdio→ Claude
  Claude ←stdio→ bridge MCP ←HTTP POST── bridge MCP ←stdio→ Claude
```

각 세션이 독립 HTTP 서버를 실행하고, 상대 포트로 직접 메시지 전송.
한계: agent마다 포트 할당 필요, 상대 포트를 알아야 함.

## v2: Central Broker (broker + broker-channel)

```
Session A ──┐                         ┌── Session B
(broker-    ├──▶ Broker (port 8000) ◀─┤   (broker-
 channel)   │    register/send/poll   │    channel)
Session C ──┘                         └── Session D
```

### Components

1. **Broker** (`src/broker.ts`): 단일 HTTP 서버
   - `POST /register` — agent 등록 (agentId + displayName)
   - `POST /send` — 메시지 전송 (from, to, text)
   - `GET /poll?agentId=<id>` — 수신 메시지 조회 및 소비
   - `GET /agents` — 등록된 agent 목록
   - `GET /health` — 헬스체크

2. **Broker Channel** (`src/broker-channel.ts`): MCP Channel 서버
   - 브로커에 자동 등록
   - polling으로 수신 메시지를 MCP notification으로 push
   - `reply` tool: agentId로 메시지 전송
   - `list_agents` tool: 등록된 agent 목록 조회

### Message Flow

1. Agent A의 Claude가 `reply(targetAgent: "agent-b", text: "hello")` 호출
2. broker-channel이 `POST /send { from: "agent-a", to: "agent-b", text: "hello" }` 전송
3. Agent B의 broker-channel이 `GET /poll?agentId=agent-b`로 메시지 수신
4. MCP notification → Claude에 `<channel from="agent-a" from_name="리서처">hello</channel>` 도착

### Key Decisions

- **Polling over WebSocket**: PoC 단순성 우선. 1초 간격 polling.
- **메모리 큐**: persistence 없음. 브로커 재시작 시 메시지 유실.
- **agentId + displayName**: 라우팅은 agentId, 사용자 표시는 displayName.

## v3: Permission Relay with Global Master Pool

### Architecture

```
Master A ←──┐
Master C ←──┤  fan-out
            │
Agent B ──▶ Broker ──▶ [Master A, Master C]  (동시 전송)
  permission        첫 verdict wins
  request
```

### Broker API

- `POST /masters/add` — master pool에 추가 (`{ masterAgentId }`)
- `POST /masters/remove` — master pool에서 제거 (`{ masterAgentId }`)
- `GET /masters` — master pool 목록 반환

### broker-channel Tools

- `add_master(masterAgentId)` — global master 추가
- `remove_master(masterAgentId)` — global master 제거
- `list_masters()` — master pool 조회

### Permission Relay Flow

1. Agent B에서 tool 사용 시 permission 필요
2. Claude Code → broker-channel: `permission_request` notification
3. broker-channel이 `GET /masters`로 master pool 조회
4. 모든 master에게 `POST /send`로 fan-out 전송
5. 아무 master가 `yes/no <id>` verdict 전송
6. Agent B의 broker-channel이 poll로 verdict 수신
7. `notifications/claude/channel/permission` 발행 → Claude Code가 적용

### Key Decisions

- **Global over per-agent master**: 모든 agent의 permission이 같은 master pool에 전달
- **Fan-out with `Promise.allSettled`**: 일부 master가 미등록이어도 나머지에 전달
- **First verdict wins**: Claude Code 기본 동작 활용, 추가 구현 불필요
