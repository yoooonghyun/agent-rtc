# Agent RTC

Real-time communication broker for inter-agent messaging, permission relay, and adaptive feedback.

## Development Guidelines

- **SDD is mandatory for all changes.** Even hotfixes and refactors must have a spec or at minimum a plan with deviations recorded. No code changes without updating `.sdd/`.
- Follow the SDD workflow: specify → plan → interface → test → implement → update docs.
- Always create tasks (TaskCreate) for non-trivial work. Mark them completed (TaskUpdate) when done. This triggers the adaptive feedback hook.
- Write tests before implementation.
- Write modular, reusable code. Avoid duplicating logic.
- Avoid `any` type. Use proper TypeScript types for type safety.
- Use enums or const objects for string literals used in conditionals and filters (e.g. message types, actions). Avoid raw string comparisons.
- Never use inline type casts at call sites (e.g. `as unknown as { ... }`). Define a proper interface and type the function parameter or variable instead.
- When working with libraries or frameworks, use the context7 MCP tool (`resolve-library-id` → `query-docs`) to fetch current documentation before implementation. Do not rely solely on training data.
- Refer to `ARCHITECTURE.md` for tech stack, project structure, and design decisions.
