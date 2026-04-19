# Spec: Permission Relay — v2

**Status**: Approved
**Created**: 2026-04-19
**Supersedes**: permission-relay-v1 (per-agent master → global master pool + fan-out)
**Related plan**: [.sdd/plans/permission-relay-v2.md]

---

## Overview

Master agents are registered globally on the broker rather than per-agent. Multiple masters can be registered, and permission relay fans out to all masters. The first verdict to arrive is applied.

## User Scenarios

### Global master registration · P1

**As a** developer
**I want to** register master agents globally on the broker
**So that** all agents' permissions are forwarded to those masters

**Acceptance criteria:**

- Given the broker is running, when `add_master(masterAgentId: "session-a")` is called, then session-a is added to the global master pool
- Given session-a and session-c are registered as masters, when `list_masters()` is called, then both agents are returned

### Fan-out permission relay · P1

**As a** master agent user
**I want to** receive permission requests from any agent simultaneously with other masters
**So that** whichever master responds first can handle the approval

**Acceptance criteria:**

- Given session-a and session-c are masters and session-b triggers a permission, when broker-channel relays the request, then both session-a and session-c receive it
- Given session-a responds `yes abcde` first, then session-b's tool executes and session-c's response is ignored

### Master removal · P2

**As a** developer
**I want to** remove a registered master
**So that** it no longer receives permission requests

**Acceptance criteria:**

- Given session-a is a master, when `remove_master(masterAgentId: "session-a")` is called, then session-a is removed from the pool

---

## Functional Requirements

| ID     | Requirement                                                                          |
|--------|--------------------------------------------------------------------------------------|
| FR-001 | Broker MUST provide `POST /masters/add` API. body: `{ masterAgentId }`              |
| FR-002 | Broker MUST provide `POST /masters/remove` API. body: `{ masterAgentId }`           |
| FR-003 | Broker MUST provide `GET /masters` API — return master pool list                    |
| FR-004 | broker-channel MUST expose `add_master` tool                                         |
| FR-005 | broker-channel MUST expose `remove_master` tool                                      |
| FR-006 | broker-channel MUST expose `list_masters` tool                                       |
| FR-007 | On permission request, MUST fan-out to all global masters                            |
| FR-008 | Previous per-agent master API (`POST /master`, `GET /master`) MUST be removed        |
| FR-009 | Previous `set_master`, `get_master` tools MUST be removed                            |
| FR-010 | When master pool is empty, MUST skip relay with stderr warning                       |
| FR-011 | MUST refresh master pool from broker during each poll cycle                          |

## Edge Cases & Constraints

- Duplicate add of same agentId → idempotent (Set behavior)
- Remove non-existent agentId → silently succeeds (200)
- Multiple masters send verdicts simultaneously → first one wins (Claude Code built-in)
- Master pool stored in broker memory only (PoC scope)

## Success Criteria

| ID     | Criterion                                                                    |
|--------|------------------------------------------------------------------------------|
| SC-001 | `add_master` / `list_masters` / `remove_master` work correctly              |
| SC-002 | Permission request arrives at all registered masters                         |
| SC-003 | Any master's verdict resolves the permission                                 |

---

## Open Questions

- [x] Does master registration require prior agent registration? → No (flexibility first)
