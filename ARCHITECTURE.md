# Agent RTC — Architecture

## Current: Redis Streams (v8)

```
Session A ──stdio→ redis-channel ──Redis Streams──▶ Redis ◀── redis-channel ←stdio── Session B
                                                      │
                                                   Console
                                                (Next.js :3001)
```

### Components

| File | Role |
|---|---|
| `src/redis-channel.ts` | MCP ↔ Redis adapter. XADD/XREAD BLOCK for messaging, Sets for registry |
| `src/types.ts` | Shared type definitions |
| `console/` | Next.js dashboard — queries Redis via API proxy |

### Redis Key Schema

All keys prefixed with `agent-rtc:`:

| Key | Type | Description |
|---|---|---|
| `agent-rtc:agents` | Set | All registered agent IDs |
| `agent-rtc:meta:{agentId}` | Hash | Agent metadata (displayName) |
| `agent-rtc:presence:{agentId}` | String + TTL | Online presence (30s TTL, refreshed every 10s) |
| `agent-rtc:agent:{agentId}` | Stream | Per-agent message queue |
| `agent-rtc:messages` | Stream | Global message log (console history) |
| `agent-rtc:masters` | Set | Master agent IDs |
| `agent-rtc:permissions` | Stream | Permission relay requests |

### Message Flow

1. Agent A calls `reply(targetAgent, text, metadata?)`
2. redis-channel XADDs to `agent-rtc:agent:{targetAgent}` and `agent-rtc:messages`
3. Agent B's redis-channel receives via XREAD BLOCK on its own stream
4. Message delivered as `notifications/claude/channel` to Claude

### Message Payload Shape

The `data` field of every entry written to `agent-rtc:agent:{id}`, `agent-rtc:messages`, and `agent-rtc:permissions` is a JSON string with this shape:

| Field             | Type                       | Required | Notes                                                                                       |
|-------------------|----------------------------|----------|---------------------------------------------------------------------------------------------|
| `type`            | string                     | optional | `"message"`, `"permission_request"`, `"permission_response"`. Absent ⇒ treated as message.   |
| `from`            | string                     | yes      | Sender `agentId` (or `"console"`).                                                          |
| `fromDisplayName` | string                     | yes      | Sender display name.                                                                        |
| `to`              | string                     | yes      | Receiver `agentId`. `"console"` for messages addressed to the console.                       |
| `text`            | string                     | yes      | Message body.                                                                               |
| `timestamp`       | number \| string           | yes      | Millisecond epoch. Some legacy producers stringify it.                                       |
| `metadata`        | `Record<string, string>`   | optional | Opaque context propagated end-to-end (e.g. `telegram_chat_id`). Omitted when not provided.   |

`metadata` is invisible plumbing for downstream routing (e.g. a Telegram dispatch service that needs to send replies back to the originating chat). The broker does NOT interpret its values; it MUST forward them unchanged. Producers should omit the field rather than write `{}` when there's nothing to carry.

### Agent Presence

- On connect: SADD + HSET meta + SET presence with 30s TTL
- Every 10s: refresh presence TTL
- On normal exit (SIGTERM/SIGINT): SREM + DEL presence + DEL meta
- On crash: presence TTL expires → periodic sweep removes from Set

### Permission Relay

- Masters registered in `agent-rtc:masters` Set (via `add_master` tool or `IS_MASTER=true`)
- Permission requests XADDed to `agent-rtc:permissions` stream
- Masters XREAD BLOCK on permissions stream
- Own requests skipped (`from === AGENT_ID`)
- First verdict wins (Claude Code built-in)

### MCP Tools

| Tool | Redis Operation |
|---|---|
| `reply(targetAgent, text)` | XADD to target agent's stream + global messages stream |
| `list_agents()` | SMEMBERS agents + HGETALL meta + EXISTS presence |
| `add_master(id)` | SADD masters |
| `remove_master(id)` | SREM masters |
| `list_masters()` | SMEMBERS masters |

### Key Decisions

- **Redis over RabbitMQ**: Streams provide both instant delivery AND persistent history
- **XREAD BLOCK**: Blocking read — no polling, instant push
- **TTL-based presence**: Backup for crash cleanup, no server-side disconnect hook needed
- **Global messages stream**: Console queries full history via XRANGE
- **Separate Redis connections**: XREAD BLOCK requires dedicated connection per subscription

## Tooling

| Command | What it does |
|---|---|
| `npm run lint` (root) | Runs ESLint for root (`eslint .`) then `npm --prefix console run lint`. Fails on either failure. |
| `npm run typecheck` (root) | Runs `tsc --noEmit -p tsconfig.mcp.json` then `npm --prefix console run typecheck`. |
| `npm run build` (root) | Unchanged: `tsc -p tsconfig.mcp.json` → `dist/`. |
| Pre-commit hook (`.husky/pre-commit`) | `lint-staged` (ESLint on staged `*.ts` / `*.tsx`) + full `npm run typecheck`. |
| CI (`.github/workflows/ci.yml`) | On push to `main` and on PRs: Node 20, install both packages, run lint + typecheck. |

### ESLint configs

- Root: `eslint.config.mjs` (flat config) — `@eslint/js` + `typescript-eslint` recommended. `no-explicit-any` is `error` per CLAUDE.md.
- Console: `console/eslint.config.mjs` — `eslint-config-next` (unchanged).

### Bypassing the hook

`git commit --no-verify` skips the pre-commit hook. Use only for emergencies.
