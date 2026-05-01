# Spec: Console routing — v1

**Status**: Approved
**Created**: 2026-05-01
**Related plan**: .sdd/plans/console-routing-v1.md

---

## Overview

Refactor the agent-rtc console from a single-page tab-switching design to Next.js App Router page-based routing. Each section (overview, agents, masters, messages) maps to its own route with a shared shell layout.

## User Scenarios

### Navigate between sections via URL · P1

**As an** operator
**I want to** navigate between dashboard sections using browser URLs
**So that** I can bookmark and share links to specific sections

**Acceptance criteria:**

- Given the console loads at `/`, the overview page is shown with stats and brief counts
- Given the user clicks "Agents" in the left nav, the browser navigates to `/agents`
- Given the user navigates directly to `/masters`, the masters page loads
- Given the user is on `/messages`, the left nav highlights "Messages"

### Shared layout across all pages · P1

**As an** operator
**I want to** see consistent branding, navigation, and system status across all pages
**So that** the experience feels cohesive

**Acceptance criteria:**

- The top bar, left nav, and right rail are present on every page
- The left nav highlights the active route
- Navigation does not cause a full page reload (client-side routing)

### Message log shows session messages · P2

**As an** operator
**I want to** understand the message log scope
**So that** I know what data is shown

**Acceptance criteria:**

- The messages page shows a note explaining messages are from the current browser session only
- Queue message stats (messages ready, unacknowledged) per agent are shown as a table

## Non-goals

- Server-side message persistence
- RabbitMQ Firehose tracer integration

## Technical notes

- Use Next.js App Router with layout groups
- Shell component refactored to use `Link` + `usePathname()` instead of state-based tabs
- Existing dashboard components (agent-list, master-pool, message-log, stats-bar, right-rail) are reused without duplication
