# Console Permission Approval UI — Spec v1

## Overview

Add permission approval/denial functionality to the console. When agents request tool permissions, the console displays pending requests and allows users to approve or deny them.

## Requirements

1. Console reads permission requests from `agent-rtc:permissions` Redis stream
2. Console can send approval/denial verdicts to agent streams
3. UI displays pending permissions as a banner visible on all pages
4. Each permission shows agent name, tool, description with approve/deny buttons

## Data Model

### Permission Request (from stream)
```json
{
  "type": "permission_request",
  "from": "agent-xxx",
  "fromDisplayName": "Session B",
  "text": "Permission Request from agent-xxx (Session B)\nTool: Bash\nDescription: Run ls\nPreview: {\"command\":\"ls\"}\n\nReply: \"yes abcde\" or \"no abcde\"",
  "timestamp": 1234
}
```

### Parsed PermissionRequest type
```ts
interface PermissionRequest {
  agentId: string;
  agentName: string;
  tool: string;
  description: string;
  preview: string;
  requestId: string;
  timestamp: string;
}
```

### Verdict
Send `"yes {requestId}"` or `"no {requestId}"` to `agent-rtc:agent:{agentId}` stream.

## API Endpoints

- `GET /api/redis?action=permissions` — returns last 50 permission requests
- `POST /api/redis` with `action: "permission-verdict"` — sends verdict to agent

## UI

- Global banner in Shell layout showing pending permission requests
- Polls every 2 seconds
- Approve (green) / Deny (red) buttons
- Dismissed after action
