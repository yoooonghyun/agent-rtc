# Spec: Lint & Typecheck Tooling — v1

**Status**: Approved
**Created**: 2026-05-17
**Supersedes**: —
**Related plan**: .sdd/plans/lint-typecheck-tooling-v1.md

---

## Overview

Add ESLint + TypeScript type-checking to both packages in the monorepo (root MCP server and `console/` Next.js app), wire them into a pre-commit hook, and provide a CI workflow. Purely tooling — no runtime behavior changes.

## User Scenarios

### Developer runs lint at repo root · P1

**As a** developer
**I want to** run `npm run lint` from the repo root
**So that** both packages are linted in one command

**Acceptance criteria:**

- Given a clean working tree, when I run `npm run lint`, then both root and console lint commands run and exit 0.
- Given any package has a lint error, when I run `npm run lint`, then the command exits non-zero.

### Developer runs typecheck at repo root · P1

**As a** developer
**I want to** run `npm run typecheck` from the repo root
**So that** both packages are type-checked in one command

**Acceptance criteria:**

- Given a clean working tree, when I run `npm run typecheck`, then root `tsc --noEmit -p tsconfig.mcp.json` and console `tsc --noEmit` both run and exit 0.
- Given a type error in either package, when I run `npm run typecheck`, then the command exits non-zero.

### Commit blocked when lint fails · P1

**As a** developer
**I want to** have a pre-commit hook that runs lint (staged-scoped) and typecheck
**So that** broken code never reaches the repository

**Acceptance criteria:**

- Given I stage a file with a lint error, when I run `git commit`, then the commit is rejected.
- Given I stage a file with a type error, when I run `git commit`, then the commit is rejected.
- Given my staged changes pass lint and typecheck, when I run `git commit`, then the commit succeeds.

### CI verifies pull requests · P1

**As a** maintainer
**I want to** have CI run lint + typecheck on every push to main and every pull request
**So that** the main branch always passes both checks

**Acceptance criteria:**

- Given a pull request is opened, when CI runs, then it executes lint and typecheck for both packages.
- Given CI passes locally with `npm run lint && npm run typecheck`, when the same code runs in CI, then it passes there too.

---

## Functional Requirements

| ID     | Requirement                                                                                                  |
|--------|--------------------------------------------------------------------------------------------------------------|
| FR-001 | The root package MUST have an ESLint flat config using `@eslint/js` + `typescript-eslint`.                   |
| FR-002 | The root package MUST expose a `lint` script that runs ESLint over `src/`.                                   |
| FR-003 | The root package MUST expose a `typecheck` script equivalent to `tsc --noEmit -p tsconfig.mcp.json`.         |
| FR-004 | The console package MUST expose a `typecheck` script equivalent to `tsc --noEmit`.                            |
| FR-005 | The console package MUST keep its existing `lint` script (Next.js ESLint config).                            |
| FR-006 | The repo root MUST expose `lint` and `typecheck` scripts that run BOTH packages and fail if either fails.    |
| FR-007 | A pre-commit hook (husky) MUST run lint (lint-staged scoped) and typecheck for the touched package(s).       |
| FR-008 | A CI workflow at `.github/workflows/ci.yml` MUST run on push to `main` and on pull_request.                  |
| FR-009 | The CI workflow MUST install dependencies for both packages and run lint + typecheck for both.               |
| FR-010 | The ESLint config MUST reflect CLAUDE.md rules (no `any`, no `unknown` in interface signatures where reasonable). |
| FR-011 | The existing `build` script in the root package MUST continue to work unchanged.                             |
| FR-012 | Implementation MUST NOT change runtime behavior of either package.                                           |

## Edge Cases & Constraints

- Initial lint run must pass — if existing code has violations, fix them OR relax the specific rule with justification recorded in the plan's Deviations section.
- Typecheck cannot be easily scoped to staged files (tsc operates on the full project). The pre-commit hook runs full typecheck for affected package(s).
- lint-staged scopes ESLint to staged files only.
- Out of scope: turborepo/nx, prettier, test runners, additional formatting tools.

## Success Criteria

| ID     | Criterion                                                                                       |
|--------|-------------------------------------------------------------------------------------------------|
| SC-001 | `npm run lint` at repo root exits 0 on the current codebase.                                    |
| SC-002 | `npm run typecheck` at repo root exits 0 on the current codebase.                               |
| SC-003 | Pre-commit hook blocks a commit when a staged file has a lint error (manually verified).        |
| SC-004 | `.github/workflows/ci.yml` is valid YAML and mirrors the local checks.                          |
| SC-005 | `npm run build` at repo root still produces the existing `dist/` output unchanged.              |

---

## Open Questions

- None.
