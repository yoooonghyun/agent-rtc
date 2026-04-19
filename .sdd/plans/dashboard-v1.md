# Plan: Dashboard — v1

**Status**: Done
**Created**: 2026-04-19
**Last updated**: 2026-04-19
**Spec**: [.sdd/specs/dashboard-v1.md]

---

## Summary

Port the broker to a Next.js custom server with MCP HTTP endpoint. Extract state to a shared module. Add Tailwind CSS with DESIGN.md tokens. Dashboard UI comes after API porting is verified.

## Technical Context

| Item              | Value                                              |
|-------------------|----------------------------------------------------|
| Language          | TypeScript                                         |
| Key dependencies  | next, react, react-dom, tailwindcss, @modelcontextprotocol/server, @modelcontextprotocol/node |
| Files created     | `server.ts`, `lib/broker-state.ts`, `lib/mcp-server.ts`, `lib/api-handler.ts`, `app/layout.tsx`, `app/page.tsx`, `tsconfig.mcp.json` |
| Files modified    | `package.json`, `tsconfig.json`, `.gitignore`, `.mcp.json`, `CLAUDE.md` |

---

## Implementation Checklist

### Phase 1 — Broker Porting + MCP Endpoint

- [x] Install Next.js + React + Tailwind + MCP SDK v2
- [x] Extract broker state to `lib/broker-state.ts`
- [x] Create MCP server factory in `lib/mcp-server.ts` (tools: reply, list_agents, add/remove/list_masters)
- [x] Create REST API handler in `lib/api-handler.ts` (register, send, poll, agents, health, masters/*, stats, messages)
- [x] Create custom server `server.ts`: MCP on `/mcp`, REST on `/api/*`, Next.js on everything else
- [x] Add `/mcp` endpoint with `NodeStreamableHTTPServerTransport` (MCP Streamable HTTP)
- [x] Verify MCP and REST share the same state (agents registered via MCP visible in REST and vice versa)
- [x] Verify broker-channel still works via `BROKER_URL=http://127.0.0.1:8800/api`

### Phase 2 — Tailwind + Theme

- [x] Configure Tailwind v4 with DESIGN.md color tokens via `@theme` in globals.css
- [x] Set up global styles (parchment background, Georgia serif, warm neutrals)

### Phase 3 — Dashboard UI

- [x] Agent list component with master badge and add/remove buttons
- [x] Master pool display component
- [x] Message activity log component (reverse chronological, truncated preview)
- [x] Stats bar component (agent count, master count, messages)
- [x] Auto-refresh via `usePoll` hook (2s interval)
- [x] Assembled dashboard page with header, stats, agents, masters, messages, footer

### Phase 4 — Docs

- [x] Update plan with deviations (this file)
- [x] Update ARCHITECTURE.md

---

## Deviations & Notes

- **2026-04-19**: Originally planned to use Next.js App Router Route Handlers for REST API. Failed because App Router uses Web API Request/Response (not Node.js IncomingMessage/ServerResponse), which is incompatible with MCP SDK's `NodeStreamableHTTPServerTransport`. Also, App Router Route Handlers run in a separate module scope — state is not shared with the custom server.
- **2026-04-19**: Switched to custom server pattern (`server.ts`) that handles MCP + REST directly and delegates UI to Next.js. All state lives in one process.
- **2026-04-19**: Also tried Pages API Routes (`pages/api/mcp.ts`) — worked for MCP but conflicted with App Router routing in Next.js 16.
- **2026-04-19**: Added `lib/mcp-server.ts` — MCP server factory not in original plan. Agents connect via URL (`/mcp?agentId=...&displayName=...`), no `broker-channel.js` deployment needed.
- **2026-04-19**: Added `GET /api/stats` and `GET /api/messages` endpoints not in original spec — needed for dashboard.
