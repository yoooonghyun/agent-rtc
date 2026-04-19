# Spec: Agent Heartbeat — v1

**Status**: Approved
**Created**: 2026-04-19
**Supersedes**: N/A
**Related plan**: [.sdd/plans/agent-heartbeat-v1.md]

---

## Overview

broker-channel sends periodic heartbeat to the broker. The broker tracks last heartbeat time per agent and removes agents that miss heartbeats beyond a timeout threshold.

## User Scenarios

### Auto-cleanup on disconnect · P1

**As a** developer
**I want to** stale agents to be automatically removed when their session ends
**So that** the agent list only shows live agents

**Acceptance criteria:**

- Given a broker-channel is running, then it sends `POST /api/heartbeat` every N seconds
- Given a session terminates, when the agent misses heartbeats beyond the timeout, then the broker removes it from the agent list
- Given the agent is removed, then it no longer appears in `/api/agents` or the dashboard

---

## Functional Requirements

| ID     | Requirement                                                                          |
|--------|--------------------------------------------------------------------------------------|
| FR-001 | Broker MUST provide `POST /api/heartbeat` endpoint. body: `{ agentId }` (MUST)      |
| FR-002 | Broker MUST track `lastHeartbeat` timestamp per agent (MUST)                         |
| FR-003 | Broker MUST run a periodic sweep (every 10s) to remove agents whose lastHeartbeat exceeds timeout (30s) (MUST) |
| FR-004 | broker-channel MUST send heartbeat every 10 seconds (MUST)                           |
| FR-005 | When an agent is removed by timeout, its message queue MUST also be cleaned up (MUST)|

## Edge Cases & Constraints

- Agent re-registers after timeout → treated as new agent (new agentId)
- Heartbeat interval (10s) and timeout (30s) give 2 missed heartbeats before removal
- Broker restart → all agents gone, broker-channels re-register on next heartbeat

## Success Criteria

| ID     | Criterion                                                                    |
|--------|------------------------------------------------------------------------------|
| SC-001 | Agent appears after registration, disappears ~30s after session terminates   |
| SC-002 | Dashboard shows only live agents                                             |
