# Agent RTC

Real-time communication broker for inter-agent messaging, permission relay, and adaptive feedback.

## Tech Stack

- Runtime: Node.js (v25+)
- Server: Express 5
- Client: React 19 + Vite 8
- Language: TypeScript
- Styling: Tailwind CSS v4
- Protocol: MCP Streamable HTTP (@modelcontextprotocol/server v2)

## Project Structure

- `server.ts` — Express server (MCP + REST API + static files)
- `lib/broker-state.ts` — Shared in-memory state
- `lib/mcp-server.ts` — MCP server factory
- `app/` — React dashboard (Vite)
- `src/` — Legacy standalone broker/channel (v1-v2)
- `ARCHITECTURE.md` — Detailed architecture and design decisions

## Development Guide

- **SDD is mandatory for all changes.** Even hotfixes and refactors must have a spec or at minimum a plan with deviations recorded. No code changes without updating `.sdd/`.
- Follow the SDD workflow: specify → plan → interface → test → implement → update docs
- Write specs and plans in `.sdd/` before writing code.
- Write tests before implementation.
- Dev: `npm run dev` (Express :8800 + Vite :5173). Production: `npm run build && npm start`.

## Learned Rules

- When working with libraries or frameworks (MCP SDK, Node.js APIs, etc.), use the context7 MCP tool (`resolve-library-id` → `query-docs`) to fetch current documentation before implementation. Do not rely solely on training data.
- Write modular, reusable code. Extract shared logic into `lib/` modules. Avoid duplicating logic across route handlers, MCP servers, or components.
- Always create tasks (TaskCreate) for non-trivial work. Mark them completed (TaskUpdate) when done. This triggers the adaptive feedback hook.
