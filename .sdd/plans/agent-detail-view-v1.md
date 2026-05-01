# Plan: Agent detail view — v1

**Status**: Complete
**Spec**: .sdd/specs/agent-detail-view-v1.md

---

## Tasks

### 1. Add types for agent detail and consumer data
- **File**: `console/lib/types.ts`
- **Changes**: Add `AgentDetail` and `RabbitConsumer` interfaces

### 2. Add API function for agent detail fetch
- **File**: `console/lib/api.ts`
- **Changes**: Add `fetchAgentDetail(agentId)` that fetches queue detail and consumers

### 3. Create agent detail panel component
- **File**: `console/components/dashboard/agent-detail.tsx`
- **Changes**: New component with Card layout showing all detail fields, close button

### 4. Modify agent list to support row click and detail panel
- **File**: `console/components/dashboard/agent-list.tsx`
- **Changes**: Add click handler on rows, manage selected agent state, render AgentDetail panel

### 5. Install shadcn sheet component (if needed for slide-over)
- Use local state approach with inline slide-over panel instead to avoid extra deps

---

## Deviations

- Used a custom fixed-position slide-over panel instead of shadcn Sheet component to avoid adding a dependency. The panel is a simple `position: fixed` div with a close button.
- State for selected agent and detail data is managed locally within AgentList rather than in a separate zustand store, since the detail view is tightly coupled to the list interaction.
- Connection info is limited to what RabbitMQ's /consumers endpoint provides (consumer tag, channel details). Client properties and connected_at are placeholders since the consumers endpoint doesn't directly include full connection metadata.
