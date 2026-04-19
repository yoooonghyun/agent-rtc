# Spec: SQLite Storage — v1

**Status**: Draft
**Created**: 2026-04-19
**Supersedes**: N/A (replaces in-memory state in broker-state.ts)
**Related plan**: [.sdd/plans/sqlite-storage-v1.md]

---

## Overview

Replace in-memory Maps/Sets in broker-state with SQLite (better-sqlite3). Data persists across server restarts. Schema is auto-migrated on startup using `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ADD COLUMN` try/catch pattern.

## User Scenarios

### Data survives restart · P1

**As a** developer
**I want to** registered agents, masters, and message history to survive server restarts
**So that** I don't lose state when restarting during development

**Acceptance criteria:**

- Given agents are registered and messages are sent, when the server restarts, then agents, masters, and message log are still available
- Given the message queue has undelivered messages, when the server restarts, then those messages are still in the queue

### Schema auto-migration · P1

**As a** developer
**I want to** the database schema to be created/updated automatically on startup
**So that** I never need to run manual migrations after upgrading

**Acceptance criteria:**

- Given a fresh install with no DB file, when the server starts, then all tables are created
- Given a DB from a previous version missing a new column, when the server starts, then the column is added with a default value and no error occurs

---

## Functional Requirements

| ID     | Requirement                                                                          |
|--------|--------------------------------------------------------------------------------------|
| FR-001 | Use `better-sqlite3` as the SQLite driver (MUST)                                    |
| FR-002 | DB file location configurable via `DB_PATH` env var, default `data/agent-rtc.db` (MUST) |
| FR-003 | Tables: `agents`, `messages`, `masters`, `message_log` (MUST)                       |
| FR-004 | Schema created via `CREATE TABLE IF NOT EXISTS` on startup (MUST)                    |
| FR-005 | New columns added via `ALTER TABLE ADD COLUMN` wrapped in try/catch (MUST)           |
| FR-006 | `broker-state.ts` API (registerAgent, sendMessage, pollMessages, etc.) MUST remain unchanged |
| FR-007 | Heartbeat (`lastHeartbeat`) MUST be stored in DB (MUST)                              |
| FR-008 | `sweepStaleAgents` MUST delete from DB (MUST)                                        |

## Edge Cases & Constraints

- DB file directory doesn't exist → create it on startup
- Concurrent access → single process, no locking issues with better-sqlite3
- MCP server registry remains in-memory (runtime-only, not persisted)
- Large message log → keep last 1000 in DB (vs 100 in memory)

## Success Criteria

| ID     | Criterion                                                                    |
|--------|------------------------------------------------------------------------------|
| SC-001 | Server restart preserves agents, masters, and message log                    |
| SC-002 | Fresh install creates DB and tables automatically                            |
| SC-003 | All existing API tests pass unchanged                                        |
