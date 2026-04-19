# Plan: MCP Push Notification — v1

**Status**: Done
**Created**: 2026-04-19
**Last updated**: 2026-04-19
**Spec**: [.sdd/specs/mcp-push-notification-v1.md]

---

## Summary

Add a MCP server registry to broker-state. When a message is sent, push a channel notification directly through the target agent's MCP server SSE transport. Messages still queue for REST polling as fallback.

## Technical Context

| Item              | Value                                     |
|-------------------|-------------------------------------------|
| Language          | TypeScript                                |
| Files to modify   | `lib/broker-state.ts`, `lib/mcp-server.ts`, `server.ts` |

---

## Implementation Checklist

### Phase 1 — Interface

- [x] Add `McpServer` registry (agentId → McpServer) to broker-state
- [x] Add `registerMcpServer`, `unregisterMcpServer` functions

### Phase 2 — Testing

- [x] E2E: curl MCP init → open SSE → send message → verified push arrives on SSE stream

### Phase 3 — Implementation

- [x] broker-state: add `mcpServers` registry + `notifyAgent` function
- [x] server.ts: register MCP server after connect, unregister on transport close
- [x] broker-state `sendMessage`: calls `notifyAgent` after queueing

### Phase 4 — Docs

- [x] Update this plan
- [ ] Update ARCHITECTURE.md
- [ ] Update README.md

---

## Deviations & Notes

- **2026-04-19**: No deviations. `notifyAgent` uses `McpServer.server.notification()` to push directly through the low-level Server instance.
