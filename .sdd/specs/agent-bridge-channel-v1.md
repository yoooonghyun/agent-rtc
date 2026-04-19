# Spec: Agent Bridge Channel — v1

**Status**: Superseded (by central-broker-v1)
**Created**: 2026-04-19
**Supersedes**: N/A
**Related plan**: [.sdd/plans/agent-bridge-channel-v1.md]

---

## Overview

A custom Channel MCP server enabling bidirectional message communication between Claude Code sessions. Each session communicates via a local HTTP server, pushing messages as MCP notifications and exposing a reply tool for responses.

## User Scenarios

### Inter-session messaging · P1

**As a** Claude Code user
**I want to** send a message from Session A to Session B
**So that** Session B's Claude receives and acts on it

**Acceptance criteria:**

- Given Session B is running with the channel server, when Session A POSTs a message to Session B's HTTP port, then a `<channel>` event arrives at Session B's Claude
- Given Session B received a message, when Claude calls the reply tool, then the response is delivered to Session A's HTTP port

### Bidirectional communication · P1

**As a** Claude Code user
**I want to** two sessions to exchange messages in both directions
**So that** collaborative work between sessions is possible

**Acceptance criteria:**

- Given two sessions running channel servers on different ports, when both send messages to each other, then each session's Claude receives the other's messages

### External process dispatch · P2

**As a** developer
**I want to** dispatch tasks to a running Claude session from external processes like curl
**So that** I can programmatically assign tasks to Claude

**Acceptance criteria:**

- Given a session is running with the channel server, when `curl -X POST localhost:<port> -d "message"` is executed, then Claude receives and processes the message

---

## Functional Requirements

| ID     | Requirement                                                              |
|--------|--------------------------------------------------------------------------|
| FR-001 | Server MUST declare MCP `claude/channel` capability                     |
| FR-002 | Server MUST communicate with Claude Code via stdio transport             |
| FR-003 | Server MUST listen for HTTP requests on a configured port               |
| FR-004 | Server MUST push received HTTP POST body as `notifications/claude/channel` |
| FR-005 | Server MUST expose a `reply` tool for Claude to send responses          |
| FR-006 | Reply tool MUST deliver messages to the target session's HTTP port      |
| FR-007 | Port number MUST be configurable via environment variable (`BRIDGE_PORT`) |
| FR-008 | Meta SHOULD include `sender_port` for response routing                  |
| FR-009 | Server MUST provide `instructions` to guide Claude on channel usage     |

## Edge Cases & Constraints

- Target session is down when reply is sent → return HTTP error as tool result
- Two servers on the same port → conflict; port must be separated via env var
- Large messages → out of scope for this PoC; plain text only
- Auth/security → localhost only, no allowlist for this PoC

## Success Criteria

| ID     | Criterion                                                                |
|--------|--------------------------------------------------------------------------|
| SC-001 | Message from Session A arrives at Session B's Claude as `<channel>` tag |
| SC-002 | Session B's Claude successfully replies to Session A via reply tool     |
| SC-003 | Message sent via curl arrives at Claude session correctly               |
| SC-004 | Round-trip message exchange between two sessions succeeds               |

---

## Open Questions

- [x] Runtime: Node.js confirmed
- [x] Message format: plain text for v1
