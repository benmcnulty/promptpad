# Reusable Prompt: Devlog Entry Template

## Purpose
Standardize devlog entries for consistent project tracking and knowledge transfer.

## Why This Template
Ensures complete documentation of changes, decisions, and evidence for future reference and team coordination.

## System Intent
Document all changes comprehensively; provide evidence of testing; track decisions and risks; enable knowledge transfer.

## Developer Prompt Template

```
Create devlog entry for {{pr_number}}: {{pr_title}}

## PR #{{pr_number}}: {{short_title}}
- Branch: {{branch_name}}
- Author/Agent: {{author_agent}}
- Scope: {{scope_category}}
- Summary: {{summary_2_3_lines}}

### Touched Areas
{{touched_files_and_dirs}}

### Test Evidence
{{test_commands_and_results}}

### Key Decisions & Architecture
{{significant_decisions}}

### Performance Impact
{{performance_measurements}}

### Risk Assessment
{{risks_and_mitigations}}

### Integration Points
{{handoffs_and_dependencies}}

### Follow-ups
{{follow_up_items_with_links}}

### Notes for Reviewers
{{reviewer_focus_areas}}

SAVE TO: docs/devlog/PR-{{padded_pr_number}}.md
```

## Standard Test Evidence Format
```bash
# Quality gates
$ pnpm typecheck
✓ No TypeScript errors

$ pnpm lint
✓ ESLint passed

$ pnpm build  
✓ Build successful

$ pnpm test -- --coverage
✓ Tests passed, coverage targets met

# Specific verification
{{custom_test_commands}}
```

## Usage Examples

### Example 1: Core Library Implementation
```
{{pr_number}} = "0004"
{{pr_title}} = "feat(tokens): live token counting with tiktoken"
{{short_title}} = "Token Counting Implementation"
{{branch_name}} = "feat/tokens@claude"
{{author_agent}} = "claude"
{{scope_category}} = "feat"
{{summary_2_3_lines}} = "Implemented pluggable token counting architecture with tiktoken as default. Added real-time UI components with debounced updates for performance. Achieved >80% test coverage with comprehensive edge case handling."
{{touched_files_and_dirs}} = "
- lib/tokens/index.ts (new - abstract interface)
- lib/tokens/tiktoken.ts (new - default implementation)
- components/TokenCounter.tsx (new - display component)
- hooks/useTokenCount.ts (new - React integration)
- __tests__/lib/tokens/ (new - test suite)
- package.json (updated dependencies)
"
{{test_commands_and_results}} = "
$ pnpm test lib/tokens --coverage
✓ 85% line coverage, 80% branch coverage
✓ Performance tests: <100ms for 10KB text
✓ Edge cases: empty text, Unicode, large inputs
✓ Integration: real-time UI updates verified
"
{{significant_decisions}} = "
1. Chose tiktoken over custom tokenizer for gpt-oss:20b approximation
2. Implemented pluggable architecture for future model-specific tokenizers  
3. Debounced updates to 300ms for optimal performance/responsiveness balance
4. Used Web Worker architecture for non-blocking computation
"
{{performance_measurements}} = "
- Token counting: 45ms average for 10KB text (target: <100ms)
- UI updates: 280ms debounced (prevents excessive re-renders)
- Memory usage: <30MB peak (acceptable for browser)
- No blocking operations on main thread verified
"
{{risks_and_mitigations}} = "
- Risk: tiktoken approximation inaccuracy for non-GPT models
- Mitigation: Pluggable architecture allows model-specific tokenizers
- Risk: Performance degradation with very large texts
- Mitigation: Size limits and progressive counting implemented
"
{{integration_points}} = "
- Provides useTokenCount hook for UI integration
- TokenCounter component ready for layout integration
- Interface documented for plugin development
- Performance characteristics validated for real-time use
"
{{follow_up_items_with_links}} = "
- Integrate TokenCounter in main UI layout (next PR)
- Add model-specific tokenizer plugins (future enhancement)
- Performance monitoring in production (enhancement)
"
{{reviewer_focus_areas}} = "Performance during typing, accuracy of estimates, pluggable architecture design"
```

### Example 2: API Implementation
```
{{pr_number}} = "0005"
{{pr_title}} = "feat(api): POST /api/refine with Ollama integration"
{{short_title}} = "Refine API Endpoint"
{{touched_files_and_dirs}} = "
- app/api/refine/route.ts (new - main endpoint)
- lib/ollama.ts (new - client integration)
- lib/prompts.ts (new - template system)
- lib/validation/schemas.ts (new - request validation)
- __tests__/app/api/ (new - API tests)
"
{{test_commands_and_results}} = "
$ pnpm test app/api/refine --coverage
✓ 95% coverage, all contract tests pass

$ curl -X POST localhost:3000/api/refine -d '{\"mode\":\"refine\",\"input\":\"test\",\"model\":\"gpt-oss:20b\",\"temperature\":0.2}'
✓ Response format matches schema
✓ Default model enforcement working
✓ Temperature validation functional
"
{{significant_decisions}} = "
1. Used Zod for request validation (type safety + runtime validation)
2. Implemented retry logic with exponential backoff for Ollama failures
3. Separated prompt templates into dedicated module for maintainability
4. Added comprehensive error handling with user-friendly messages
"
{{performance_measurements}} = "
- Response time: 2.3s average for standard prompts (target: <5s)
- Ollama connection: 150ms average (local network)
- Validation overhead: <10ms per request
- Memory usage: stable across multiple requests
"
```

### Example 3: Bug Fix
```
{{pr_number}} = "0012"
{{pr_title}} = "fix(diff): correct patch ranges for CRLF line endings"
{{short_title}} = "CRLF Patch Fix"
{{summary_2_3_lines}} = "Fixed patch application failures with mixed CRLF/LF line endings by normalizing text before diff generation. Added comprehensive edge case tests and improved error handling for malformed patches."
{{touched_files_and_dirs}} = "
- lib/diff.ts (modified - normalization logic)
- __tests__/lib/diff.test.ts (modified - added CRLF tests)
- __tests__/fixtures/ (new - CRLF test data)
"
{{test_commands_and_results}} = "
$ pnpm test lib/diff --coverage
✓ Round-trip tests pass for CRLF content
✓ 15 new edge case tests added
✓ Performance maintained <100ms
✓ Integration tests with reinforce operation pass
"
{{significant_decisions}} = "
1. Normalize to LF internally, preserve original endings in output
2. Added comprehensive test fixtures for different ending combinations
3. Enhanced error messages for debugging patch failures
"
{{risks_and_mitigations}} = "
- Risk: Performance impact from normalization
- Mitigation: Normalization only when mixed endings detected
- Risk: Breaking existing functionality
- Mitigation: Extensive regression testing completed
"
```

## Scope Categories
- **feat**: New feature or capability
- **fix**: Bug fix or correction
- **docs**: Documentation changes
- **chore**: Tooling, dependencies, maintenance
- **refactor**: Code restructuring without behavior change
- **perf**: Performance improvement
- **test**: Test additions or improvements

## Parameter Definitions
- `{{pr_number}}`: GitHub PR number
- `{{pr_title}}`: Full conventional commit title
- `{{short_title}}`: Concise description for devlog header
- `{{branch_name}}`: Git branch name
- `{{author_agent}}`: Human name or agent identifier
- `{{scope_category}}`: Type of change (feat/fix/docs/chore/etc)
- `{{summary_2_3_lines}}`: Concise overview of what was accomplished
- `{{touched_files_and_dirs}}`: All modified/added/deleted files
- `{{test_commands_and_results}}`: Evidence of thorough testing
- `{{significant_decisions}}`: Important technical or design choices
- `{{performance_measurements}}`: Quantified performance data
- `{{risks_and_mitigations}}`: Identified risks and how they're addressed
- `{{handoffs_and_dependencies}}`: Integration points with other work
- `{{follow_up_items_with_links}}`: Future work or improvements needed
- `{{reviewer_focus_areas}}`: What reviewers should pay attention to