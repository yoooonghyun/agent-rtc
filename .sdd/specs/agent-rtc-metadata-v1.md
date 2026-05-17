# Spec: agent-rtc message metadata propagation — v1

**Status**: Approved
**Created**: 2026-05-17
**Supersedes**: n/a
**Related plan**: .sdd/plans/agent-rtc-metadata-v1.md

---

## Overview

Add an optional `metadata: Record<string, string>` field to every agent-rtc message (agent stream, global messages stream, permission stream) so opaque context — for example `telegram_chat_id` of an originating Telegram chat — can flow from sender through Redis to the receiving agent and back, without the broker interpreting the values. This unblocks a forthcoming console-dispatch-telegram feature that needs to route replies back to the originating chat.

## User Scenarios

### Forward metadata on a reply — P1

**As an** agent calling the `reply` MCP tool
**I want to** attach a small string map of contextual key/value pairs to my message
**So that** downstream consumers (other agents, the console, future Telegram dispatcher) can route or annotate the message without losing the context the original sender provided

**Acceptance criteria:**

- Given an agent calls `reply` with `{ targetAgent, text, metadata: { telegram_chat_id: "123" } }`, when the broker publishes to Redis, then the JSON payload on both `agent-rtc:agent:{targetAgent}` and `agent-rtc:messages` includes `metadata: { telegram_chat_id: "123" }`.
- Given an agent calls `reply` without a `metadata` field, when the broker publishes, then the JSON payload omits `metadata` entirely (or sets it to an empty object) and no error is thrown.
- Given a target agent receives a message whose payload includes `metadata`, when its `redis-channel` forwards the notification to Claude, the existing notification shape is unchanged (metadata may be added to the notification's `meta` object but MUST NOT remove or rename existing fields). [Implementation note: passthrough on the notification is OPTIONAL for v1 — only the Redis-level propagation is required by this spec. Consumer surfacing is via the console API.]

### Read metadata from console APIs — P1

**As a** console (or a future dispatch service) querying the message log
**I want to** see the `metadata` field on each message in API responses
**So that** I can route replies back to their origin (e.g. find the Telegram chat that initiated a conversation)

**Acceptance criteria:**

- Given a message stored on `agent-rtc:messages` includes `metadata`, when the console's `chat-messages`, `all-messages`, `agent-messages`, or `direct-messages` GET handler returns it, then the JSON response objects include a `metadata` property mirroring the stored value.
- Given a message stored before this feature shipped (no `metadata` field), when the console returns it, then the response object omits `metadata` (or sets it to `undefined`/absent) and no parsing error occurs.

### Send metadata from the console — P2

**As a** console-side service (the future Telegram dispatcher)
**I want to** POST to `/api/redis/send` with an optional `metadata` object
**So that** messages it injects into agent-rtc carry the origin context forward

**Acceptance criteria:**

- Given a POST body `{ targetAgentId, text, senderName, metadata: { telegram_chat_id: "123" } }`, when the handler writes to Redis, then the stored JSON payload includes `metadata: { telegram_chat_id: "123" }`.
- Given a POST body that omits `metadata`, when the handler writes to Redis, then the stored JSON payload omits `metadata` and the request succeeds.

### Backward compatibility with existing producers and consumers — P1

**As a** maintainer with running agents and historical Redis streams
**I want to** roll out this change without breaking existing messages or unchanged clients
**So that** the upgrade is safe and reversible

**Acceptance criteria:**

- Given an MCP client that does not pass `metadata`, when it calls `reply`, then the call succeeds with no schema validation error.
- Given a Redis stream entry written before this change (no `metadata`), when the `redis-channel` stream listener (`listenAgentStream` / `listenPermissionStream`) parses it, then parsing succeeds and the message is delivered as before.

---

## Functional Requirements

| ID     | Requirement                                                                                                                                                  |
|--------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| FR-001 | The `reply` MCP tool's input schema MUST accept an optional `metadata` property typed as `Record<string, string>`.                                            |
| FR-002 | The `reply` MCP tool's JSON schema (advertised via `ListTools`) MUST advertise `metadata` as an optional object with string values.                            |
| FR-003 | When `reply` is invoked with `metadata`, the JSON payload XADDed to both target-agent and global-messages streams MUST include that `metadata` object verbatim.|
| FR-004 | When `reply` is invoked without `metadata`, the JSON payload MUST omit the `metadata` field entirely (do not write `"metadata": {}` or `"metadata": null`).    |
| FR-005 | `AgentStreamPayloadSchema` (in `src/redis-channel.ts`) MUST treat `metadata` as `z.record(z.string(), z.string()).optional()` so historical entries still parse.|
| FR-006 | `PermissionStreamPayloadSchema` MUST also accept an optional `metadata` field, so future permission messages can carry origin context. (Permission tool still does not require callers to provide metadata; it just must not crash if present.) |
| FR-007 | The console's `/api/redis` GET handler MUST include `metadata` on the response objects for actions `chat-messages`, `all-messages`, `agent-messages`, and `direct-messages` when the stored payload contained it.                  |
| FR-008 | The console's `/api/redis/send` POST handler MUST accept an optional `metadata: Record<string, string>` in the request body and include it in the JSON payload it writes to Redis.                                                  |
| FR-009 | The console's `Message` TypeScript type (`console/lib/types.ts`) MUST gain an optional `metadata?: Record<string, string>` field.                              |
| FR-010 | The system MUST NOT introduce any `any` or `unknown` in interface signatures, and MUST NOT use inline `as unknown as { ... }` casts. Untrusted JSON parsing MUST go through a zod schema that already exists or is added in this change.                                  |
| FR-011 | The repo-root `npm run lint` and `npm run typecheck` MUST pass with 0 errors after the change.                                                                |
| FR-012 | At least one automated test MUST round-trip a message with `metadata` through a real Redis instance (XADD → XREAD → schema parse) and assert the metadata survives unchanged. The test MUST also round-trip a message without `metadata` to assert backward compatibility. |

## Edge Cases & Constraints

- **Empty metadata object**: If a caller passes `metadata: {}`, the broker MAY either omit the field or persist the empty object. Either behaviour is acceptable; tests must not assume one or the other for empty input. The recommended behaviour is to omit when empty, to keep payloads minimal.
- **Non-string values**: zod must reject `metadata` whose values are not strings (e.g. numbers, booleans, nested objects). The `reply` tool MUST return an error in that case rather than silently coercing.
- **Large metadata**: No size cap enforced in v1. Keys/values are expected to be short identifiers. (Out of scope: rate limiting, key allowlists.)
- **Permission verdict path**: Console-side permission verdicts (the `permission-verdict` POST action and the raw `yes/no <requestId>` message written to the agent stream) are NOT required to propagate metadata in v1. They can be revisited if the dispatch spec needs it.
- **No UI rendering**: This spec is plumbing only. The console UI MUST NOT render `metadata` to users in v1. (Out of scope: any visual surfacing.)
- **The MCP notification `meta` object**: Whether to forward `metadata` into the `notifications/claude/channel` `meta` field is OPTIONAL in v1. If implemented, it MUST be additive (existing `from` and `from_name` keys preserved).
- **Out of scope**: defining the dispatch-telegram feature itself; modifying any agent client's instructions for when to set metadata.

## Success Criteria

| ID     | Criterion                                                                                          |
|--------|----------------------------------------------------------------------------------------------------|
| SC-001 | A `reply` call with `metadata: { telegram_chat_id: "abc" }` results in the same metadata being readable via the console `chat-messages` API on the receiving end. |
| SC-002 | A `reply` call with no metadata succeeds, and pre-existing historical messages still parse and deliver. |
| SC-003 | `npm run lint` and `npm run typecheck` both exit 0 from the repo root.                              |
| SC-004 | `npm run build` produces `dist/redis-channel.js` and the file starts a server without runtime error against the local docker Redis. |
| SC-005 | The automated round-trip test (FR-012) passes against a live Redis instance.                        |

---

## Open Questions

- None. (All ambiguities resolved in scope: empty metadata is implementation-defined; permission verdicts deferred; UI surfacing deferred to the dispatch spec.)
