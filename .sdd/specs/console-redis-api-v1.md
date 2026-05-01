# Console Redis API v1 - Spec

## Summary

Migrate the agent-rtc console from RabbitMQ Management API to Redis as the data backend. The broker has already switched to Redis; this spec covers the console-side changes needed to query Redis instead of RabbitMQ.

## Problem

The console currently proxies requests to the RabbitMQ Management HTTP API via `/api/rabbitmq`. The backend no longer uses RabbitMQ -- it uses Redis with the `agent-rtc:` key prefix. The console must be updated to read from Redis.

## Redis data structure

All keys use the `agent-rtc:` prefix:

| Key | Type | Contents |
|-----|------|----------|
| `agent-rtc:agents` | Set | Set of agentIds |
| `agent-rtc:meta:{agentId}` | Hash | `displayName` field |
| `agent-rtc:presence:{agentId}` | Key w/ TTL | Exists = online |
| `agent-rtc:masters` | Set | Set of master agentIds |
| `agent-rtc:messages` | Stream | `data` field with JSON: `{type, from, fromDisplayName, to, text, timestamp}` |
| `agent-rtc:agent:{agentId}` | Stream | Per-agent message stream |

## API design

### Endpoint: `GET /api/redis?action=<action>`

Actions:
- `agents` -- list all agents with metadata and presence
- `masters` -- list all master agentIds
- `messages` -- last 100 messages from global stream
- `agent-detail` -- detailed info for one agent (requires `agentId` param)
- `stats` -- counts of agents, masters, messages

## Type changes

Remove RabbitMQ-specific types (`RabbitQueue`, `RabbitQueueDetail`, `RabbitBinding`, `RabbitConsumer`). Simplify `Agent`, `AgentDetail`, and `Master` types for Redis-backed data.

## Out of scope

- Write operations (adding/removing agents via console)
- WebSocket/SSE real-time streaming
- Authentication
