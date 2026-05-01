# Spec: Agent detail view — v1

**Status**: Approved
**Created**: 2026-05-01
**Related plan**: .sdd/plans/agent-detail-view-v1.md

---

## Overview

An agent detail panel that opens when a user clicks an agent row in the dashboard agent list. Displays full queue info, message rates, memory usage, and connection details fetched from the RabbitMQ Management API.

## User Scenarios

### View agent detail · P1

**As an** operator
**I want to** click an agent row to see its full session info
**So that** I can diagnose queue health, consumer status, and connection details

**Acceptance criteria:**

- Given agents are listed, when the operator clicks a row, then a detail panel slides open from the right
- Given the detail panel is open, then it shows: agent ID, display name, status badge, consumer count, messages ready, messages unacknowledged, message rates, memory usage, queue state, and connection info
- Given the operator clicks the close button, then the panel dismisses

### View connection info · P2

**As an** operator
**I want to** see connection details for an agent's consumers
**So that** I can identify which client is connected

**Acceptance criteria:**

- Given an agent has consumers, when the detail panel is open, then connection info (client properties, connected_at, channel count) is displayed
- Given an agent has no consumers, then a "no connections" message is shown

---

## Functional Requirements

| ID     | Requirement                                                                        |
|--------|------------------------------------------------------------------------------------|
| FR-001 | The system MUST fetch agent queue detail from GET /queues/%2F/agent.{agentId}      |
| FR-002 | The system MUST fetch consumer list from GET /consumers and filter by queue name   |
| FR-003 | The system MUST display agent ID, display name, and online/offline badge           |
| FR-004 | The system MUST display consumer count, messages ready, messages unacknowledged    |
| FR-005 | The system MUST display message rates (publish, deliver) when available            |
| FR-006 | The system MUST display memory usage in human-readable format                      |
| FR-007 | The system MUST display queue state (running/idle)                                 |
| FR-008 | The system MUST display connection info when consumers exist                       |
| FR-009 | The system MUST provide a close button to dismiss the panel                        |
| FR-010 | The system MUST use shadcn/ui components and follow Toss design system             |
| FR-011 | The detail panel component MUST accept agent data via props for reusability        |

## Edge Cases & Constraints

- RabbitMQ detail endpoint may return partial data; handle missing fields gracefully
- Consumer list may be empty; show empty state
- Message rate fields may be absent; default to 0
- Memory field may be absent; show "unknown"

## Success Criteria

| ID     | Criterion                                                  |
|--------|------------------------------------------------------------|
| SC-001 | Clicking an agent row opens the detail panel               |
| SC-002 | Detail panel renders all required fields                   |
| SC-003 | Close button dismisses the panel                           |
| SC-004 | UI matches Toss design system guidelines                   |
