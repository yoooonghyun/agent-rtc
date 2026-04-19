# Plan: Adaptive Feedback Agent — v1

**Status**: Done
**Created**: 2026-04-19
**Last updated**: 2026-04-19
**Spec**: [.sdd/specs/adaptive-feedback-agent-v1.md]

---

## Summary

Create an adaptive feedback agent definition and a `prompt` type TaskCompleted hook. The hook instructs Claude to spawn the agent as a subagent within the same session — no shell scripts, no external processes, no race conditions.

## Technical Context

| Item              | Value                                                    |
|-------------------|----------------------------------------------------------|
| Language          | Markdown (agent definition), JSON (settings)             |
| Key dependencies  | Claude Code agent system, hooks system                    |
| Files to create   | `.claude/agents/adaptive-feedback.md`                    |
| Files to modify   | `.claude/settings.json`                                   |

---

## Implementation Checklist

### Phase 1 — Agent Definition

- [x] Create `.claude/agents/adaptive-feedback.md` with frontmatter and prompt
- [x] Define restricted tool set (Read, Glob, Grep, Edit, Write, limited Bash)

### Phase 2 — Hook Configuration

- [x] Configure `prompt` type TaskCompleted hook in `.claude/settings.json`
- [x] No shell script needed — removed `scripts/on-task-completed.sh`

### Phase 3 — Docs

- [x] Update spec (shell script → prompt hook)
- [x] Update plan
- [x] Update design.md

---

## Deviations & Notes

- **2026-04-19**: Initial design used `command` type hook with shell script + `claude -p`. Changed to `prompt` type hook to avoid race conditions and stay in-session.
- **2026-04-19**: Considered `agent` type hook but chose `prompt` type to allow the main Claude to decide how to spawn the subagent.
