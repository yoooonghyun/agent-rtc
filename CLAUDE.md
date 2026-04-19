# Agent RTC

Real-time communication broker for inter-agent messaging, permission relay, and adaptive feedback.

## Tech Stack

- Runtime: Node.js (v25+)
- Language: TypeScript
- Protocol: MCP (Model Context Protocol) over stdio
- Transport: HTTP (localhost) for inter-agent messaging

## Project Structure

- `src/broker.ts` — Central broker server (register, send, poll, masters)
- `src/broker-channel.ts` — MCP Channel server connecting Claude Code to the broker
- `src/bridge-channel.ts` — v1 direct port-to-port channel (legacy)
- `src/types.ts` — Shared type definitions
- `ARCHITECTURE.md` — Detailed architecture and design decisions

## Development Guide

- Follow the SDD (Spec-Driven Development) workflow: specify → plan → interface → test → implement → update docs
- Write specs and plans in `.sdd/` before writing code.
- Write tests before implementation.
- Use `--dangerously-load-development-channels` flag to test channels in development.
- Build with `npm run build`, test with `npm test`.

## Learned Rules

- When working with libraries or frameworks (MCP SDK, Node.js APIs, etc.), use the context7 MCP tool (`resolve-library-id` → `query-docs`) to fetch current documentation before implementation. Do not rely solely on training data.
