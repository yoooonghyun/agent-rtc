# Spec: MCP Push Notification — v1

**Status**: Draft
**Created**: 2026-04-19
**Supersedes**: N/A
**Related plan**: [.sdd/plans/mcp-push-notification-v1.md]

---

## Overview

When a message is sent to an agent via the broker, push a channel notification directly through the agent's MCP SSE transport. Eliminates the need for polling — messages arrive instantly.

## User Scenarios

### Instant message delivery · P1

**As a** Claude Code session (Session A)
**I want to** send a message to Session B and have it arrive immediately
**So that** Session B's Claude can act on it without polling delay

**Acceptance criteria:**

- Given Session B is connected via MCP HTTP, when Session A sends a message via `reply` tool, then Session B receives a `<channel>` notification within 1 second
- Given Session B receives the notification, then it contains `from`, `from_name`, and the message text

### No polling required · P1

**As a** developer
**I want to** messages to be pushed via SSE without polling
**So that** the architecture is simpler and more responsive

**Acceptance criteria:**

- Given an agent is connected via MCP HTTP with an open SSE stream, when a message arrives, then it is pushed via `notifications/claude/channel` on the SSE stream
- Given no polling endpoint is called, messages still arrive

---

## Functional Requirements

| ID     | Requirement                                                                          |
|--------|--------------------------------------------------------------------------------------|
| FR-001 | Server MUST store a reference to each agent's MCP server instance by agentId (MUST)  |
| FR-002 | When `sendMessage()` is called, server MUST push a channel notification to the target agent's MCP server (MUST) |
| FR-003 | Notification MUST use method `notifications/claude/channel` (MUST)                   |
| FR-004 | Notification params MUST include `content` (message text) and `meta` with `from` and `from_name` (MUST) |
| FR-005 | If target agent has no active MCP connection, message MUST still be queued for REST API polling (MUST) |
| FR-006 | `createAgentMcpServer` MUST register the MCP server instance in a shared registry (MUST) |

## Edge Cases & Constraints

- Agent connected via REST only (no MCP) → message stays in queue, delivered via `/api/poll`
- Agent disconnects → MCP server removed from registry, messages queue for reconnection
- Multiple messages sent rapidly → all delivered in order via SSE

## Success Criteria

| ID     | Criterion                                                                    |
|--------|------------------------------------------------------------------------------|
| SC-001 | Session A sends message → Session B receives `<channel>` notification instantly |
| SC-002 | No polling needed for MCP-connected agents                                   |
| SC-003 | REST API polling still works for non-MCP agents                              |
