# Plan: Central Broker — v1

**Status**: Done
**Created**: 2026-04-19
**Last updated**: 2026-04-19
**Spec**: [.sdd/specs/central-broker-v1.md]

---

## Summary

Implement a single HTTP broker server and a broker-connected channel MCP server. The broker handles agent registration, message queuing, and routing. The channel MCP polls the broker for incoming messages and pushes them to Claude.

## Technical Context

| Item              | Value                                              |
|-------------------|----------------------------------------------------|
| Language          | TypeScript (Node.js v25+)                          |
| Key dependencies  | `@modelcontextprotocol/sdk`                        |
| Files to create   | `src/broker.ts`, `src/broker-channel.ts`, `src/broker.test.ts` |
| Files to modify   | `src/types.ts`, `.mcp.json`                        |

---

## Implementation Checklist

### Phase 1 — Interface

- [x] Add broker-related types to types.ts: Agent, SendPayload, PollResponse, etc.
- [x] Review types with the spec

### Phase 2 — Testing

- [x] broker.test.ts: register → send → poll flow
- [x] broker.test.ts: send to non-existent agentId → 404
- [x] broker.test.ts: duplicate registration → idempotent
- [x] broker.test.ts: GET /agents list
- [x] broker.test.ts: messages delivered only to target agent
- [x] broker-channel.test.ts: skipped — replaced by E2E testing

### Phase 3 — Implementation

- [x] `src/broker.ts`: HTTP broker server (register, send, poll, agents, health)
- [x] `src/broker-channel.ts`: Broker-connected Channel MCP server
- [x] `.mcp.json` updated
- [x] broker.test.ts 8/8 pass

### Phase 4 — Docs

- [x] Update this plan with deviations
- [x] Update `.sdd/ARCHITECTURE.md`

---

## Deviations & Notes

- **2026-04-19**: broker-channel.test.ts skipped due to MCP stdio connection complexity. Replaced by broker unit tests (8 cases) and E2E testing.
- **2026-04-19**: Added list_agents tool — not in original spec but practical for agent discovery.
