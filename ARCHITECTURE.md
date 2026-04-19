# Agent RTC — Architecture

## v1: Direct Port-to-Port (bridge-channel)

```
Session A (port 8001)                    Session B (port 8002)
  Claude ←stdio→ bridge MCP ──HTTP POST→ bridge MCP ←stdio→ Claude
  Claude ←stdio→ bridge MCP ←HTTP POST── bridge MCP ←stdio→ Claude
```

Each session runs an independent HTTP server and sends messages directly to the other's port.
Limitation: requires port allocation per agent and knowledge of the other's port.

## v2: Central Broker (broker + broker-channel)

```
Session A ──┐                         ┌── Session B
(broker-    ├──▶ Broker (port 8800) ◀─┤   (broker-
 channel)   │    register/send/poll   │    channel)
Session C ──┘                         └── Session D
```

### Components

1. **Broker** (`src/broker.ts`): Single HTTP server
   - `POST /register` — Register agent (agentId + displayName)
   - `POST /send` — Send message (from, to, text)
   - `GET /poll?agentId=<id>` — Retrieve and consume pending messages
   - `GET /agents` — List registered agents
   - `GET /health` — Health check

2. **Broker Channel** (`src/broker-channel.ts`): MCP Channel server
   - Auto-registers with broker on startup
   - Polls broker for incoming messages, pushes as MCP notifications
   - `reply` tool: Send message by agentId
   - `list_agents` tool: List registered agents

### Message Flow

1. Agent A's Claude calls `reply(targetAgent: "agent-b", text: "hello")`
2. broker-channel sends `POST /send { from: "agent-a", to: "agent-b", text: "hello" }`
3. Agent B's broker-channel receives via `GET /poll?agentId=agent-b`
4. MCP notification → Claude receives `<channel from="agent-a" from_name="Researcher">hello</channel>`

### Key Decisions

- **Polling over WebSocket**: Prioritizing PoC simplicity. 1-second polling interval.
- **In-memory queue**: No persistence. Messages lost on broker restart.
- **agentId + displayName**: Routing uses agentId, display uses displayName.

## v3: Permission Relay with Global Master Pool

### Architecture

```
Master A ←──┐
Master C ←──┤  fan-out
            │
Agent B ──▶ Broker ──▶ [Master A, Master C]  (simultaneous)
  permission        first verdict wins
  request
```

### Broker API

- `POST /masters/add` — Add to master pool (`{ masterAgentId }`)
- `POST /masters/remove` — Remove from master pool (`{ masterAgentId }`)
- `GET /masters` — List master pool

### broker-channel Tools

- `add_master(masterAgentId)` — Add global master
- `remove_master(masterAgentId)` — Remove global master
- `list_masters()` — Query master pool

### Permission Relay Flow

1. Agent B requires permission for a tool call
2. Claude Code → broker-channel: `permission_request` notification
3. broker-channel fetches master pool via `GET /masters`
4. Fan-out `POST /send` to all masters
5. Any master sends `yes/no <id>` verdict
6. Agent B's broker-channel receives verdict via poll
7. Emits `notifications/claude/channel/permission` → Claude Code applies it

### Key Decisions

- **Global over per-agent master**: All agents' permissions go to the same master pool
- **Fan-out with `Promise.allSettled`**: Delivery continues even if some masters are unreachable
- **First verdict wins**: Leverages Claude Code's built-in behavior, no extra implementation needed

## v4: Adaptive Feedback Agent

### Architecture

```
TaskCompleted (prompt hook)
    │
    ▼ (in-session, same process)
Claude spawns adaptive-feedback subagent
    ├── Scan tooling: CLAUDE.md, agents/, skills/, settings.json
    ├── Detect: repetitive patterns, user feedback, rule conflicts
    └── Write changes → CLAUDE.md, agents, skills, hooks
```

### Components

- **Agent**: `.claude/agents/adaptive-feedback.md` — sonnet model, restricted tools
- **Hook**: `prompt` type in `.claude/settings.json` — triggers in-session subagent

### Key Decisions

- **In-session execution**: `prompt` hook runs within the same Claude session — no external process, no race conditions
- **Direct writes over proposals**: Agent writes changes directly; user reviews via `git diff`
- **Restricted tool set**: No source code modification — only tooling files
