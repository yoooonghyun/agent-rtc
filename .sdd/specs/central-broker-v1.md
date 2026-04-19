# Spec: Central Broker — v1

**Status**: Approved
**Created**: 2026-04-19
**Supersedes**: agent-bridge-channel-v1 (port-based direct communication → broker-based routing)
**Related plan**: [.sdd/plans/central-broker-v1.md]

---

## Overview

A single HTTP server (broker) relays messages for all agent sessions. Each agent registers with a unique ID and communicates via agentId without needing to know each other's ports.

## User Scenarios

### Agent registration and messaging · P1

**As a** Claude Code session
**I want to** register with the broker and send messages to other agents by agentId
**So that** I can communicate without knowing the other agent's port

**Acceptance criteria:**

- Given the broker is running, when an agent POSTs to `/register`, then the agentId is registered
- Given agent-a and agent-b are registered, when agent-a POSTs to `/send` targeting agent-b, then agent-b receives the message via `GET /poll`

### Multi-agent support · P1

**As a** developer
**I want to** register 3+ agents simultaneously
**So that** multi-party communication is possible

**Acceptance criteria:**

- Given 3 agents are registered, when agent-a sends a message to agent-c, then agent-b does not receive it and only agent-c does

### Channel MCP integration · P1

**As a** Claude Code session
**I want to** the channel MCP server to communicate with the broker automatically
**So that** Claude can naturally send messages via the reply tool

**Acceptance criteria:**

- Given Claude is running with the channel, when a message arrives from the broker, then it is pushed to Claude as a `<channel>` tag
- Given Claude calls the reply tool with targetAgent and text, then the message is delivered to the target agent via the broker

---

## Functional Requirements

| ID     | Requirement                                                              |
|--------|--------------------------------------------------------------------------|
| FR-001 | Broker MUST run as an HTTP server on a single port                      |
| FR-002 | `POST /register` — Register agent. body: `{ agentId, displayName }` (MUST) |
| FR-003 | `POST /send` — Send message. body: `{ from, to, text }` (MUST)         |
| FR-004 | `GET /poll?agentId=<id>` — Retrieve and consume pending messages (MUST) |
| FR-005 | `GET /agents` — Return list of registered agents (agentId + displayName) (SHOULD) |
| FR-006 | `GET /health` — Health check (MUST)                                      |
| FR-007 | Channel MCP server MUST auto-register with broker and poll (MUST)       |
| FR-008 | Reply tool MUST accept targetAgent (agentId) and text as arguments (MUST) |
| FR-009 | Broker URL MUST be configurable via env var (`BROKER_URL`) (MUST)       |
| FR-010 | Agent's agentId via `AGENT_ID`, displayName via `AGENT_DISPLAY_NAME` (MUST) |

## Edge Cases & Constraints

- Send to non-existent agentId → return 404
- Duplicate registration with same agentId → overwrite displayName (idempotent)
- Broker down → channel server polling fails → retry (3s interval)
- Message queue is in-memory only (PoC scope, no persistence)

## Success Criteria

| ID     | Criterion                                                                |
|--------|--------------------------------------------------------------------------|
| SC-001 | Register 2 agents and successfully exchange messages                    |
| SC-002 | Bidirectional communication between Claude sessions via channel MCP     |
| SC-003 | All agents only need to know the single broker port                     |

---

## Open Questions

- [x] Polling interval: start with 1 second
- [x] Broadcast feature: out of scope for v1
