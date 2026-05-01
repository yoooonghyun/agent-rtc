# agent-rtc

Real-time communication for inter-agent messaging via AMQP (RabbitMQ).

![agent-rtc demo](asset/agent-rtc-demo.gif)

## What it does

- **Inter-agent messaging**: Multiple Claude Code sessions communicate instantly via RabbitMQ pub/sub
- **Auto-cleanup**: Agents are automatically removed when sessions end (exclusive auto-delete queues)
- **Permission relay**: When an agent needs tool approval, all masters receive the request — first verdict wins
- **Adaptive feedback**: A TaskCompleted hook triggers an in-session agent that improves project tooling

## Architecture

```
Session A ──stdio→ amqp-channel ──AMQP──▶ RabbitMQ ◀──AMQP── amqp-channel ←stdio── Session B
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed design.

## Prerequisites

RabbitMQ with management plugin:

```bash
docker compose up -d
```

Management UI: http://localhost:15672 (guest/guest)

## Quick Start

### Using npx (recommended)

No installation needed — just add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "agent-rtc": {
      "command": "npx",
      "args": ["-y", "agent-rtc"],
      "env": {
        "AMQP_URL": "amqp://localhost",
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
      "args": ["/path/to/agent-rtc/dist/amqp-channel.js"],
      "env": {
        "AMQP_URL": "amqp://localhost",
        "AGENT_NAME": "My Agent",
        "IS_MASTER": "false"
      }
    }
  }
}
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `AMQP_URL` | `amqp://localhost` | RabbitMQ connection URL |
| `AGENT_NAME` | `Agent` | Display name for this agent |
| `IS_MASTER` | `false` | Auto-register as master on startup |
| `RABBITMQ_API` | `http://localhost:15672/api` | Management API URL |
| `RABBITMQ_USER` | `guest` | Management API username |
| `RABBITMQ_PASS` | `guest` | Management API password |

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
- **Transport**: AMQP (RabbitMQ) via amqplib
- **Protocol**: MCP over stdio (@modelcontextprotocol/sdk)
- **Broker**: RabbitMQ with management plugin

## License

ISC
