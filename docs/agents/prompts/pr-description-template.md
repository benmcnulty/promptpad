# Reusable Prompt: PR Description Template

## Purpose
Standardize PR descriptions with complete checklists and verification steps for consistent merge queue processing.

## Why This Template
Ensures all PRs meet quality gates and include necessary information for review, testing, and merge queue processing.

## System Intent
Provide complete PR information; enable efficient review; ensure quality gate compliance; facilitate merge queue processing.

## Developer Prompt Template

```
Create PR description for {{branch_name}}: {{pr_title}}

# {{pr_title}}

## Summary
{{feature_description}}

## Changes
{{changes_list}}

## Implementation Details
{{implementation_notes}}

## Testing
{{test_evidence}}

## Screenshots/Demo
{{visual_evidence}} (if UI changes)

## Checklist
- [ ] Scope is single-purpose; branch rebased on `main`
- [ ] Devlog entry appended: `docs/devlog/PR-{{pr_number}}.md`
- [ ] Tests added/updated and passing
- [ ] Screenshots/GIF for UI changes (if applicable)
- [ ] No API contract drift (`/api/models`, `/api/refine`, patch format)
- [ ] Default model remains `gpt-oss:20b`; temperature ≤ 0.3
- [ ] Performance requirements met
- [ ] Accessibility validated (if UI changes)
- [ ] Cross-browser compatibility verified (if UI changes)
- [ ] Documentation updated
- [ ] **Ready for merge queue** - Label `queue:ready` when all items checked

## Verification Commands
```bash
{{verification_commands}}
```

## Notes for Reviewers
{{reviewer_notes}}

## Hand-off Information
{{handoff_details}}
```

## Standard Verification Commands
```bash
pnpm typecheck
pnpm lint  
pnpm build
pnpm test -- --coverage
```

## Usage Examples

### Example 1: Feature Implementation PR
```
{{branch_name}} = "feat/token-counter@claude"
{{pr_title}} = "feat(tokens): live token counting with tiktoken"
{{feature_description}} = "Implements real-time token counting display for input and output panes using tiktoken library with debounced updates for performance."
{{changes_list}} = "
- Added lib/tokens/ architecture with pluggable interface
- Implemented tiktoken as default counter
- Created TokenCounter component with real-time updates
- Added useTokenCount hook with debouncing
- Unit tests with >80% coverage
"
{{implementation_notes}} = "Uses tiktoken approximation suitable for gpt-oss:20b. Debounced to 300ms for performance. Pluggable architecture allows future model-specific tokenizers."
{{test_evidence}} = "
- Unit tests: 85% coverage on lib/tokens/*
- Performance tests: <100ms for 10KB text
- Integration tests: real-time UI updates
- Edge case tests: empty text, Unicode, large inputs
"
{{visual_evidence}} = "Screenshots showing token counts updating live in both panes"
{{verification_commands}} = "pnpm typecheck && pnpm lint && pnpm build && pnpm test lib/tokens --coverage"
{{reviewer_notes}} = "Focus on performance during typing and accuracy of token estimates."
{{handoff_details}} = "Ready for UI integration in output pane. Token counting interface documented for future plugins."
```

### Example 2: Bug Fix PR
```
{{branch_name}} = "fix/patch-application@claude" 
{{pr_title}} = "fix(diff): correct patch ranges for CRLF line endings"
{{feature_description}} = "Fixes patch application failures when text contains mixed CRLF and LF line endings by normalizing before diff generation."
{{changes_list}} = "
- Updated diff algorithm to normalize line endings
- Added CRLF test fixtures
- Fixed patch position calculation
- Enhanced error handling for malformed patches
"
{{test_evidence}} = "
- Round-trip tests pass for CRLF content
- Added 15 edge case tests
- Performance unchanged (<100ms)
- Integration tests with reinforce operation
"
{{verification_commands}} = "pnpm test lib/diff --coverage && pnpm test -- --testNamePattern='CRLF'"
```

### Example 3: API Implementation PR
```
{{branch_name}} = "feat/refine-endpoint@claude"
{{pr_title}} = "feat(api): POST /api/refine with Ollama integration"
{{feature_description}} = "Implements POST /api/refine endpoint with refine mode, Ollama integration, and request validation."
{{changes_list}} = "
- Added POST /api/refine route handler
- Implemented Ollama client with error handling
- Added request/response validation with Zod
- Created prompt template system
- API tests with contract validation
"
{{test_evidence}} = "
- API tests: 95% coverage
- Contract tests validate frozen schema
- Integration tests with local Ollama
- Error handling tests (offline, timeout, invalid model)
- Performance tests: <5s response time
"
{{verification_commands}} = "pnpm test app/api/refine && curl -X POST localhost:3000/api/refine -d '{\"mode\":\"refine\",\"input\":\"test\",\"model\":\"gpt-oss:20b\",\"temperature\":0.2}'"
```

## PR Size Guidelines
- **Small**: <200 lines changed, single focused feature
- **Medium**: 200-500 lines, multiple related changes
- **Large**: >500 lines, requires extra review attention

## Checklist Variations by PR Type

**UI Changes (add to standard checklist):**
- [ ] Responsive design verified (375px to 1920px)
- [ ] Keyboard navigation functional
- [ ] Screen reader compatibility tested
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Performance maintained (60fps interactions)

**API Changes (add to standard checklist):**
- [ ] OpenAPI/schema documentation updated
- [ ] Backward compatibility maintained
- [ ] Error responses standardized
- [ ] Rate limiting considered
- [ ] Security review completed

**Core Library Changes (add to standard checklist):**
- [ ] Algorithm correctness verified
- [ ] Performance benchmarks pass
- [ ] Memory usage acceptable
- [ ] Edge cases thoroughly tested
- [ ] Breaking changes documented

## Parameter Definitions
- `{{branch_name}}`: Git branch name following convention
- `{{pr_title}}`: Conventional commit format title
- `{{pr_number}}`: GitHub PR number (will be assigned)
- `{{feature_description}}`: Clear explanation of what was built
- `{{changes_list}}`: Bullet points of specific modifications
- `{{implementation_notes}}`: Technical details and decisions
- `{{test_evidence}}`: Proof that testing was thorough
- `{{visual_evidence}}`: Screenshots or GIFs for UI changes
- `{{verification_commands}}`: Commands to validate the implementation
- `{{reviewer_notes}}`: What reviewers should focus on
- `{{handoff_details}}`: Information for subsequent PRs or team members