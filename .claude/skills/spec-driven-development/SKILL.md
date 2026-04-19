# Spec-Driven Development Workflow

This document outlines a structured approach for developing features and components through specification-first methodology.

## Core Process

The workflow follows six sequential steps: **specify → plan → interface → test → implement → update docs**. Each phase must be completed before advancing.

## Key Requirements

**Prerequisites**: Two template files must exist in `.claude/skills/spec-driven-development/`:
- `spec_template.md`
- `plan_template.md`

Missing templates should be downloaded from the agent-skills repository.

## Step Breakdown

1. **Specify**: Create versioned specs (`.sdd/specs/<feature>-v<N>.md`) documenting user scenarios, functional requirements, edge cases, and acceptance criteria. Request clarification only on genuinely ambiguous behaviors.

2. **Plan**: Develop implementation plans (`.sdd/plans/<feature>-v<N>.md`) with technical context and checklists, using matching version numbers with specs.

3. **Interface**: Define public contracts (types, signatures, schemas) ensuring every element traces to the specification without adding unrequested behavior.

4. **Testing**: Write comprehensive tests covering happy paths, optional field handling, and invalid/missing required fields before implementation.

5. **Implement**: Code solutions that satisfy tests and specifications exclusively, avoiding scope creep.

6. **Documentation**: Update plans with deviations, create or maintain `ARCHITECTURE.md` as architectural reference, and reflect new patterns discovered.
