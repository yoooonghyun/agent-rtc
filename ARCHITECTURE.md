# Agent RTC — Architecture

## Current: AMQP Transport (v7)

```
Session A ──stdio→ amqp-channel ──AMQP──▶ RabbitMQ ◀──AMQP── amqp-channel ←stdio── Session B
                                            │
                                     Management UI
                                     (localhost:15672)
```

### Components

| File | Role |
|---|---|
| `src/amqp-channel.ts` | MCP ↔ AMQP adapter. Connects to RabbitMQ, declares queues, subscribes, exposes MCP tools |
| `src/types.ts` | Shared type definitions |

### How it works

1. Each agent connects to RabbitMQ and declares an exclusive auto-delete queue (`agent.{agentId}`)
2. Queue is bound to topic exchange `agent-rtc` with routing key `agent.{agentId}`
3. Messages are published to exchange with target agent's routing key
4. Messages arrive instantly via AMQP subscribe — no polling
5. When session ends, AMQP connection closes, queue is auto-deleted by RabbitMQ

### Agent Connection

```json
{
  "mcpServers": {
    "agent-rtc": {
      "command": "node",
      "args": ["dist/amqp-channel.js"],
      "env": {
        "AMQP_URL": "amqp://localhost",
        "AGENT_NAME": "My Agent",
        "IS_MASTER": "false"
      }
    }
  }
}
```

### MCP Tools

| Tool | Description |
|---|---|
| `reply(targetAgent, text)` | Publish message to target agent's queue |
| `list_agents()` | Query RabbitMQ Management API for active agent queues |
| `add_master(masterAgentId)` | Bind agent's perm queue to `permission.*` routing key |
| `remove_master(masterAgentId)` | Unbind from `permission.*` |
| `list_masters()` | Query Management API for `permission.*` bindings |

### Permission Relay

- Masters bind `perm.{agentId}` queue to `permission.*` routing key
- Permission requests are published with routing key `permission.{agentId}`
- All masters receive fan-out — first verdict wins
- Own permission requests are skipped

### Key Decisions

- **AMQP over HTTP polling**: Instant push, reliable delivery, auto-cleanup
- **RabbitMQ exclusive queues**: Auto-deleted on disconnect — no stale agents
- **Queue arguments for metadata**: `x-agent-name` stores display name for discovery
- **No custom server**: RabbitMQ handles routing, Management UI serves as dashboard
- **IS_MASTER env var**: Auto-registers as master on startup
