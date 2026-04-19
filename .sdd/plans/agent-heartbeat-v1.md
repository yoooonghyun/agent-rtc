# Plan: Agent Heartbeat — v1

**Status**: Done
**Created**: 2026-04-19
**Last updated**: 2026-04-19
**Spec**: [.sdd/specs/agent-heartbeat-v1.md]

---

## Summary

Use existing poll requests as implicit heartbeat. Broker tracks last poll time per agent and sweeps stale agents every 10 seconds. No additional heartbeat endpoint needed.

## Technical Context

| Item              | Value                                     |
|-------------------|-------------------------------------------|
| Language          | TypeScript                                |
| Files modified    | `lib/broker-state.ts`, `server.ts`        |

---

## Implementation Checklist

### Phase 1 — Implementation

- [x] broker-state: `lastHeartbeat` map, updated on `registerAgent` and `pollMessages`
- [x] broker-state: `sweepStaleAgents()` — removes agents with heartbeat > 30s ago
- [x] broker-state: `unregisterAgent()` — cleans up agents, queues, heartbeat, mcpServers, masterPool
- [x] server.ts: `setInterval(sweepStaleAgents, 10_000)`

### Phase 2 — Testing

- [ ] E2E: verify agent removed ~30s after broker-channel stops

### Phase 3 — Docs

- [x] Update this plan
- [x] Update spec

---

## Deviations & Notes

- **2026-04-19**: No separate heartbeat endpoint. Poll requests serve as implicit heartbeat — simpler, no extra network calls.
