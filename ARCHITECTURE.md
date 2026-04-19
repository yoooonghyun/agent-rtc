# Agent RTC — Architecture

## Current: Next.js Custom Server (v5)

```
                    ┌─────────────────────────────┐
                    │   Next.js Custom Server       │
                    │   (server.ts, single port)    │
                    │                               │
Session A ──MCP──▶  │  /mcp    → MCP Streamable HTTP│
                    │                               │
Session B ──MCP──▶  │  /mcp    → MCP Streamable HTTP│  ← shared broker-state
                    │                               │
curl/SDK ──HTTP──▶  │  /api/*  → REST API           │
                    │                               │
Browser ──HTTP──▶   │  /*      → Next.js Dashboard  │
                    └─────────────────────────────┘
```

### Components

| File | Role |
|---|---|
| `server.ts` | Custom HTTP server: routes `/mcp`, `/api/*`, `/*` |
| `lib/broker-state.ts` | Shared in-memory state (agents, queues, masters, message log) |
| `lib/mcp-server.ts` | MCP server factory — creates per-session MCP server with tools |
| `lib/api-handler.ts` | REST API handler (register, send, poll, agents, masters, stats) |
| `app/layout.tsx` | Next.js root layout |
| `app/page.tsx` | Dashboard page |

### MCP Connection

Agents connect via URL — no local file deployment needed:

```json
{
  "mcpServers": {
    "agent-rtc": {
      "type": "url",
      "url": "http://127.0.0.1:8800/mcp?agentId=session-a&displayName=Session+A"
    }
  }
}
```

### MCP Tools

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
| `/api/poll` | GET | Poll messages `?agentId=<id>` |
| `/api/agents` | GET | List agents |
| `/api/masters` | GET | List master pool |
| `/api/masters/add` | POST | Add master `{ masterAgentId }` |
| `/api/masters/remove` | POST | Remove master `{ masterAgentId }` |
| `/api/stats` | GET | Agent count, master count, total messages |
| `/api/messages` | GET | Recent message log (last 20) |

### Key Decisions

- **Custom server over App Router API**: Next.js App Router Route Handlers use Web API Request/Response which is incompatible with MCP SDK's NodeStreamableHTTPServerTransport. Also, App Router runs in a separate module scope — state isn't shared. Custom server solves both.
- **Single process, shared state**: MCP sessions, REST API, and dashboard all share one `broker-state` module in one Node.js process.
- **URL-based MCP connection**: Agents connect via `http://host:port/mcp?agentId=...` — eliminates broker-channel.js file distribution.
- **In-memory state**: No database for PoC. State lost on restart.

---

## Historical Versions

### v1: Direct Port-to-Port (bridge-channel)

```
Session A (port 8001) ──HTTP POST──▶ Session B (port 8002)
```

Each session ran its own HTTP + MCP stdio server. Required port allocation and knowledge of the other's port. Superseded by central broker.

### v2: Central Broker (standalone broker.ts + broker-channel.ts)

```
Session A ──stdio→ broker-channel ──HTTP──▶ Broker (standalone)
```

Separated broker (HTTP) from channel (MCP stdio). Agents communicated via agentId. Required deploying `broker-channel.js` to each agent.

### v3: Permission Relay with Global Master Pool

Added `POST /masters/add`, `POST /masters/remove`, `GET /masters` APIs. Permission requests fan-out to all masters via `Promise.allSettled`. First verdict wins (Claude Code built-in behavior).

### v4: Adaptive Feedback Agent

`TaskCompleted` prompt hook triggers adaptive-feedback subagent in-session. Scans CLAUDE.md, agents, skills, hooks for repetitive patterns, user feedback, and rule conflicts. Writes changes directly.
