# Plan: Redis Transport — v1

**Status**: In Progress
**Created**: 2026-05-01
**Last updated**: 2026-05-01
**Spec**: [.sdd/specs/redis-transport-v1.md]

---

## Summary

Replace RabbitMQ with Redis Streams. Create src/redis-channel.ts as the MCP ↔ Redis adapter. Update console API proxy for Redis queries. Remove amqplib dependency.

## Technical Context

| Item              | Value                                     |
|-------------------|-------------------------------------------|
| Language          | TypeScript                                |
| Key dependencies  | `ioredis`                                 |
| Files to create   | `src/redis-channel.ts`                    |
| Files to remove   | `src/amqp-channel.ts`                     |
| Files to modify   | `package.json`, `.mcp.json`, `console/lib/api.ts`, `console/lib/types.ts`, `console/app/api/rabbitmq/route.ts` |

---

## Implementation Checklist

### Phase 1 — MCP Channel

- [ ] Install ioredis
- [ ] Create src/redis-channel.ts: connect, register, XREAD BLOCK, MCP tools
- [ ] Tools: reply (XADD), list_agents (SMEMBERS + HGETALL), add/remove/list_masters
- [ ] Presence: SET with TTL 30s, refresh every 10s
- [ ] Cleanup: SIGTERM/SIGINT → SREM + DEL
- [ ] Periodic sweep: remove agents from Set whose presence expired
- [ ] Permission relay: publish to agent-rtc:permissions, masters XREAD BLOCK

### Phase 2 — Console API

- [ ] Rename/replace console/app/api/rabbitmq/ → console/app/api/redis/
- [ ] Update console/lib/api.ts for Redis-based queries
- [ ] Update console/lib/types.ts
- [ ] Message history via XRANGE agent-rtc:messages

### Phase 3 — Cleanup

- [ ] Remove src/amqp-channel.ts
- [ ] Remove amqplib from package.json
- [ ] Update .mcp.json
- [ ] Update docker-compose.yml (RabbitMQ → Redis)

### Phase 4 — Docs

- [ ] Update ARCHITECTURE.md
- [ ] Update README.md
- [ ] Update this plan

---

## Deviations & Notes
