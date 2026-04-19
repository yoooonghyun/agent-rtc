# Agent Bridge Channel

A custom Channel MCP server PoC for bidirectional communication between Claude Code sessions.

## Tech Stack

- Runtime: Node.js (v25+)
- Language: TypeScript
- Protocol: MCP (Model Context Protocol) over stdio
- Transport: HTTP (localhost) for inter-session messaging

## Architecture

```
Session A ──┐                         ┌── Session B
(broker-    ├──▶ Broker (port 8800) ◀─┤   (broker-
 channel)   │    register/send/poll   │    channel)
Session C ──┘                         └── Session D
```

Each session runs its own broker-channel MCP server, which communicates with a central broker via HTTP.

## Development Guide

- Follow the SDD (Spec-Driven Development) workflow: specify → plan → interface → test → implement → update docs
- Write specs and plans in `.sdd/` before writing code.
- Write tests before implementation.
- Use `--dangerously-load-development-channels` flag to test channels in development.

## Learned Rules

- When working with libraries or frameworks (MCP SDK, Node.js APIs, etc.), use the context7 MCP tool (`resolve-library-id` → `query-docs`) to fetch current documentation before implementation. Do not rely solely on training data.
