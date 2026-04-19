# agent-rtc

Real-time communication broker for inter-agent messaging, permission relay, and adaptive feedback.

## What it does

- **Inter-agent messaging**: Multiple Claude Code sessions communicate via a central broker using agentId-based routing
- **Permission relay**: When an agent needs tool approval, the request fans out to all registered master agents — first verdict wins
- **Adaptive feedback**: A TaskCompleted hook triggers an in-session agent that detects repetitive patterns, captures user feedback, and resolves rule conflicts across project tooling

## Architecture

```
Session A ──┐                         ┌── Session B
(broker-    ├──▶ Broker (HTTP) ◀──────┤   (broker-
 channel)   │   register/send/poll    │    channel)
Session C ──┘                         └── Session D
```

Each session runs a `broker-channel` MCP server that auto-registers with the central broker and polls for messages. Messages arrive as `<channel>` events in the Claude Code session.

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed design.

## Quick Start

```bash
# Install
npm install

# Build
npm run build

# Start the broker
BROKER_PORT=8800 node dist/broker.js

# Session A
BROKER_URL=http://127.0.0.1:8800 AGENT_ID=session-a AGENT_DISPLAY_NAME="Session A" \
  claude --dangerously-skip-permissions --dangerously-load-development-channels server:broker-channel

# Session B (separate terminal)
BROKER_URL=http://127.0.0.1:8800 AGENT_ID=session-b AGENT_DISPLAY_NAME="Session B" \
  claude --dangerously-skip-permissions --dangerously-load-development-channels server:broker-channel
```

## Features

### Messaging

From Session A, use the `reply` tool to send messages:

```
reply(targetAgent: "session-b", text: "Write a poem about spring")
```

Session B receives it as a `<channel>` event and can reply back.

### Permission Relay

Register master agents to handle permission approvals:

```
add_master(masterAgentId: "session-a")
```

When any agent needs tool approval, all masters receive the request. Respond with `yes <id>` or `no <id>`.

### Available Tools

| Tool | Description |
|------|-------------|
| `reply` | Send a message to another agent |
| `list_agents` | List all registered agents |
| `add_master` | Add a global master agent |
| `remove_master` | Remove a global master agent |
| `list_masters` | List all master agents |

## Testing

```bash
npm run build
npm test
```

## Tech Stack

- **Runtime**: Node.js (v25+)
- **Language**: TypeScript
- **Protocol**: MCP (Model Context Protocol) over stdio
- **Broker Transport**: HTTP (localhost)
- **Key dependency**: [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)

## License

ISC
