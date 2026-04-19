# Spec: Dashboard — v1

**Status**: Approved
**Created**: 2026-04-19
**Supersedes**: N/A
**Related plan**: [.sdd/plans/dashboard-v1.md]

---

## Overview

Port the broker to Next.js Route Handlers and add a web dashboard for managing agents and the master pool. Single server serves both API and UI. Styled with DESIGN.md parchment theme via Tailwind CSS.

## User Scenarios

### View registered agents · P1

**As a** developer
**I want to** see all registered agents in real-time
**So that** I can monitor which agents are online

**Acceptance criteria:**

- Given the server is running, when I open the root URL, then I see all registered agents
- Given a new agent registers, the list updates automatically

### Manage master pool · P1

**As a** developer
**I want to** add/remove masters from the dashboard
**So that** I don't need CLI tools

**Acceptance criteria:**

- Given the dashboard is open, when I click "Add Master" on an agent, then it is added
- Given an agent is a master, when I click "Remove", then it is removed

### View message activity · P2

**As a** developer
**I want to** see recent messages between agents
**So that** I can monitor communication

---

## Functional Requirements

| ID     | Requirement                                                                          |
|--------|--------------------------------------------------------------------------------------|
| FR-001 | Broker API MUST be ported to Next.js Route Handlers under `app/api/`                |
| FR-002 | All existing broker endpoints MUST maintain the same interface                       |
| FR-003 | Dashboard MUST be served at `GET /` via Next.js SSR                                 |
| FR-004 | Dashboard MUST display agents and master pool                                        |
| FR-005 | Dashboard MUST provide add/remove master UI                                          |
| FR-006 | Dashboard MUST auto-refresh via polling or SSE                                       |
| FR-007 | Dashboard MUST follow DESIGN.md theme via Tailwind CSS custom config                |
| FR-008 | broker-channel MCP server MUST work unchanged against the new API                   |
| FR-009 | Single port serves both API and dashboard                                            |
| FR-010 | `npm start` or `npx agent-rtc` launches everything                                  |

## Edge Cases & Constraints

- broker-channel clients must not break — API paths stay the same
- In-memory state (agents, queues, masters) remains in a shared module
- No database for PoC

## Success Criteria

| ID     | Criterion                                                                    |
|--------|------------------------------------------------------------------------------|
| SC-001 | All existing broker.test.ts tests pass against Next.js Route Handlers        |
| SC-002 | broker-channel works unchanged                                               |
| SC-003 | Dashboard loads and displays agents/masters                                  |
| SC-004 | Add/remove master works from the UI                                          |
| SC-005 | Visual design matches DESIGN.md parchment theme                              |
