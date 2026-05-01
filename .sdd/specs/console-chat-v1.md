# Spec: Console chat UI — v1

**Status**: Approved
**Created**: 2026-05-01
**Related plan**: .sdd/plans/console-chat-v1.md

---

## Overview

A chat page at `/chat` in the console that allows operators to send messages to online agents via Redis streams. Features @mention autocomplete for targeting agents, chat-bubble message display, and polling for new messages.

## User Scenarios

### Send a message to an agent · P1

**As an** operator
**I want to** type a message with an @mention to target a specific agent and send it
**So that** I can communicate with agents through the console

**Acceptance criteria:**

- Given agents are online, when I type `@` in the input, then a dropdown shows online agents
- Given the dropdown is visible, when I type further characters, then the list filters by display name
- Given I select an agent from the dropdown, then `@DisplayName` is inserted and the target is set
- Given a target is set and text is entered, when I press Enter or click Send, then the message is sent via POST to `/api/redis/send`

### View chat messages · P1

**As an** operator
**I want to** see sent and received messages in a chat bubble layout
**So that** I can follow the conversation history

**Acceptance criteria:**

- Given messages exist in `agent-rtc:messages`, when the chat page loads, then messages are displayed as chat bubbles
- Messages sent by "Console" appear on the right (brand blue background, white text)
- Messages from other agents appear on the left (grey-50 background)
- Each bubble shows sender display name, timestamp, and message text
- The chat auto-scrolls to the bottom on new messages

### Navigate to chat · P2

**As an** operator
**I want to** access the chat page from the left nav
**So that** I can easily switch to the chat view

**Acceptance criteria:**

- A "Chat" nav item appears in the left nav below "Messages"
- Clicking it navigates to `/chat`

## Technical notes

- Send endpoint: `POST /api/redis/send` with body `{ targetAgentId, text, senderName }`
- Uses XADD to write to both `agent-rtc:agent:{targetAgentId}` and `agent-rtc:messages`
- Console acts as a virtual agent named "Console"
- Messages polled every 2 seconds via existing message store (dashboard provider polls at 5s, chat overrides to 2s)

## Out of scope

- Real-time WebSocket streaming (future)
- Message editing or deletion
- File attachments
- Multi-agent group chat
