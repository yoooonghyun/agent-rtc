# Plan: MCP Header-based Agent Registration — v1

**Status**: Done
**Created**: 2026-04-19
**Last updated**: 2026-04-19
**Spec**: [.sdd/specs/mcp-header-auth-v1.md]

---

## Summary

Replace query param-based agent identification with header-based. Server generates agentId, client only provides display name via `X-Agent-Name` header.

## Technical Context

| Item              | Value                                     |
|-------------------|-------------------------------------------|
| Language          | TypeScript                                |
| Files to modify   | `server.ts`, `lib/mcp-server.ts`, `.mcp.json`, `README.md`, `ARCHITECTURE.md` |

---

## Implementation Checklist

### Phase 1 — Interface

- [x] No new types needed

### Phase 2 — Testing

- [x] Test: MCP init with `X-Agent-Name: Researcher` → agent-d4916603, displayName: Researcher
- [x] Test: MCP init without header → agent-193d8346, displayName: Agent (fallback)
- [x] Test: Both agents visible in `/api/agents` with shared state

### Phase 3 — Implementation

- [x] `server.ts`: Read `X-Agent-Name` from header, generate agentId, removed query param parsing
- [x] `lib/mcp-server.ts`: Already includes agentId in instructions (no change needed)
- [x] `.mcp.json`: Updated to header-based config with `${AGENT_NAME}` env var
- [x] Verified with curl

### Phase 4 — Docs

- [x] Update README.md (Connecting Agents section)
- [x] Update ARCHITECTURE.md (MCP Connection section)
- [x] Update this plan

---

## Deviations & Notes

- **2026-04-19**: No deviations from spec.
