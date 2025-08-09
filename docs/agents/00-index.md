# Claude Code Agent Pack - Index & Overview

## Table of Contents

### Roles & SOPs
- [architect.md](roles/architect.md) - System design and component architecture
- [api-engineer.md](roles/api-engineer.md) - Backend endpoints and Ollama integration
- [ui-engineer.md](roles/ui-engineer.md) - React components and user interface
- [tokens-engineer.md](roles/tokens-engineer.md) - Token counting abstraction and performance
- [diff-history-engineer.md](roles/diff-history-engineer.md) - Patch/diff algorithms and undo/redo
- [qa-engineer.md](roles/qa-engineer.md) - Unit, contract, and UI testing
- [a11y-ux.md](roles/a11y-ux.md) - Accessibility and user experience
- [ci-release.md](roles/ci-release.md) - CI pipeline, merge queue, and versioning
- [docs-steward.md](roles/docs-steward.md) - Documentation maintenance and hygiene

### Reusable Prompt Templates
- [implement-feature.md](prompts/implement-feature.md) - Feature implementation with invariant protection
- [write-tests.md](prompts/write-tests.md) - Test creation with coverage targets
- [contract-guardrails.md](prompts/contract-guardrails.md) - API/patch schema freeze enforcement
- [reinforce-diff-generation.md](prompts/reinforce-diff-generation.md) - Patch-producing Reinforce output
- [risk-adr.md](prompts/risk-adr.md) - Architecture Decision Record creation
- [pr-description-template.md](prompts/pr-description-template.md) - PR formatting and checklists
- [devlog-entry-template.md](prompts/devlog-entry-template.md) - Devlog standardization
- [code-review-checklist.md](prompts/code-review-checklist.md) - Review verification points
- [commit-message-examples.md](prompts/commit-message-examples.md) - Conventional Commit patterns

### Schemas & Constants  
- [api-contract.schema.json](schemas/api-contract.schema.json) - GET /api/models and POST /api/refine shapes
- [patch.schema.json](schemas/patch.schema.json) - Compact text-range patch format
- [coverage-thresholds.json](schemas/coverage-thresholds.json) - Required test coverage per file

## Scope & Purpose

This Agent Pack provides standardized roles, prompts, and validation schemas for coordinating Claude Code subagents throughout Promptpad MVP development. Each artifact explicitly enforces project invariants while enabling focused, parallel development.

## Non-Negotiable Invariants

**Technical Constraints:**
- Local-first via Ollama; default model `gpt-oss:20b`; temperature ≤ 0.3
- Two operations only: Refine (expand) and Reinforce (tighten + patch)  
- Frozen API contracts: `GET /api/models`, `POST /api/refine`
- Patch format: compact text-range operations for diff/undo/redo
- Single-screen UI: input left, output right, live token counts

**Process Requirements:**
- Event-driven merge queue with `queue:ready` label
- Devlog entry per PR using template
- Conventional Commits with squash-merge
- Quality gates: typecheck, lint, build, test with coverage ≥80% for core libs
- ADR required for any invariant changes

## How to Use This Pack in PRs

### 1. Select Appropriate Role
Choose the role that matches your PR scope:
```bash
# UI changes
docs/agents/roles/ui-engineer.md

# API endpoints  
docs/agents/roles/api-engineer.md

# Core algorithms
docs/agents/roles/diff-history-engineer.md
```

### 2. Use Reusable Prompts
Copy-paste parameterized prompts with your specific values:
```markdown
{{task}} = "implement token counting display"
{{files}} = "components/TokenCounter.tsx, lib/tokens/index.ts"
{{acceptance_criteria}} = "real-time counts update, <100ms performance"
```

### 3. Validate Against Schemas
Run validation before committing:
```bash
# API contract compliance
cat response.json | ajv validate -s docs/agents/schemas/api-contract.schema.json

# Patch format verification  
cat patch.json | ajv validate -s docs/agents/schemas/patch.schema.json
```

### 4. Complete Role Checklist
Each role provides DoR/DoD checklist - paste into PR description and verify all items.

## Prompt Embedding Examples

### In PR Descriptions
```markdown
## Implementation Details
Used `docs/agents/prompts/implement-feature.md` with:
- Task: Add live token counting to input/output panes
- Files: components/TokenCounter.tsx, hooks/useTokenCount.ts
- Tests: __tests__/components/TokenCounter.test.tsx
```

### In Code Reviews
```markdown
## Review Checklist
Applied `docs/agents/prompts/code-review-checklist.md`:
- [x] API contracts unchanged
- [x] Default model remains gpt-oss:20b
- [x] Test coverage ≥80% for modified libs
- [x] Performance requirements met
```

## Role → Prompts → Artifacts Mapping

| Role | Primary Prompts | Key Artifacts |
|------|----------------|---------------|
| architect | implement-feature, risk-adr | System design, ADRs |
| api-engineer | implement-feature, contract-guardrails | API routes, validation |
| ui-engineer | implement-feature, write-tests | Components, UI tests |
| tokens-engineer | implement-feature, write-tests | lib/tokens/*, performance tests |
| diff-history-engineer | implement-feature, write-tests | lib/diff.ts, lib/history.ts |
| qa-engineer | write-tests, code-review-checklist | Test suites, coverage reports |
| a11y-ux | implement-feature, code-review-checklist | Accessibility, UX polish |
| ci-release | pr-description-template, devlog-entry-template | CI config, release automation |
| docs-steward | devlog-entry-template, commit-message-examples | Documentation, changelogs |

## Invariant Enforcement Strategy

Each role and prompt explicitly references invariants to prevent drift:

**API Contract Protection:**
- `contract-guardrails.md` prevents endpoint changes
- JSON schemas validate request/response shapes
- ADR requirement for contract modifications

**Process Compliance:**
- Role DoR/DoD enforce quality gates  
- Template prompts include verification commands
- Devlog templates ensure traceability

**Technical Consistency:**
- Default model/temperature checks in all prompts
- Patch format validation via schema
- Coverage thresholds enforced per file

## Quick Start Checklist

Before starting any PR:
- [ ] Identify appropriate role from list above
- [ ] Review role's scope and out-of-scope items
- [ ] Select relevant prompt templates  
- [ ] Validate against applicable schemas
- [ ] Include role checklist in PR description
- [ ] Run verification commands from prompts
- [ ] Create devlog entry using template

This Agent Pack ensures consistent, coordinated development while maintaining all Promptpad invariants throughout the MVP build process.