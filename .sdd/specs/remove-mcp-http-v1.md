# Spec: Remove MCP HTTP Endpoint — v1

**Status**: Approved
**Created**: 2026-04-19
**Supersedes**: mcp-push-notification-v1, mcp-header-auth-v1 (MCP HTTP approach abandoned)
**Related plan**: [.sdd/plans/remove-mcp-http-v1.md]

---

## Overview

Remove the MCP HTTP Streamable endpoint (`/mcp`) from the Express server. Agents connect exclusively via stdio broker-channel. The server becomes a pure REST API + static file server.

## Rationale

MCP HTTP transport cannot push notifications to clients — Claude Code doesn't open a persistent GET SSE stream, so server-to-client push is impossible. The stdio broker-channel with polling is the proven working approach.

## Functional Requirements

| ID     | Requirement                                                                          |
|--------|--------------------------------------------------------------------------------------|
| FR-001 | Remove `/mcp` POST/GET/DELETE routes from `server.ts` (MUST)                        |
| FR-002 | Remove MCP session store (`transports` map) from `server.ts` (MUST)                 |
| FR-003 | Remove `lib/mcp-server.ts` (MUST)                                                    |
| FR-004 | Remove MCP server registry from `broker-state.ts` (registerMcpServer, unregisterMcpServer, notifyAgent, mcpServers map) (MUST) |
| FR-005 | Remove unused MCP imports from `server.ts` (MUST)                                   |
| FR-006 | `@modelcontextprotocol/express`, `@modelcontextprotocol/node`, `@modelcontextprotocol/server` can be kept as dependencies — still used by `src/broker-channel.ts` via `@modelcontextprotocol/sdk` (MUST NOT break broker-channel) |
| FR-007 | Update ARCHITECTURE.md and README.md to remove MCP HTTP references (MUST)           |

## Success Criteria

| ID     | Criterion                                                    |
|--------|--------------------------------------------------------------|
| SC-001 | Server starts without MCP-related code                       |
| SC-002 | REST API and dashboard still work                            |
| SC-003 | stdio broker-channel still works                             |
