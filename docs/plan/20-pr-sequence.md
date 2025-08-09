# PR Sequence & Gate Definitions

## Overview

This document defines the exact sequence of 9 PRs to deliver the Promptpad MVP, with Definition of Ready (DoR) and Definition of Done (DoD) for each PR.

## PR #1: Planning Scaffold

**Branch:** `docs/scaffold@claude`  
**Title:** `docs(plan): initial build plan and templates`  
**Dependencies:** None (this PR)

### Definition of Ready (DoR)
- [ ] All existing documentation analyzed
- [ ] Invariants and constraints understood  
- [ ] Planning scope agreed upon

### Definition of Done (DoD)
- [ ] All files in docs/plan/* created and internally consistent
- [ ] Devlog entry docs/devlog/PR-0001.md added
- [ ] CHANGELOG.md updated with planning entry
- [ ] No contradictions with existing AIDEVOPS.md, AGENTS.md, CLAUDE.md
- [ ] Files pass markdown linting
- [ ] PR labeled `queue:ready`

### Verification Commands
```bash
# Lint markdown files  
pnpm dlx markdownlint docs/plan/*.md
# Validate internal links
pnpm dlx markdown-link-check docs/plan/*.md
```

### Expected Files
- docs/plan/00-high-level.md
- docs/plan/10-work-breakdown.md  
- docs/plan/20-pr-sequence.md
- docs/plan/30-test-strategy.md
- docs/plan/40-risks.md
- docs/plan/50-prompts.md
- docs/devlog/PR-0001.md
- CHANGELOG.md (updated)

---

## PR #2: Next.js Application Scaffold

**Branch:** `feat/app-scaffold@claude`  
**Title:** `feat(scaffold): Next.js app with split-pane layout and Tailwind`  
**Dependencies:** PR #1

### Definition of Ready (DoR)
- [ ] PR #1 merged
- [ ] UI mockups/wireframes reviewed
- [ ] Technology stack confirmed (Next.js 14+, TypeScript, Tailwind)

### Definition of Done (DoD)
- [ ] Next.js app initializes and runs at localhost:3000
- [ ] TypeScript configured in strict mode
- [ ] Tailwind CSS configured with custom theme
- [ ] Split-pane layout implemented (input left, output right)
- [ ] Control bar with all buttons (disabled/placeholder state)
- [ ] Basic responsive design (mobile-friendly)
- [ ] Semantic HTML for accessibility
- [ ] Focus rings and keyboard navigation
- [ ] No console errors or warnings
- [ ] Build succeeds without errors
- [ ] StatusBar visible with: git short SHA (placeholder OK), default model, Ollama state, temperature
- [ ] Non-blank dev shell logs basic health (env, port, default model)

### Verification Commands
```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm build
pnpm dev # Manual verification at localhost:3000
```

### Expected Files
- package.json (with dependencies)
- next.config.js
- tailwind.config.js  
- tsconfig.json
- app/layout.tsx
- app/page.tsx
- app/globals.css
- docs/devlog/PR-0002.md

### Screenshots Required
- Desktop layout at 1920x1080
- Mobile layout at 375x667
- Focus states demonstration

---

## PR #3: Ollama Adapter & Models API

**Branch:** `feat/ollama-adapter@claude`  
**Title:** `feat(ollama): API client and GET /api/models endpoint`  
**Dependencies:** PR #2  

### Definition of Ready (DoR)
- [ ] PR #2 merged  
- [ ] Ollama running locally with gpt-oss:20b model
- [ ] API contract specification reviewed

### Definition of Done (DoD)
- [ ] lib/ollama.ts client implemented with error handling
- [ ] GET /api/models route returns JSON array
- [ ] Model dropdown populates from API
- [ ] gpt-oss:20b marked as default
- [ ] Graceful handling of Ollama offline state
- [ ] Input validation for all API calls
- [ ] Unit tests for ollama client functions
- [ ] Integration test with local Ollama
- [ ] TypeScript types defined

### Verification Commands
```bash
# Start Ollama first
ollama serve &
ollama list # Verify gpt-oss:20b available

# Test application
pnpm typecheck
pnpm lint  
pnpm build
pnpm test lib/ollama
curl http://localhost:3000/api/models
```

### Expected Files
- lib/ollama.ts
- lib/types/ollama.ts
- app/api/models/route.ts
- __tests__/lib/ollama.test.ts
- docs/devlog/PR-0003.md

### API Contract Verification
```json
GET /api/models → 200 OK
[
  {"name": "gpt-oss:20b", "family": "gpt-oss", "parameters": "20b", "default": true},
  {"name": "llama3.2", "family": "llama", "parameters": "8b", "default": false}
]
```

---

## PR #4: Token Counting System

**Branch:** `feat/tokens@claude`  
**Title:** `feat(tokens): live token counting with tiktoken`  
**Dependencies:** PR #2 (can run parallel with PR #3)

### Definition of Ready (DoR)  
- [ ] PR #2 merged
- [ ] tiktoken library research completed
- [ ] Performance requirements defined (<100ms)

### Definition of Done (DoD)
- [ ] lib/tokens/ architecture with pluggable interface
- [ ] tiktoken implementation as default counter
- [ ] TokenCounter React component
- [ ] Real-time counting on input/output text areas
- [ ] Debounced updates for performance
- [ ] Non-blocking UI (async counting)
- [ ] Unit tests achieving ≥80% coverage
- [ ] Performance benchmarks documented
- [ ] Error handling for edge cases

### Verification Commands
```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm test lib/tokens --coverage
# Manual test: type in UI, verify counts update
```

### Expected Files
- lib/tokens/index.ts (interface)
- lib/tokens/tiktoken.ts (implementation)
- lib/tokens/types.ts
- components/TokenCounter.tsx
- __tests__/lib/tokens/tiktoken.test.ts
- __tests__/components/TokenCounter.test.tsx
- docs/devlog/PR-0004.md

### Performance Requirements
- Token counting completes in <100ms for 10KB text
- UI remains responsive during counting
- Memory usage <50MB for normal inputs

---

## PR #5: Refine Operation API

**Branch:** `feat/refine-endpoint@claude`  
**Title:** `feat(refine): POST /api/refine endpoint with prompt template`  
**Dependencies:** PR #3 (Ollama), PR #4 (tokens) 

### Definition of Ready (DoR)
- [ ] PRs #3 and #4 merged
- [ ] Prompt template specification reviewed (from 50-prompts.md)
- [ ] API contract confirmed

### Definition of Done (DoD)
- [ ] POST /api/refine route handler implemented
- [ ] Request validation with Zod schemas
- [ ] Refine prompt template integrated
- [ ] Mode="refine" functional end-to-end
- [ ] Usage tracking (input/output tokens)
- [ ] Comprehensive error handling
- [ ] Input sanitization and validation
- [ ] API tests with mock responses
- [ ] UI integration (Refine button functional)

### Verification Commands  
```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm test app/api/refine
# API test
curl -X POST http://localhost:3000/api/refine \
  -H "Content-Type: application/json" \
  -d '{"mode":"refine","input":"summarize this article","model":"gpt-oss:20b","temperature":0.2}'
```

### Expected Files
- app/api/refine/route.ts
- lib/prompts.ts
- lib/types/api.ts
- lib/validation/schemas.ts
- __tests__/app/api/refine.test.ts
- docs/devlog/PR-0005.md

### API Contract Verification
```json
POST /api/refine
Request: {"mode": "refine", "input": "text", "model": "gpt-oss:20b", "temperature": 0.2}
Response: {"output": "expanded text", "usage": {"input_tokens": 10, "output_tokens": 50}}
```

---

## PR #6: History Management  

**Branch:** `feat/history@claude`  
**Title:** `feat(history): undo/redo stack with localStorage persistence`  
**Dependencies:** PR #5

### Definition of Ready (DoR)
- [ ] PR #5 merged
- [ ] History stack data structure designed
- [ ] localStorage strategy defined

### Definition of Done (DoD)
- [ ] History stack implementation in lib/history.ts
- [ ] Push/undo/redo operations functional
- [ ] localStorage persistence working  
- [ ] Session hydration on page load
- [ ] History size limits and cleanup
- [ ] useHistory React hook
- [ ] Undo/Redo buttons functional in UI
- [ ] All text changes tracked (manual edits + API responses)
- [ ] Unit tests achieving ≥80% coverage
- [ ] Edge cases handled (empty history, size limits)

### Verification Commands
```bash
pnpm typecheck
pnpm lint
pnpm build  
pnpm test lib/history --coverage
# Manual test: edit, undo, redo, reload page
```

### Expected Files
- lib/history.ts
- hooks/useHistory.ts
- components/HistoryControls.tsx
- lib/types/history.ts
- __tests__/lib/history.test.ts
- __tests__/hooks/useHistory.test.ts
- docs/devlog/PR-0006.md

### Manual Test Script
1. Type in input, click Refine
2. Edit output manually  
3. Click Undo → should revert manual edit
4. Click Undo → should revert Refine operation
5. Reload page → history should persist

---

## PR #7: Reinforce Operation & Diffs

**Branch:** `feat/reinforce-diff@claude`  
**Title:** `feat(reinforce): diff algorithm and patch-based reinforcement`  
**Dependencies:** PR #6 (can run parallel after PR #5)

### Definition of Ready (DoR)
- [ ] PR #5 merged (API foundation)
- [ ] Diff algorithm selected (Myers or diff-match-patch)
- [ ] Patch format specification finalized

### Definition of Done (DoD)
- [ ] Text diff algorithm implemented in lib/diff.ts
- [ ] Compact patch format functional
- [ ] Patch application and reversal working
- [ ] Reinforce prompt template integrated
- [ ] Mode="reinforce" API functional
- [ ] DiffViewer component shows changes
- [ ] Apply/discard patch UI working
- [ ] Integration with history stack
- [ ] Edge case testing (CRLF, Unicode, empty ranges)
- [ ] Unit tests achieving ≥80% coverage

### Verification Commands
```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm test lib/diff --coverage
# API test  
curl -X POST http://localhost:3000/api/refine \
  -H "Content-Type: application/json" \
  -d '{"mode":"reinforce","draft":"current text","model":"gpt-oss:20b","temperature":0.2}'
```

### Expected Files
- lib/diff.ts
- components/DiffViewer.tsx
- app/api/refine/route.ts (extended)
- lib/types/diff.ts
- __tests__/lib/diff.test.ts
- __tests__/components/DiffViewer.test.ts
- docs/devlog/PR-0007.md

### Patch Format Validation
```json
Response: {
  "output": "improved text",
  "usage": {"input_tokens": 20, "output_tokens": 25},
  "patch": [
    {"op": "replace", "from": [10, 15], "to": "better"},
    {"op": "delete", "from": [20, 25]},  
    {"op": "insert", "at": 30, "to": "new content"}
  ]
}
```

---

## PR #8: UX Polish & Accessibility

**Branch:** `feat/ux-polish@claude`  
**Title:** `feat(ux): accessibility, keyboard shortcuts, and copy function`  
**Dependencies:** PR #7

### Definition of Ready (DoR)
- [ ] PR #7 merged (core functionality complete)
- [ ] Accessibility audit completed
- [ ] Keyboard shortcuts specification defined

### Definition of Done (DoD)  
- [ ] Keyboard shortcuts implemented (Ctrl+Z/Y, Ctrl+Enter, etc.)
- [ ] Copy button with Clipboard API
- [ ] Loading states and spinners
- [ ] Error boundaries and user feedback
- [ ] Focus management and tab order
- [ ] Screen reader compatibility (ARIA labels)
- [ ] Responsive design improvements
- [ ] Performance optimizations  
- [ ] Cross-browser testing completed
- [ ] Accessibility score >95 (Lighthouse)

### Verification Commands
```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm test components --coverage
# Accessibility test
pnpm dlx @axe-core/cli http://localhost:3000
```

### Expected Files
- hooks/useKeyboardShortcuts.ts  
- components/CopyButton.tsx
- components/LoadingSpinner.tsx
- components/ErrorBoundary.tsx
- app/page.tsx (updated with polish)
- __tests__/hooks/useKeyboardShortcuts.test.ts
- docs/devlog/PR-0008.md

### Manual Test Checklist
- [ ] Tab navigation works correctly
- [ ] Keyboard shortcuts functional
- [ ] Copy to clipboard works
- [ ] Screen reader announces changes
- [ ] Responsive on mobile (375px width)
- [ ] Works in Chrome, Firefox, Safari

---

## PR #9: CI Pipeline & Templates

**Branch:** `chore/ci-and-templates@claude`  
**Title:** `chore(ci): GitHub Actions pipeline and repo templates`  
**Dependencies:** PR #8 (can begin earlier)

### Definition of Ready (DoR)
- [ ] Quality gates defined in AIDEVOPS.md
- [ ] CI requirements specified  
- [ ] Branch protection strategy agreed

### Definition of Done (DoD)
- [ ] GitHub Actions CI workflow functional
- [ ] All quality gates enforced (typecheck, lint, build, test)
- [ ] PR template with complete checklist
- [ ] CODEOWNERS file configured
- [ ] Coverage reporting configured
- [ ] Branch protection rules enabled
- [ ] Merge queue configured (if using GitHub's)
- [ ] CI passes on this PR
- [ ] Documentation updated with CI status

### Verification Commands
```bash
# Verify workflow syntax
pnpm dlx @github/workflow-validator .github/workflows/ci.yml
# Test all gates locally  
pnpm typecheck && pnpm lint && pnpm build && pnpm test
```

### Expected Files
- .github/workflows/ci.yml
- .github/PULL_REQUEST_TEMPLATE.md
- .github/CODEOWNERS
- .github/workflows/merge-queue.yml (if applicable)
- docs/devlog/PR-0009.md

### CI Validation
- [ ] Workflow triggers on PR and push to main
- [ ] Node 20 environment configured
- [ ] pnpm cache working
- [ ] All quality gates pass
- [ ] Coverage report generated
- [ ] Notifications configured

---

## Merge Queue Process

### Queue Entry Requirements
Each PR must be labeled `queue:ready` only after:
1. All DoD criteria met
2. All verification commands pass  
3. Devlog entry completed
4. Screenshots attached (for UI changes)
5. At least one approval received

### Queue Processing
1. Rebase on latest main
2. Re-run CI checks  
3. Squash-merge if green
4. Remove `queue:ready` if checks fail
5. Auto-revert if post-merge issues

### Rollback Protocol
If a merged PR causes issues:
1. Immediate revert via `git revert`
2. Remove `queue:ready` label
3. Create incident devlog entry
4. Open follow-up issue with remediation plan

## Integration Points

### Critical handoffs between PRs:
- PR #2 → PR #3/4: UI scaffold must provide integration points
- PR #3 + PR #4 → PR #5: API client and tokens must integrate cleanly  
- PR #5 → PR #6/7: API responses must work with history and diffs
- PR #7 → PR #8: Core functionality complete before polish

### API Contract Stability
The `/api/refine` contract is frozen after PR #5. Any changes require ADR approval.
