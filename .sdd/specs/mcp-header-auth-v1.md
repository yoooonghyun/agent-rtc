# Spec: MCP Header-based Agent Registration — v1

**Status**: Draft
**Created**: 2026-04-19
**Supersedes**: N/A
**Related plan**: [.sdd/plans/mcp-header-auth-v1.md]

---

## Overview

Change MCP agent identification from URL query parameters to HTTP headers. The server generates a unique agentId on connection and registers the agent automatically. Clients only need to provide a display name via header.

## User Scenarios

### Connect with header-based name · P1

**As a** Claude Code session
**I want to** connect to the MCP endpoint with only a display name header
**So that** the URL stays clean and my agentId is auto-assigned

**Acceptance criteria:**

- Given the server is running, when a client sends `POST /mcp` with header `X-Agent-Name: Researcher`, then the server generates a unique agentId and registers the agent
- Given the agent is registered, then the agentId is included in the initialize response's `serverInfo.instructions`
- Given the `.mcp.json` config, then it only needs `url` and `headers.X-Agent-Name`

### Auto-generated agentId · P1

**As a** developer
**I want to** the server to generate unique agentIds
**So that** I don't need to manage IDs manually

**Acceptance criteria:**

- Given two clients connect with the same display name, then each gets a different agentId
- Given the agentId is generated, then it is human-readable (e.g. `agent-a1b2c3d4`)

---

## Functional Requirements

| ID     | Requirement                                                                          |
|--------|--------------------------------------------------------------------------------------|
| FR-001 | Server MUST read display name from `X-Agent-Name` header (MUST)                     |
| FR-002 | Server MUST generate a unique agentId on new session (format: `agent-<8 hex>`) (MUST)|
| FR-003 | Server MUST auto-register the agent in broker-state on connection (MUST)             |
| FR-004 | Server MUST include assigned agentId in `serverInfo.instructions` (MUST)             |
| FR-005 | Server MUST fall back to `"Agent"` if `X-Agent-Name` header is missing (MUST)        |
| FR-006 | URL query params `agentId` and `displayName` MUST be removed (MUST)                  |
| FR-007 | `.mcp.json` and README MUST be updated to reflect header-based config (MUST)         |

## Edge Cases & Constraints

- Missing `X-Agent-Name` header → use default `"Agent"`
- Header value with special characters → accepted as-is (display name only)
- Multiple connections from same client → each gets a new agentId (stateless)

## Success Criteria

| ID     | Criterion                                                                    |
|--------|------------------------------------------------------------------------------|
| SC-001 | MCP initialize with `X-Agent-Name` header returns valid response with agentId|
| SC-002 | Agent appears in `/api/agents` with generated ID and header name             |
| SC-003 | `.mcp.json` uses only `url` + `headers` (no query params)                   |
