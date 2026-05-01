# Plan: Console chat UI — v1

**Status**: Complete
**Spec**: .sdd/specs/console-chat-v1.md

---

## Tasks

### 1. Create send message API endpoint
- **File**: `console/app/api/redis/send/route.ts`
- POST endpoint accepting `{ targetAgentId, text, senderName }`
- XADD to `agent-rtc:agent:{targetAgentId}` and `agent-rtc:messages`
- **Status**: Done

### 2. Add sendMessage function to api.ts
- **File**: `console/lib/api.ts`
- Add `sendMessage(targetAgentId, text, senderName)` function
- **Status**: Done

### 3. Create mention input component
- **File**: `console/components/dashboard/mention-input.tsx`
- Text input with @mention autocomplete dropdown
- Filters agents by display name as user types
- Returns selected target agent and message text
- **Status**: Done

### 4. Create chat component
- **File**: `console/components/dashboard/chat.tsx`
- Chat bubble display (sent right/blue, received left/grey)
- Auto-scroll to bottom on new messages
- Integrates mention input for sending
- Polls messages at 2s interval
- **Status**: Done

### 5. Create chat page
- **File**: `console/app/(dashboard)/chat/page.tsx`
- Renders the Chat component
- **Status**: Done

### 6. Add chat to left nav
- **File**: `console/components/dashboard/shell.tsx`
- Add "Chat" nav item below "Messages" with Send icon
- **Status**: Done

## Deviations

None yet.
