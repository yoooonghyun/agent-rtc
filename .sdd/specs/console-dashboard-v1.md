# Spec: Console dashboard — v1

**Status**: Approved
**Created**: 2026-05-01
**Related plan**: .sdd/plans/console-dashboard-v1.md

---

## Overview

A web console dashboard for monitoring the agent-rtc system. Displays online agents, master pool membership, recent message logs, and summary statistics. Data is fetched from the RabbitMQ Management API.

## User Scenarios

### View online agents · P1

**As an** operator
**I want to** see all connected agents with their display name and online status
**So that** I can monitor which agents are currently active

**Acceptance criteria:**

- Given RabbitMQ is running, when the dashboard loads, then agents are listed with agentId, displayName, and an online/offline badge
- Given an agent disconnects, when the next poll occurs, then the agent shows as offline

### View master pool · P1

**As an** operator
**I want to** see which agents are registered as masters
**So that** I can understand the permission relay topology

**Acceptance criteria:**

- Given RabbitMQ has permission bindings, when the dashboard loads, then masters are listed
- Given the operator clicks remove, when confirmed, then the master is removed from the display

### View message log · P1

**As an** operator
**I want to** see recent messages between agents
**So that** I can debug communication issues

**Acceptance criteria:**

- Given messages exist, when the dashboard loads, then messages show sender, receiver, text preview, and timestamp
- Given many messages, then only the most recent are shown

### View stats · P2

**As an** operator
**I want to** see summary counts (agents, masters, messages)
**So that** I can get a quick overview of system health

**Acceptance criteria:**

- Given data is loaded, when the dashboard renders, then stat cards show agent count, master count, and message count

---

## Functional Requirements

| ID     | Requirement                                                              |
|--------|--------------------------------------------------------------------------|
| FR-001 | The system MUST fetch agent data from GET /api/queues/%2F               |
| FR-002 | The system MUST filter queues starting with "agent." to identify agents  |
| FR-003 | The system MUST read x-agent-name from queue arguments for display name |
| FR-004 | The system MUST fetch master data from GET /api/bindings/%2F            |
| FR-005 | The system MUST filter bindings by source="agent-rtc" and routing_key starting with "permission." |
| FR-006 | The system MUST use Basic Auth (guest/guest) for RabbitMQ API           |
| FR-007 | The system MUST auto-refresh data via polling                           |
| FR-008 | The system MUST use Zustand for client state                            |
| FR-009 | The system MUST follow the Toss design system (shadcn/ui components)    |
| FR-010 | The system MUST use a 3-column layout: left nav, main canvas, right rail |

## Edge Cases & Constraints

- RabbitMQ may be unavailable; display error state gracefully
- Queue list may be empty; show empty state
- Explicitly out of scope: agent creation, message sending, dark mode toggle

## Success Criteria

| ID     | Criterion                                            |
|--------|------------------------------------------------------|
| SC-001 | Dashboard renders with all four sections visible     |
| SC-002 | Data refreshes automatically on a polling interval   |
| SC-003 | UI matches Toss design system guidelines             |
