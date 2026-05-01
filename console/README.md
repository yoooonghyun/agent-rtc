# agent-rtc console

Web dashboard for monitoring and managing agent-rtc agents.

## Features

- **Chat** — Send messages to agents with @mention autocomplete, agent filter dropdown
- **Overview** — Dashboard with stats, agent/master summary
- **Agents** — Agent list with description, tags, online status. Click for detail + 1:1 chat
- **Masters** — Master pool management
- **Messages** — Paginated message log with full-text tooltip

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **UI Components**: Radix UI + shadcn/ui
- **State**: Zustand with polling auto-refresh
- **Styling**: Tailwind CSS
- **Design System**: Toss Invest (Pretendard, Toss Blue, hairline borders)
- **Data**: Redis via Next.js API proxy

## Quick Start

```bash
# Prerequisites: Redis running (from project root)
docker compose up -d

# Install
npm install

# Development
npm run dev
```

Open http://localhost:3000 (or 3001 if port 3000 is in use)

## Project Structure

```
app/
├── (dashboard)/          # Route group with shared Shell layout
│   ├── page.tsx          # Overview
│   ├── chat/page.tsx     # Chat with @mention
│   ├── agents/page.tsx   # Agent list
│   ├── agents/[agentId]/ # Agent detail + direct chat
│   ├── masters/page.tsx  # Master pool
│   └── messages/page.tsx # Message log
├── api/redis/            # Redis API proxy
│   ├── route.ts          # GET/POST handlers
│   └── send/route.ts     # Send message endpoint
└── layout.tsx            # Root layout

components/dashboard/     # Dashboard components
lib/                      # API client, stores, types, z-index
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
