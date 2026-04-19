# Plan: Agent Bridge Channel — v1

**Status**: Done
**Created**: 2026-04-19
**Last updated**: 2026-04-19
**Spec**: [.sdd/specs/agent-bridge-channel-v1.md]

---

## Summary

Implement a custom Channel MCP server for bidirectional HTTP communication between Claude Code sessions using Node.js + TypeScript. Each session runs its own HTTP server and connects to Claude Code via MCP stdio, exchanging messages by posting to the other session's port.

## Technical Context

| Item              | Value                                          |
|-------------------|------------------------------------------------|
| Language          | TypeScript (Node.js v25+)                      |
| Key dependencies  | `@modelcontextprotocol/sdk`                    |
| Files to create   | `src/bridge-channel.ts`, `src/types.ts`, `tsconfig.json`, `package.json` |
| Files to modify   | `.mcp.json`                                    |

---

## Implementation Checklist

### Phase 1 — Interface

- [x] Read spec document and confirm no open questions remain
- [x] Define types in `src/types.ts`: ChannelConfig, BridgeMessage, ReplyArgs
- [x] Review types with the spec — no invented properties

### Phase 2 — Testing

- [x] Write test: HTTP POST → MCP notification emission
- [x] Write test: reply tool call → HTTP POST to target port
- [x] Write test: invalid requests (empty body, wrong method)
- [x] Write test: reply error handling when target server is down

### Phase 3 — Implementation

- [x] `src/bridge-channel.ts`: MCP Server + HTTP listener + reply tool
- [x] `.mcp.json` configuration
- [x] All tests pass (5/5)

### Phase 4 — Docs

- [x] Update this plan with deviations
- [x] Update `.sdd/design.md`

---

## Deviations & Notes

- **2026-04-19**: `BridgeMessage` type is split across HTTP header (`x-sender-port`) + body at the transport level, rather than JSON wrapping. Adopted plain text body + header approach.
- **2026-04-19**: Added `/reply` HTTP endpoint as a proxy for standalone HTTP testing without MCP.
