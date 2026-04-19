# Spec: Adaptive Feedback Agent — v1

**Status**: Approved
**Created**: 2026-04-19
**Supersedes**: N/A
**Related plan**: [.sdd/plans/adaptive-feedback-agent-v1.md]

---

## Overview

An agent triggered by the `TaskCompleted` hook that analyzes completed work and adapts project tooling (skills, agents, hooks, rules in CLAUDE.md) based on repetitive patterns, user feedback, and rule conflicts. Runs as a subagent within the same Claude Code session via a `prompt` hook — no separate process, no race conditions.

## User Scenarios

### Detect repetitive patterns · P1

**As a** developer
**I want to** the agent to detect repetitive manual steps across completed tasks
**So that** those steps are automated as skills, hooks, or agent instructions

**Acceptance criteria:**

- Given multiple tasks have been completed, when the agent detects a recurring pattern (e.g. always running lint after edit), then it proposes adding a hook or skill to automate it
- Given the agent proposes a change, then it writes the change and reports what was added/updated/removed

### Incorporate user feedback · P1

**As a** developer
**I want to** corrections and confirmations from conversations to be captured as rules
**So that** the same guidance doesn't need to be repeated

**Acceptance criteria:**

- Given the transcript contains user corrections (e.g. "don't do X", "always do Y"), when the task completes, then the agent adds/updates relevant rules in CLAUDE.md or agent definitions
- Given the transcript contains confirmation of a non-obvious approach, then the agent records it as a validated pattern

### Detect rule conflicts · P1

**As a** developer
**I want to** conflicting rules across CLAUDE.md, agents, and hooks to be detected
**So that** inconsistencies are resolved before they cause problems

**Acceptance criteria:**

- Given two rules contradict each other (e.g. CLAUDE.md says "use tabs" but an agent says "use spaces"), when the agent runs, then it flags the conflict and proposes a resolution

### Propose tooling changes · P1

**As a** developer
**I want to** the agent to propose concrete changes (not just reports)
**So that** I can review and accept them

**Acceptance criteria:**

- Given the agent detects an improvement opportunity, then it writes the file change directly (skill, agent, hook, or CLAUDE.md update)
- Given the change is written, then the agent outputs a summary of what changed and why

---

## Functional Requirements

| ID     | Requirement                                                                              |
|--------|------------------------------------------------------------------------------------------|
| FR-001 | Agent MUST be defined as `.claude/agents/adaptive-feedback.md`                           |
| FR-002 | A `TaskCompleted` hook MUST use `prompt` type to trigger the agent within the same session |
| FR-003 | The prompt hook MUST instruct Claude to spawn adaptive-feedback as a subagent            |
| FR-004 | Agent MUST scan existing tooling: CLAUDE.md, `.claude/agents/`, `.claude/skills/`, `.claude/settings.json` |
| FR-005 | Agent MUST detect repetitive patterns from the conversation context                      |
| FR-006 | Agent MUST detect user feedback (corrections and confirmations)                          |
| FR-007 | Agent MUST detect conflicts between existing rules, agents, and hooks                    |
| FR-008 | Agent MUST write proposed changes directly to the relevant files                         |
| FR-009 | Agent MUST output a summary of changes made (added/updated/removed)                      |
| FR-010 | Agent MUST NOT modify source code — only project tooling files                           |
| FR-011 | Agent tools MUST be limited to: Read, Glob, Grep, Edit, Write, Bash(git diff:*), Bash(git log:*) |
| FR-012 | No shell scripts or external processes — everything runs in-session                      |

## Edge Cases & Constraints

- Trivial or empty conversation → agent should skip with no changes
- No patterns detected → agent reports "no changes needed"
- Conflicting user feedback within same transcript → flag ambiguity, don't auto-resolve
- No infinite loop risk: `prompt` hook evaluates once and returns, does not create a new task

## Success Criteria

| ID     | Criterion                                                                    |
|--------|------------------------------------------------------------------------------|
| SC-001 | Agent triggers automatically on task completion within the same session      |
| SC-002 | Agent correctly identifies a repetitive pattern and creates a skill/hook     |
| SC-003 | Agent captures user feedback as a CLAUDE.md rule update                      |
| SC-004 | Agent detects and flags a rule conflict                                      |

---

## Open Questions

- [x] Hook mechanism: `prompt` type hook triggers in-session, instructs Claude to spawn subagent
- [x] Race conditions: eliminated — runs in same session, no separate process
- [ ] Should the agent require user confirmation before writing changes? → v1: write directly, user reviews via git diff
