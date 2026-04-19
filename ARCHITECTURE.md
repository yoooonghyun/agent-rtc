# Agent RTC — Architecture

## Current: Express + stdio broker-channel (v6)

```
Session A ──stdio→ broker-channel ──┐
                                     ├──HTTP──▶ Express Server (port 8800)
Session B ──stdio→ broker-channel ──┘          ├── /api/*  → REST API
                                               ├── /*      → Dashboard (React/Vite)
Browser ──HTTP──────────────────────────────────┘

Storage: SQLite (data/agent-rtc.db)
```

### Components

| File | Role |
|---|---|
| `server.ts` | Express server: REST API + static files |
| `lib/broker-state.ts` | SQLite-backed state (agents, queues, masters, message log) |
| `lib/db.ts` | SQLite initialization + auto-migration |
| `src/broker-channel.ts` | stdio MCP server — connects Claude Code to the broker via polling |
| `app/` | React dashboard (Vite build) |

### Agent Connection

Agents connect via stdio broker-channel. Each Claude Code session spawns `broker-channel.js` as an MCP subprocess:

```json
{
  "mcpServers": {
    "agent-rtc": {
      "command": "node",
      "args": ["dist/broker-channel.js"],
      "env": {
        "BROKER_URL": "http://127.0.0.1:8800/api",
        "AGENT_NAME": "My Agent"
      }
    }
  }
}
```

AgentId is auto-generated (`agent-<8hex>`). Only `AGENT_NAME` is required.

### Message Delivery

broker-channel polls `GET /api/poll` every 1 second. Poll also serves as heartbeat — agents inactive for 30 seconds are automatically removed.

### MCP Tools (via broker-channel)

| Tool | Description |
|---|---|
| `reply(targetAgent, text)` | Send message to another agent |
| `list_agents()` | List all registered agents |
| `add_master(masterAgentId)` | Add global master |
| `remove_master(masterAgentId)` | Remove global master |
| `list_masters()` | List master pool |

### REST API

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/register` | POST | Register agent `{ agentId, displayName }` |
| `/api/send` | POST | Send message `{ from, to, text }` |
| `/api/poll` | GET | Poll messages `?agentId=<id>` (also heartbeat) |
| `/api/agents` | GET | List agents |
| `/api/masters` | GET | List master pool |
| `/api/masters/add` | POST | Add master `{ masterAgentId }` |
| `/api/masters/remove` | POST | Remove master `{ masterAgentId }` |
| `/api/stats` | GET | Agent count, master count, total messages |
| `/api/messages` | GET | Recent message log (last 20) |

### Key Decisions

- **stdio over MCP HTTP**: MCP Streamable HTTP can't push notifications — Claude Code doesn't open persistent GET SSE stream. stdio broker-channel with polling is reliable.
- **SQLite storage**: Persists agents, masters, message log across restarts. Auto-migrating schema.
- **Poll-based heartbeat**: No separate heartbeat endpoint. Poll requests update `lastHeartbeat`. Agents inactive 30s are swept.
- **Express + Vite**: Express serves REST API + static React build. Vite for dev HMR.

---

## Historical Versions

### v1: Direct Port-to-Port (bridge-channel)

Each session ran its own HTTP + MCP stdio server. Required port allocation and knowledge of the other's port.

### v2: Central Broker (standalone broker.ts + broker-channel.ts)

Separated broker (HTTP) from channel (MCP stdio). Agents communicated via agentId.

### v3: Permission Relay with Global Master Pool

Permission requests fan-out to all masters. First verdict wins.

### v4: Adaptive Feedback Agent

TaskCompleted hook triggers adaptive-feedback subagent in-session.

### v5: Next.js Custom Server + MCP HTTP

Attempted MCP Streamable HTTP endpoint. Failed — hydration issues with Next.js custom server, and MCP HTTP can't push notifications. Abandoned.
