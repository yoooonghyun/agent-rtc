# agent-rtc

Real-time communication broker for inter-agent messaging, permission relay, and adaptive feedback.

## What it does

- **Inter-agent messaging**: Multiple Claude Code sessions communicate via a central broker using agentId-based routing
- **MCP HTTP endpoint**: Agents connect via URL — no local file deployment needed
- **Web dashboard**: Monitor agents, manage master pool, view message activity
- **Permission relay**: When an agent needs tool approval, the request fans out to all registered master agents — first verdict wins
- **Adaptive feedback**: A TaskCompleted hook triggers an in-session agent that improves project tooling

## Architecture

```
                    ┌─────────────────────────────┐
                    │   Next.js Custom Server       │
                    │   (single port)               │
                    │                               │
Session A ──MCP──▶  │  /mcp    → MCP Streamable HTTP│
Session B ──MCP──▶  │  /mcp    → MCP Streamable HTTP│  ← shared state
curl/SDK ──HTTP──▶  │  /api/*  → REST API           │
Browser ──HTTP──▶   │  /*      → Dashboard (React)  │
                    └─────────────────────────────┘
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed design.

## Quick Start

```bash
# Install
npm install

# Development (dashboard + API + MCP on port 8800)
npm run dev

# Production
npm run build
npm start
```

Open http://localhost:8800 for the dashboard.

## Connecting Agents

Agents connect via MCP URL — no file deployment needed:

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

Add this to your project's `.mcp.json` or Claude Code settings, then restart the session.

## Features

### Dashboard

Web UI at `/` for monitoring and management:
- Agent list with online status
- Master pool management (add/remove from UI)
- Recent message activity log
- Live stats (agent count, master count, messages)

### Messaging

From any connected agent, use the `reply` tool:

```
reply(targetAgent: "session-b", text: "Write a poem about spring")
```

### Permission Relay

Register master agents to handle permission approvals:

```
add_master(masterAgentId: "session-a")
```

When any agent needs tool approval, all masters receive the request. Respond with `yes <id>` or `no <id>`.

### MCP Tools

| Tool | Description |
|------|-------------|
| `reply` | Send a message to another agent |
| `list_agents` | List all registered agents |
| `add_master` | Add a global master agent |
| `remove_master` | Remove a global master agent |
| `list_masters` | List all master agents |

### REST API

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/register` | POST | Register agent |
| `/api/send` | POST | Send message |
| `/api/poll` | GET | Poll messages |
| `/api/agents` | GET | List agents |
| `/api/masters` | GET | List master pool |
| `/api/masters/add` | POST | Add master |
| `/api/masters/remove` | POST | Remove master |
| `/api/stats` | GET | Stats |
| `/api/messages` | GET | Recent messages |

## Tech Stack

- **Runtime**: Node.js (v25+)
- **Framework**: Next.js 16 (custom server)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with Claude-inspired parchment theme
- **Protocol**: MCP Streamable HTTP (@modelcontextprotocol/server v2)
- **State**: In-memory (shared across MCP + REST + dashboard)

## License

ISC
