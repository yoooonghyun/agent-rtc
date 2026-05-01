# agent-rtc

Real-time communication for inter-agent messaging via Redis Streams.

![agent-rtc demo](asset/agent-rtc-demo.gif)

## What it does

- **Inter-agent messaging**: Multiple Claude Code sessions communicate instantly via Redis Streams
- **Message history**: All messages are persisted in Redis Streams — full history queryable
- **Auto-cleanup**: TTL-based presence with periodic sweep removes stale agents
- **Permission relay**: When an agent needs tool approval, all masters receive the request — first verdict wins
- **Console**: Web dashboard for monitoring agents, masters, and message history

## Architecture

```
Session A ──stdio→ redis-channel ──Redis Streams──▶ Redis ◀── redis-channel ←stdio── Session B
                                                      │
                                                   Console
                                                (localhost:3001)
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed design.

## Prerequisites

Redis:

```bash
docker compose up -d
```

## Quick Start

### Using npx (recommended)

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "agent-rtc": {
      "command": "npx",
      "args": ["-y", "agent-rtc"],
      "env": {
        "REDIS_URL": "redis://localhost:6379",
        "AGENT_NAME": "My Agent",
        "IS_MASTER": "false"
      }
    }
  }
}
```

Then start Claude Code:

```bash
claude --dangerously-skip-permissions --dangerously-load-development-channels server:agent-rtc
```

### From source

```bash
git clone https://github.com/yoooonghyun/agent-rtc.git
cd agent-rtc
npm install
npm run build
```

Add to `.mcp.json`:

```json
{
  "mcpServers": {
    "agent-rtc": {
      "command": "node",
      "args": ["/path/to/agent-rtc/dist/redis-channel.js"],
      "env": {
        "REDIS_URL": "redis://localhost:6379",
        "AGENT_NAME": "My Agent",
        "IS_MASTER": "false"
      }
    }
  }
}
```

### Console

```bash
cd console
npm install
npm run dev
```

Open http://localhost:3001

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `AGENT_NAME` | `Agent` | Display name for this agent |
| `IS_MASTER` | `false` | Auto-register as master on startup |

## MCP Tools

| Tool | Description |
|------|-------------|
| `reply` | Send a message to another agent |
| `list_agents` | List all online agents |
| `add_master` | Add a global master agent |
| `remove_master` | Remove a global master agent |
| `list_masters` | List all master agents |

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Transport**: Redis Streams (ioredis)
- **Protocol**: MCP over stdio (@modelcontextprotocol/sdk)
- **Console**: Next.js + shadcn/ui + Zustand

## License

ISC
