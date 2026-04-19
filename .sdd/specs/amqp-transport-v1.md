# Spec: AMQP Transport — v1

**Status**: Draft
**Created**: 2026-04-19
**Supersedes**: HTTP polling transport in broker-channel
**Related plan**: [.sdd/plans/amqp-transport-v1.md]

---

## Overview

Replace the Express broker + HTTP polling with RabbitMQ as the message transport. The broker-channel becomes a pure MCP ↔ AMQP adapter. Each agent gets a queue, messages are delivered instantly via AMQP subscribe. No custom server needed — RabbitMQ handles routing.

## User Scenarios

### Instant message delivery · P1

**As a** Claude Code session
**I want to** receive messages instantly via AMQP subscribe
**So that** there's no polling delay

**Acceptance criteria:**

- Given Session A sends a message to Session B, when Session B is subscribed to its queue, then the message arrives within 100ms
- Given the message arrives, then it is delivered as a `<channel>` notification to Claude

### Agent registration via queue · P1

**As a** Claude Code session
**I want to** automatically register by creating an AMQP queue
**So that** no separate registration endpoint is needed

**Acceptance criteria:**

- Given a broker-channel starts, when it connects to RabbitMQ, then it declares a queue named `agent.{agentId}` and binds to the `agent-rtc` exchange
- Given the queue exists, then the agent is discoverable by other agents

### Agent discovery · P1

**As a** Claude Code session
**I want to** list all online agents
**So that** I know who I can send messages to

**Acceptance criteria:**

- Given multiple agents are connected, when `list_agents` tool is called, then all agents with active queues are returned
- Agent discovery uses RabbitMQ Management API (`GET /api/queues`)

### Auto-cleanup on disconnect · P1

**As a** developer
**I want to** agents to be removed when they disconnect
**So that** only live agents are listed

**Acceptance criteria:**

- Given broker-channel declares queue with `autoDelete: true`, when the session ends and the AMQP connection closes, then the queue is deleted by RabbitMQ automatically

---

## Functional Requirements

| ID     | Requirement                                                                          |
|--------|--------------------------------------------------------------------------------------|
| FR-001 | broker-channel MUST connect to RabbitMQ via `amqplib` (MUST)                        |
| FR-002 | broker-channel MUST declare a topic exchange `agent-rtc` (MUST)                     |
| FR-003 | broker-channel MUST declare an exclusive auto-delete queue `agent.{agentId}` (MUST) |
| FR-004 | broker-channel MUST bind queue to exchange with routing key `agent.{agentId}` (MUST)|
| FR-005 | `reply` tool MUST publish message to exchange with routing key `agent.{targetAgent}` (MUST) |
| FR-006 | broker-channel MUST consume queue and emit MCP `notifications/claude/channel` (MUST)|
| FR-007 | `list_agents` MUST query RabbitMQ Management API for queues matching `agent.*` (MUST)|
| FR-008 | Express server, REST API, SQLite MUST be removed (MUST)                              |
| FR-009 | `AMQP_URL` env var for RabbitMQ connection (default: `amqp://localhost`) (MUST)      |
| FR-010 | `RABBITMQ_API` env var for Management API (default: `http://localhost:15672`) (MUST) |
| FR-011 | Master pool management via RabbitMQ — masters subscribe to `masters.*` routing key (SHOULD) |

## Edge Cases & Constraints

- RabbitMQ not running → broker-channel fails to start with clear error
- Agent sends to non-existent queue → message is dropped (no error, RabbitMQ default)
- RabbitMQ restart → all queues gone (autoDelete), agents reconnect
- Management API requires auth (default: guest/guest)
- Dashboard is out of scope — RabbitMQ Management UI serves this purpose

## Success Criteria

| ID     | Criterion                                                                    |
|--------|------------------------------------------------------------------------------|
| SC-001 | Message from Session A arrives at Session B instantly (no polling)           |
| SC-002 | Agent list shows all connected agents via Management API                     |
| SC-003 | Agent disappears from list when session ends                                 |
| SC-004 | No Express server or SQLite needed                                           |
