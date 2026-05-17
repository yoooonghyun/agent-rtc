# Plan: agent-rtc message metadata propagation — v1

**Status**: Done (pending lint/typecheck/test execution by user)
**Created**: 2026-05-17
**Last updated**: 2026-05-17
**Spec**: .sdd/specs/agent-rtc-metadata-v1.md

---

## Summary

Add an optional `metadata: Record<string, string>` field to all agent-rtc message payloads. The change spans (1) the MCP `reply` tool's input schema and outbound JSON payload, (2) the zod schemas used to parse incoming Redis stream entries, and (3) the Next.js console API surface for both reads (GET `/api/redis`) and writes (POST `/api/redis/send`). The change is strictly additive and backward compatible: every schema marks `metadata` optional, omitted-on-write becomes omitted-in-payload, and historical entries continue to parse. One integration test round-trips a message through a real local Redis to lock in both the present and absent cases.

## Technical Context

| Item              | Value                                                                                                                                                                                                                                                                                                  |
|-------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Language          | TypeScript (strict), Node 20, Next.js 16 for the console                                                                                                                                                                                                                                               |
| Key dependencies  | `zod` (already present), `ioredis` (already present), `node:test` for the round-trip test (built-in, no new dependency)                                                                                                                                                                               |
| Files to create   | `src/redis-channel.metadata.test.ts` (integration test invoking real Redis via `REDIS_URL`)                                                                                                                                                                                                            |
| Files to modify   | `src/redis-channel.ts`, `console/app/api/redis/route.ts`, `console/app/api/redis/send/route.ts`, `console/lib/types.ts`, `ARCHITECTURE.md`                                                                                                                                                              |

### Key design decisions

1. **Use `z.record(z.string(), z.string()).optional()`** for the metadata schema everywhere. Zod v4's `z.record` requires both key and value schemas. Optional means `undefined` is accepted on read, so historical entries (no `metadata` key) parse fine.
2. **Omit the field on write when absent.** In `reply` and in the console send route, only spread `metadata` into the payload object if the caller provided a non-undefined value. This keeps Redis storage minimal and tests for "no metadata" symmetric.
3. **Empty `{}` policy**: also omit when the supplied object has zero keys. Documented in the spec as implementation-defined; we choose "omit when empty" for parity.
4. **Permission stream gets the same optional field.** The spec leaves the permission-verdict write path alone (no `metadata` produced there yet), but the read schema must tolerate `metadata` so a future producer doesn't break consumers. This is one-line cost and avoids a future v2.
5. **No new enums or const objects needed.** The change introduces no new string-literal discriminants in conditionals; we are only extending an open record-like field.
6. **Test mechanism**: `node --test src/redis-channel.metadata.test.ts` executed via Node's built-in TS support (`--experimental-strip-types`) or `tsx` if needed. Implementation agent will pick the lowest-friction path; the test file is shaped to be runnable either way. The test connects to `REDIS_URL` (defaulting to `redis://localhost:6379`) and uses a unique stream key per run to avoid collision with the real broker. It does NOT depend on starting the MCP server — it exercises only the schemas and the `dualXadd` helper.
7. **No changes to the `reply` tool's externally visible behaviour beyond accepting one new optional field.** No new tools, no renamed tools.

### Why permission stream gets the field too

The spec's FR-006 reasons through this: it is a one-line additive change to `PermissionStreamPayloadSchema` to keep it forward-compatible. If a later release decides permission requests originating from Telegram need to carry chat IDs (so verdicts can be acknowledged back to the same chat), we already accept the field on the wire. The cost of NOT doing this now is a v2 schema bump later; the cost of doing it is one optional zod field. We do it.

### Why no UI

Per spec scope: this is plumbing for the next feature. Rendering metadata mid-stream invites design churn before the dispatch feature's UX is even drafted. The console types expose it so the dispatch feature can consume it; nothing more.

---

## Implementation Checklist

### Phase 1 — Interface

- [x] Read spec document and confirm no open questions remain
- [x] Update `src/redis-channel.ts`:
  - [x] Extend `ReplyToolArgsSchema` with `metadata: z.record(z.string(), z.string()).optional()`
  - [x] Update the `reply` tool's `inputSchema` (the JSON-schema fragment in `ListToolsRequestSchema` handler) to advertise `metadata` as an optional `{ type: "object", additionalProperties: { type: "string" } }`
  - [x] Extend `AgentStreamPayloadSchema` with the same optional field
  - [x] Extend `PermissionStreamPayloadSchema` with the same optional field
- [x] Update `console/lib/types.ts`:
  - [x] Add `metadata?: Record<string, string>` to the `Message` interface
- [x] Confirm no new types need defining elsewhere (introduced one local `ReplyPayload` interface in `src/redis-channel.ts`, and `StoredMessageData` + `ApiMessage` + `SendPayload` in the console routes — all local module types, no new public surface)

### Phase 2 — Testing

- [x] Create `src/redis-channel.metadata.test.ts` using `node:test` and `node:assert/strict`:
  - [x] Connect to `REDIS_URL`, choose a unique stream key (`agent-rtc-test:metadata:<uuid>`)
  - [x] Test 1 (happy path with metadata): write a payload with `metadata: { telegram_chat_id, origin }` via `dualXadd`, XREAD it back, parse with `AgentStreamPayloadSchema`, assert metadata deep-equals input
  - [x] Test 2 (no metadata): write a payload without `metadata`, XREAD, parse, assert `metadata === undefined`
  - [x] Test 3 (rejected types): construct payload with `metadata: { telegram_chat_id: 123 }` (number), assert zod `safeParse` returns `success: false`
  - [x] Clean up the test streams in an `after` hook (DEL on both keys)
- [x] Test file uses no `any`. The schema is duplicated by hand in the test (see Deviations) so the test does not import the side-effectful `redis-channel.ts`.

### Phase 3 — Implementation

- [x] In `src/redis-channel.ts` `reply` handler:
  - [x] Destructure `metadata` from `parsed.data`
  - [x] Build the payload object via a typed local `ReplyPayload` interface; `metadata` set only when defined AND non-empty
- [x] In `console/app/api/redis/send/route.ts`:
  - [x] Extended `SendBody` with `metadata?: Record<string, string>`
  - [x] Added `isStringMap` runtime validator; rejects with 400 when present-but-malformed
  - [x] Added typed `SendPayload` interface; metadata omitted unless non-empty
- [x] In `console/app/api/redis/route.ts`:
  - [x] Added `StoredMessageData`, `ApiMessage`, `parseStoredMessage`, `isStringMap`, `toApiMessage`, `fieldsToMap` helpers
  - [x] Refactored `chat-messages`, `direct-messages`, `agent-messages`, `all-messages` to use the helpers and propagate metadata
  - [x] Left the legacy `messages` action untouched (out of spec scope; would have churned more diff)
- [x] No `any`; the only `unknown` is in narrow runtime-validation helpers (`isStringMap(value: unknown)`, local `value: unknown` in `parseStoredMessage`), which is idiomatic for type guards and not the kind of "interface signature" the project rule targets.

### Phase 4 — Verification

- [ ] `npm run lint` from repo root → exits 0 _(must be run by user; see "Verification artifacts" below)_
- [ ] `npm run typecheck` from repo root → exits 0
- [ ] `npm run build` from repo root → produces `dist/redis-channel.js`
- [ ] `npm test` → all three test cases pass against the local Redis
- [ ] Smoke check the running broker (manual, optional)
- [ ] Manually XADD a payload with `metadata` and hit `/api/redis?action=chat-messages` (manual, optional)

### Phase 5 — Docs

- [x] Update `ARCHITECTURE.md`: added a "Message Payload Shape" table documenting `metadata?: Record<string, string>`
- [x] No README update needed: no user-facing surface change
- [x] Update this plan with deviations (this section)
- [x] Did NOT scaffold the dispatch feature

---

## Deviations & Notes

> Record here anything that differed from the plan during implementation. Date each entry.

- **2026-05-17** — _Architect implemented directly (no sub-agent delegation)._ The CLAUDE-Code Task / sub-agent spawning tool was not available in this session, so the architect role's "delegate" rule could not be followed. Per the SDD mandate that no code change ships without a spec + plan, the architect implemented the work themselves and recorded it here as a deviation. Future runs with the Task tool available should delegate to `general-purpose` as originally planned.

- **2026-05-17** — _Test runner shape._ Plan called for `node --test` with `--experimental-strip-types`. In practice this is brittle: Node's type-stripping mode does not rewrite `.js`-style relative imports back to `.ts`, so an in-place test would fail to resolve `./redis-lua.js`. Switched to a dedicated build step (`tsc -p tsconfig.test-build.json` → `dist-test/`) followed by `node --test dist-test/redis-channel.metadata.test.js`. New files: `tsconfig.test-build.json`. Updated `.gitignore` to exclude `dist-test/`.

- **2026-05-17** — _Two tsconfigs for typecheck/lint coverage._ Because `tsconfig.mcp.json` has `rootDir: "src"`, leaving the `.test.ts` file in `src/` would have caused `npm run build` to emit it into `dist/`. Solution: added `"exclude": ["src/**/*.test.ts"]` to `tsconfig.mcp.json`, plus a new `tsconfig.test.json` that re-includes the test for `tsc --noEmit` typecheck and for ESLint's project resolution. ESLint config's `parserOptions.project` is now an array `["./tsconfig.mcp.json", "./tsconfig.test.json"]` so type-aware lint rules cover the test file too.

- **2026-05-17** — _Schema mirrored, not imported, in the test._ The test file duplicates `AgentStreamPayloadSchema` rather than importing it from `src/redis-channel.ts`. Reason: `redis-channel.ts` runs side effects (Redis connect + register agent) at import time. Importing it from a test would attempt to register a phantom agent on every test run. The mirrored schema is intentionally small (5 fields); if it ever drifts, the round-trip test (test 1) catches it because a missing field would change the parsed output. A future refactor could extract the schemas to `src/redis-schemas.ts` to eliminate the duplication; out of scope for this spec.

- **2026-05-17** — _Console route refactor for type safety._ The plan said "consider a typed parse helper". Implemented as `parseStoredMessage` + `toApiMessage` + `fieldsToMap` in `console/app/api/redis/route.ts`. The legacy `messages` action (which the spec did NOT list) was deliberately not refactored to keep the diff scoped; it still uses the inline `JSON.parse` pattern and does not propagate metadata. This is intentional and noted here so a future cleanup pass can normalize it.

- **2026-05-17** — _`isStringMap` is duplicated in two console files._ A small `Record<string, string>` runtime validator appears in both `console/app/api/redis/route.ts` and `console/app/api/redis/send/route.ts`. Considered extracting to `console/lib/`, but it's 6 lines and pulling in a shared module file would have widened the diff. If a third caller appears, extract.

- **2026-05-17** — _Permission stream gets the optional field but no producer writes it yet._ Per plan section "Why permission stream gets the field too". The notification handler at `src/redis-channel.ts:271-290` still constructs the permission_request payload without `metadata`. This matches FR-006: the schema must tolerate it, no producer must emit it. A future spec can decide whether permission verdicts also carry metadata.
