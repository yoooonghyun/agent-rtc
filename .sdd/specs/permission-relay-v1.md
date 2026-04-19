# Spec: Permission Relay — v1

**Status**: Superseded (by permission-relay-v2)
**Created**: 2026-04-19
**Supersedes**: N/A
**Related plan**: [.sdd/plans/permission-relay-v1.md]

---

## Overview

Add permission relay to the channel MCP server so that when an agent needs tool approval, the request is forwarded to a registered master agent. The master can approve or deny remotely. Master agent is registered dynamically via broker API.

## User Scenarios

### Master agent registration · P1

**As a** Session A (master) user
**I want to** register myself as Session B's master agent
**So that** Session B's permission requests are handled in this session

### Remote permission approval · P1

**As a** master agent user
**I want to** approve/deny when a subordinate agent needs permission
**So that** I don't need to visit the subordinate's terminal

### Remote permission denial · P1

**As a** master agent user
**I want to** deny dangerous operations
**So that** the subordinate agent doesn't execute the tool

---

## Functional Requirements

| ID     | Requirement                                                                                  |
|--------|----------------------------------------------------------------------------------------------|
| FR-001 | broker-channel MUST always declare `claude/channel/permission` capability                   |
| FR-002 | Broker MUST provide `POST /master` API. body: `{ agentId, masterAgentId }`                  |
| FR-003 | Broker MUST provide `GET /master?agentId=<id>` API                                          |
| FR-004 | broker-channel MUST expose `set_master` tool                                                 |
| FR-005 | broker-channel MUST expose `get_master` tool                                                 |
| FR-006 | broker-channel MUST refresh master info from broker during polling                           |
| FR-007 | On permission request, MUST forward to registered master via broker                          |
| FR-008 | Forwarded message MUST include request_id, tool_name, description, input_preview             |
| FR-009 | MUST recognize `yes <id>` / `no <id>` pattern as verdict in incoming messages               |
| FR-010 | On verdict recognition, MUST emit `notifications/claude/channel/permission`                  |
| FR-011 | Non-verdict messages MUST be forwarded as normal channel notifications                       |
| FR-012 | When no master is registered, MUST skip permission relay with stderr warning                 |

## Edge Cases & Constraints

- Master agent not registered on broker → `POST /master` returns 404
- No master set for agent → stderr warning, relay skipped
- Invalid request_id in verdict → Claude Code ignores (built-in behavior)
- Only meaningful for sessions running without `--dangerously-skip-permissions`

## Success Criteria

| ID     | Criterion                                                                            |
|--------|--------------------------------------------------------------------------------------|
| SC-001 | `set_master` tool registers master successfully                                      |
| SC-002 | `get_master` tool queries master successfully                                        |
| SC-003 | Session B's permission request arrives at master as `<channel>` tag                  |
| SC-004 | Master's `yes <id>` response triggers tool execution on Session B                    |
| SC-005 | Master's `no <id>` response denies tool execution on Session B                       |
