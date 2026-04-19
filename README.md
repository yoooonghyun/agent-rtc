# agent-rtc

Real-time communication broker for inter-agent messaging, permission relay, and adaptive feedback.

## What it does

- **Inter-agent messaging**: Multiple Claude Code sessions communicate via a central broker with stdio MCP channels
- **Web dashboard**: Monitor agents, manage master pool, view message activity
- **Permission relay**: When an agent needs tool approval, the request fans out to all registered master agents — first verdict wins
- **Adaptive feedback**: A TaskCompleted hook triggers an in-session agent that improves project tooling

## Architecture

```
Session A ──stdio→ broker-channel ──┐
                                     ├──HTTP──▶ Express (port 8800)
Session B ──stdio→ broker-channel ──┘          ├── /api/*  → REST API
                                               ├── /*      → Dashboard
Browser ──HTTP──────────────────────────────────┘

Storage: SQLite (data/agent-rtc.db)
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed design.

## Quick Start

```bash
# Install
npm install

# Development (Express API on :8800, Vite React on :5173)
npm run dev

# Production (single server on :8800)
npm run build
npm start
```

- Development: open http://localhost:5173 (Vite proxies API to :8800)
- Production: open http://localhost:8800 (Express serves everything)

## Connecting Agents

Agents connect via MCP URL with a display name header — no file deployment needed:

```json
{
  "mcpServers": {
    "agent-rtc": {
      "type": "http",
      "url": "http://127.0.0.1:8800/mcp",
      "headers": {
        "X-Agent-Name": "${AGENT_NAME:-My Agent}"
      }
    }
  }
}
```

The server auto-generates a unique `agentId` on connection. Set the `AGENT_NAME` env var or it defaults to `"My Agent"`. Add this to your project's `.mcp.json`, then restart the session.

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
- **Server**: Express 5
- **Client**: React 19 + Vite 8
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with Claude-inspired parchment theme
- **Protocol**: MCP over stdio (@modelcontextprotocol/sdk)
- **Database**: SQLite (better-sqlite3) — persists across restarts, auto-migrating schema

## License

ISC
