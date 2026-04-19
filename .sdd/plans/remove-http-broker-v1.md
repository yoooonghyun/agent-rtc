# Plan: Remove HTTP Broker — v1

**Status**: Done
**Created**: 2026-04-19
**Last updated**: 2026-04-19
**Spec**: [.sdd/specs/remove-http-broker-v1.md]

---

## Summary

Deleted all HTTP broker, SQLite, Express, React dashboard, legacy broker-channel code. Project is now a pure MCP ↔ AMQP adapter.

## Implementation Checklist

- [x] Delete: server.ts, lib/, app/, vite.config.ts, tsconfig.server.json, src/broker*.ts, src/bridge-channel*, DESIGN.md
- [x] Remove unused deps (express, better-sqlite3, react, vite, tailwind, etc.)
- [x] Update package.json scripts (build + start only)
- [x] Clean npm install + build verified
- [x] Update ARCHITECTURE.md (v7: AMQP only)
- [x] Update README.md
- [x] Update CLAUDE.md

---

## Deviations & Notes

- **2026-04-19**: DESIGN.md removed — no longer has a web dashboard to style.
- **2026-04-19**: tsconfig.json simplified to match tsconfig.mcp.json (they're now identical).
