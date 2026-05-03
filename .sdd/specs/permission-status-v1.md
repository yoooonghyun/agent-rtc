# Spec: Permission status matching and auto-approve — v1

**Status**: Approved
**Created**: 2026-05-01
**Supersedes**: n/a
**Related plan**: .sdd/plans/permission-status-v1.md

---

## Overview

Enhance the console chat to (1) hide approve/deny buttons on permission requests that have already been responded to, showing a status badge instead, and (2) provide an auto-approve toggle that automatically approves all incoming permission requests.

## User Scenarios

### Hide buttons on responded requests - P1

**As a** console operator
**I want to** see which permission requests have already been handled
**So that** I don't accidentally re-respond or wonder about stale requests

**Acceptance criteria:**

- Given a permission_request message whose requestId matches a permission_response message in the chat, when the chat renders, then approve/deny buttons are hidden and a status badge ("Approved" or "Denied") is shown instead
- Given a permission_request with no matching response, when the chat renders, then approve/deny buttons remain visible
- Given the user approves a request, when the response appears in chat, then the original request's buttons are replaced with an "Approved" badge

### Auto-approve toggle - P2

**As a** console operator
**I want to** enable auto-approve mode
**So that** permission requests are approved without manual intervention during trusted sessions

**Acceptance criteria:**

- Given auto-approve is enabled, when a new permission_request arrives, then sendPermissionVerdict is called automatically with approved=true
- Given auto-approve is disabled, when a new permission_request arrives, then normal manual flow applies
- Given auto-approve is enabled, when the toggle is visible in the chat header, then it is clearly labeled "Auto-approve"

---

## Functional Requirements

| ID     | Requirement                                                                                         |
|--------|-----------------------------------------------------------------------------------------------------|
| FR-001 | The system MUST collect all permission_response messages and build a set of responded requestIds     |
| FR-002 | The system MUST parse requestId from permission_request text using the pattern `"yes {id}"` or `"no {id}"` |
| FR-003 | The system MUST hide approve/deny buttons for requests with a matching response                      |
| FR-004 | The system MUST show a Badge component ("Approved" or "Denied") on responded requests               |
| FR-005 | The system MUST provide a Switch toggle in the chat header labeled "Auto-approve"                    |
| FR-006 | The system MUST auto-call sendPermissionVerdict(agentId, requestId, true) for new requests when toggle is on |
| FR-007 | The system SHOULD store auto-approve state locally (component state or Zustand)                      |

## Edge Cases & Constraints

- A response may contain prefixed text like "Approved..." or "Denied..." before the verdict pattern — matching must handle both `yes {id}` and `Approved...yes {id}` patterns
- Auto-approve should only fire for genuinely new requests (not on initial load or poll of existing messages)
- Out of scope: per-agent auto-approve rules, persistence of toggle across page reloads

## Success Criteria

| ID     | Criterion                                                          |
|--------|--------------------------------------------------------------------|
| SC-001 | Responded permission requests show badge, no buttons               |
| SC-002 | Unresponded permission requests still show approve/deny buttons    |
| SC-003 | Auto-approve toggle visible in header, functional when enabled     |
| SC-004 | TypeScript compiles without errors                                 |

---

## Open Questions

- None
