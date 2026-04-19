# Plan: AMQP Transport — v1

**Status**: Done
**Created**: 2026-04-19
**Last updated**: 2026-04-19
**Spec**: [.sdd/specs/amqp-transport-v1.md]

---

## Summary

Rewrite broker-channel to use AMQP (RabbitMQ) instead of HTTP polling. Remove Express server, REST API, SQLite. The project becomes a pure MCP ↔ AMQP adapter.

## Technical Context

| Item              | Value                                     |
|-------------------|-------------------------------------------|
| Language          | TypeScript                                |
| Key dependencies  | `amqplib`, `@types/amqplib`               |
| Files to create   | `src/amqp-channel.ts`                     |
| Files to remove   | `server.ts`, `lib/broker-state.ts`, `lib/db.ts` |
| Files to modify   | `package.json`, `.mcp.json`, `tsconfig.server.json` |

---

## Implementation Checklist

### Phase 1 — Dependencies

- [x] Install `amqplib` + `@types/amqplib`
- [ ] Remove Express, better-sqlite3, MCP server deps — deferred to cleanup PR

### Phase 2 — amqp-channel

- [x] Create `src/amqp-channel.ts`: connect to RabbitMQ, declare exchange + queue, subscribe, MCP tools
- [x] Tools: reply (publish to exchange), list_agents (Management API), add/remove/list_masters (binding-based)
- [x] Permission relay via `permission.*` routing key, masters bind their perm queue
- [x] Permission verdict detection via regex in consumed messages

### Phase 3 — Cleanup

- [ ] Remove `server.ts`, `lib/broker-state.ts`, `lib/db.ts` — deferred to after E2E verification
- [x] Updated `.mcp.json` to use `amqp-channel.js`

### Phase 4 — Testing

- [x] RabbitMQ docker started, amqp-channel connected
- [x] Queue creation verified: `agent.*`, `perm.*` (exclusive, autoDelete)
- [x] Message routing verified via Management API publish
- [x] Auto-cleanup verified: queues deleted on disconnect
- [ ] E2E: two Claude Code sessions exchanging messages

### Phase 5 — Docs

- [x] Update this plan
- [ ] Update ARCHITECTURE.md
- [ ] Update README.md

---

## Deviations & Notes

- **2026-04-19**: Express/SQLite removal deferred — keeping on branch until E2E with two sessions is verified.
- **2026-04-19**: `agent-registry` queue created for metadata but not yet consumed. Display names in list_agents come from queue names only for now.
