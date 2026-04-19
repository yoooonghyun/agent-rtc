# Plan: SQLite Storage — v1

**Status**: Done
**Created**: 2026-04-19
**Last updated**: 2026-04-19
**Spec**: [.sdd/specs/sqlite-storage-v1.md]

---

## Summary

Create a `lib/db.ts` module that initializes SQLite and auto-migrates schema. Rewrite `lib/broker-state.ts` to use DB instead of in-memory Maps. MCP server registry stays in-memory (runtime-only).

## Technical Context

| Item              | Value                                     |
|-------------------|-------------------------------------------|
| Language          | TypeScript                                |
| Key dependencies  | `better-sqlite3`, `@types/better-sqlite3` |
| Files to create   | `lib/db.ts`                               |
| Files to modify   | `lib/broker-state.ts`, `package.json`     |

---

## Implementation Checklist

### Phase 1 — DB Module

- [x] Install `better-sqlite3` + `@types/better-sqlite3`
- [x] Create `lib/db.ts`: init DB, create tables, add-column migration pattern
- [x] Tables: agents, messages, masters, message_log

### Phase 2 — Rewrite broker-state

- [x] Replace Maps/Sets with prepared statements
- [x] Same exported API preserved
- [x] MCP server registry stays in-memory
- [x] sweepStaleAgents deletes from DB

### Phase 3 — Testing

- [x] Full API test: register, send, poll, masters, stats, messages — all pass
- [x] Restart persistence verified: agents, masters, message log survive restart

### Phase 4 — Docs

- [x] Update this plan
- [ ] Update ARCHITECTURE.md
- [ ] Update README.md

---

## Deviations & Notes

- **2026-04-19**: `sendMessage` uses inline query for `fromDisplayName` lookup instead of a separate prepared statement — simpler but slightly less efficient. Acceptable for PoC.
- **2026-04-19**: MAX_LOG_SIZE increased from 100 to 1000 since DB handles larger datasets better than memory.
