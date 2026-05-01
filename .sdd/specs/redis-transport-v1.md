# Spec: Redis Transport — v1

**Status**: Draft
**Created**: 2026-05-01
**Supersedes**: amqp-transport-v1 (RabbitMQ → Redis Streams)
**Related plan**: [.sdd/plans/redis-transport-v1.md]

---

## Overview

Replace RabbitMQ with Redis Streams as the sole message transport. Redis handles both real-time delivery (XREAD BLOCK) and persistent message history (XRANGE). Eliminates RabbitMQ dependency.

## User Scenarios

### Instant message delivery · P1

**As a** Claude Code session
**I want to** send and receive messages instantly via Redis Streams
**So that** communication is real-time without polling

**Acceptance criteria:**

- Given Session A sends a message to Session B, when Session B is subscribed via XREAD BLOCK, then the message arrives within 100ms
- Given the message is delivered, then it remains in the Redis Stream for history

### Message history · P1

**As a** console user
**I want to** see all past messages between agents
**So that** I can review communication history

**Acceptance criteria:**

- Given agents have exchanged messages, when the console queries Redis, then all messages are returned in chronological order
- Given the console opens for the first time, then historical messages are visible

### Agent presence · P1

**As a** developer
**I want to** see which agents are online
**So that** I know who is available

**Acceptance criteria:**

- Given an agent connects, when it registers in Redis, then it appears in the agent list
- Given an agent disconnects, when its TTL-based key expires, then it disappears from the list

### Master pool · P1

**As a** developer
**I want to** manage master agents via Redis
**So that** permission relay works without RabbitMQ bindings

**Acceptance criteria:**

- Given a master is added, then it is stored in a Redis Set
- Given a permission request occurs, then all masters in the Set receive it

---

## Functional Requirements

| ID     | Requirement                                                                          |
|--------|--------------------------------------------------------------------------------------|
| FR-001 | Use `ioredis` as the Redis client (MUST)                                            |
| FR-002 | Each agent publishes messages to stream `agent-rtc:agent:{targetAgentId}` via XADD (MUST)     |
| FR-003 | Each agent reads from its own stream `agent-rtc:agent:{agentId}` via XREAD BLOCK (MUST)       |
| FR-004 | Agent registry via Redis Set `agent-rtc:agents` — SADD on connect, SREM on disconnect (MUST) |
| FR-005 | Agent presence via Redis key `agent-rtc:presence:{agentId}` with 30s TTL + 10s refresh (MUST) |
| FR-006 | Agent metadata (displayName) stored in Redis hash `agent-rtc:meta:{agentId}` (MUST)     |
| FR-007 | On normal exit (SIGTERM/SIGINT): SREM + DEL presence + DEL meta immediately (MUST)      |
| FR-008 | On abnormal exit: presence TTL expires → periodic sweep removes from Set (MUST)          |
| FR-009 | Master pool stored in Redis Set `agent-rtc:masters` (MUST)                              |
| FR-010 | Permission requests published to stream `agent-rtc:permissions` (MUST)                  |
| FR-011 | Masters subscribe to `agent-rtc:permissions` stream via XREAD BLOCK (MUST)              |
| FR-012 | All messages logged to stream `agent-rtc:messages` for console history (MUST)           |
| FR-013 | `REDIS_URL` env var for connection (default: `redis://localhost:6379`) (MUST)            |
| FR-014 | Remove RabbitMQ dependency (amqplib, Management API) (MUST)                              |
| FR-015 | Console API proxy updated for Redis queries (MUST)                                       |

## Edge Cases & Constraints

- Redis not running → channel fails to start with clear error
- Agent crash without cleanup → presence key expires via TTL (30s)
- Large message history → XTRIM or MAXLEN to cap stream size (10000 entries)
- Multiple XREAD BLOCK in same process → use separate Redis connections for subscribe vs commands

## Success Criteria

| ID     | Criterion                                                                    |
|--------|------------------------------------------------------------------------------|
| SC-001 | Message from Session A arrives at Session B instantly via Redis Streams       |
| SC-002 | Console shows full message history from Redis                                |
| SC-003 | Agent list shows only live agents (TTL-based presence)                        |
| SC-004 | No RabbitMQ dependency                                                       |
