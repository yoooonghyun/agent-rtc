# Spec: Remove HTTP Broker — v1

**Status**: Approved
**Created**: 2026-04-19
**Supersedes**: N/A
**Related plan**: [.sdd/plans/remove-http-broker-v1.md]

---

## Overview

Remove the Express server, SQLite storage, REST API, React dashboard, and legacy broker-channel. AMQP transport is now the sole communication method. The project becomes a pure MCP ↔ AMQP adapter.

## Functional Requirements

| ID     | Requirement                                                                          |
|--------|--------------------------------------------------------------------------------------|
| FR-001 | Delete `server.ts` (Express server) (MUST)                                           |
| FR-002 | Delete `lib/broker-state.ts` (in-memory/SQLite state) (MUST)                        |
| FR-003 | Delete `lib/db.ts` (SQLite init) (MUST)                                              |
| FR-004 | Delete `src/broker-channel.ts` (HTTP polling broker-channel) (MUST)                  |
| FR-005 | Delete `src/broker.ts` (standalone HTTP broker) (MUST)                               |
| FR-006 | Delete `src/bridge-channel.ts` (v1 direct port-to-port) (MUST)                      |
| FR-007 | Delete `src/broker.test.ts`, `src/bridge-channel.test.ts` (tests for removed code) (MUST) |
| FR-008 | Delete `app/` (React dashboard) (MUST)                                               |
| FR-009 | Delete `vite.config.ts`, `tsconfig.server.json` (build configs for removed code) (MUST) |
| FR-010 | Remove unused dependencies: express, better-sqlite3, @modelcontextprotocol/express, @modelcontextprotocol/node, @modelcontextprotocol/server, react, react-dom, vite, tailwindcss, etc. (MUST) |
| FR-011 | Update `package.json` scripts: remove dev/start/build that reference server/vite (MUST) |
| FR-012 | Keep: `src/amqp-channel.ts`, `src/types.ts`, `tsconfig.mcp.json` (MUST)             |
| FR-013 | Update ARCHITECTURE.md and README.md (MUST)                                          |

## Success Criteria

| ID     | Criterion                                                    |
|--------|--------------------------------------------------------------|
| SC-001 | `npm run build:mcp` succeeds                                |
| SC-002 | `src/amqp-channel.ts` runs successfully against RabbitMQ     |
| SC-003 | No references to Express/SQLite/React remain in codebase     |
