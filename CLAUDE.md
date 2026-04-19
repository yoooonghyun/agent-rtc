# Agent RTC

Real-time communication broker for inter-agent messaging, permission relay, and adaptive feedback.

## Development Guidelines

- **SDD is mandatory for all changes.** Even hotfixes and refactors must have a spec or at minimum a plan with deviations recorded. No code changes without updating `.sdd/`.
- Follow the SDD workflow: specify → plan → interface → test → implement → update docs.
- Always create tasks (TaskCreate) for non-trivial work. Mark them completed (TaskUpdate) when done. This triggers the adaptive feedback hook.
- Write tests before implementation.
- Write modular, reusable code. Extract shared logic into `lib/` modules. Avoid duplicating logic across route handlers, MCP servers, or components.
- When working with libraries or frameworks, use the context7 MCP tool (`resolve-library-id` → `query-docs`) to fetch current documentation before implementation. Do not rely solely on training data.
- Refer to `ARCHITECTURE.md` for tech stack, project structure, and design decisions.
- Refer to `DESIGN.md` for visual theme, color palette, typography, and component styles.
