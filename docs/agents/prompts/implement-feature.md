# Reusable Prompt: Implement Feature

## Purpose
Use when creating a new capability within the MVP without altering frozen contracts.

## Why This Template
Ensures invariant protection while enabling focused feature development. Prevents accidental API drift and maintains consistency across all implementations.

## System Intent
Maintain AIDEVOPS invariants; change only specified files; write small, testable units; preserve API contracts.

## Developer Prompt Template

```
You are implementing **{{feature_name}}** in Promptpad MVP.

CONSTRAINTS:
- Touch only these files: {{files}}
- Keep API contracts frozen: GET /api/models; POST /api/refine with mode=refine|reinforce → { output, usage, patch? }
- Default model must remain `gpt-oss:20b`; temperature ≤ 0.3
- Local-first architecture: no cloud dependencies
- Single-screen UI: input left, output right, live token counts
- Two operations only: Refine (expand) and Reinforce (tighten + patch)

REQUIREMENTS:
- Add/extend tests: {{tests}}
- Acceptance criteria: {{acceptance_criteria}}
- Performance targets: {{performance_requirements}}
- Integration points: {{integration_requirements}}

DELIVERABLES:
1. Implementation code with TypeScript strict mode
2. Unit tests achieving required coverage
3. Integration tests if applicable
4. Performance validation
5. Error handling for edge cases

Output a unified diff and summary of tests added/updated.
```

## Verification Commands
```bash
pnpm typecheck && pnpm lint && pnpm build && pnpm test -- --coverage
```

## Usage Examples

### Example 1: Token Counter Component
```
{{feature_name}} = "live token counting display"
{{files}} = "components/TokenCounter.tsx, hooks/useTokenCount.ts, lib/tokens/index.ts"
{{tests}} = "__tests__/components/TokenCounter.test.tsx, __tests__/hooks/useTokenCount.test.tsx"
{{acceptance_criteria}} = "real-time counts update while typing, <100ms performance, debounced updates"
{{performance_requirements}} = "<100ms for 10KB text, non-blocking UI"
{{integration_requirements}} = "integrate with input/output text areas, display beside editors"
```

### Example 2: History Controls
```
{{feature_name}} = "undo/redo button functionality"
{{files}} = "components/HistoryControls.tsx, hooks/useHistory.ts"
{{tests}} = "__tests__/components/HistoryControls.test.tsx"
{{acceptance_criteria}} = "undo/redo buttons work, disabled states correct, keyboard shortcuts"
{{performance_requirements}} = "<10ms per operation"
{{integration_requirements}} = "connect to history stack, update UI state correctly"
```

## Parameter Definitions
- `{{feature_name}}`: Clear, specific name for the capability being added
- `{{files}}`: Exact list of files to create/modify, no wildcards
- `{{tests}}`: Test files to create/update with specific naming
- `{{acceptance_criteria}}`: Testable success conditions
- `{{performance_requirements}}`: Quantified performance targets
- `{{integration_requirements}}`: How feature connects to existing system