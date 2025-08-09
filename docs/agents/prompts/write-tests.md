# Reusable Prompt: Write Tests

## Purpose
Generate comprehensive tests with specific coverage targets for core libraries and components.

## Why This Template
Ensures consistent test quality, coverage targets, and edge case handling across the MVP. Prevents regressions and validates invariants.

## System Intent
Achieve ≥80% coverage for core libs; test edge cases; validate API contracts; ensure performance requirements.

## Developer Prompt Template

```
Write comprehensive tests for {{target_files}} in Promptpad.

COVERAGE REQUIREMENTS:
- lib/diff.ts: ≥80% lines, 80% branches
- lib/history.ts: ≥80% lines, 80% branches
- lib/tokens/*: ≥80% lines, 75% branches
- API routes: ≥90% lines, 85% branches
- Components: Focus on integration over unit coverage

TEST CATEGORIES:
1. **Happy Path**: {{happy_path_scenarios}}
2. **Edge Cases**: {{edge_cases}}
3. **Error Scenarios**: {{error_scenarios}}
4. **Performance**: {{performance_tests}}
5. **Integration**: {{integration_scenarios}}

SPECIFIC REQUIREMENTS:
- Test fixtures: {{test_fixtures}}
- Mock strategies: {{mocking_requirements}}
- Performance targets: {{performance_targets}}
- Contract validation: {{contract_validation}}

EDGE CASE PRIORITIES:
- CRLF vs LF line endings
- Unicode characters (emoji, accents)
- Empty inputs and zero-length ranges
- Very large inputs (>10KB text)
- localStorage quota exceeded
- Network failures and timeouts

Output test files with clear descriptions and coverage reports.
```

## Verification Commands
```bash
pnpm test {{test_files}} --coverage
pnpm test:integration
pnpm test:perf  # if performance tests exist
```

## Usage Examples

### Example 1: Diff Algorithm Tests
```
{{target_files}} = "lib/diff.ts"
{{happy_path_scenarios}} = "simple text changes, multi-line diffs, patch application"
{{edge_cases}} = "CRLF mixed with LF, Unicode emoji, empty ranges, single character changes"
{{error_scenarios}} = "malformed patches, invalid ranges, null inputs"
{{performance_tests}} = "10KB text diff generation <100ms, patch application <50ms"
{{integration_scenarios}} = "round-trip: original → patch → apply → reverse → original"
{{test_fixtures}} = "sample texts with CRLF, Unicode, large content"
{{mocking_requirements}} = "none - pure functions"
{{performance_targets}} = "<100ms diff generation, <50ms patch application"
{{contract_validation}} = "patch format conforms to schema"
```

### Example 2: API Route Tests
```
{{target_files}} = "app/api/refine/route.ts"
{{happy_path_scenarios}} = "valid refine requests, valid reinforce requests with patches"
{{edge_cases}} = "empty inputs, very long inputs, special characters"
{{error_scenarios}} = "invalid model, Ollama offline, malformed requests"
{{performance_tests}} = "response time <5s for normal prompts"
{{integration_scenarios}} = "end-to-end with real Ollama service"
{{test_fixtures}} = "sample prompts, expected responses, error responses"
{{mocking_requirements}} = "mock Ollama client for unit tests, real client for integration"
{{performance_targets}} = "<5s response time, <1s for model validation"
{{contract_validation}} = "response format {output, usage, patch?} always returned"
```

### Example 3: Component Tests
```
{{target_files}} = "components/TokenCounter.tsx"
{{happy_path_scenarios}} = "displays count correctly, updates on text change"
{{edge_cases}} = "empty text, very large text, special characters"
{{error_scenarios}} = "counting service failure, invalid text input"
{{performance_tests}} = "updates within 100ms, no unnecessary re-renders"
{{integration_scenarios}} = "integrates with useTokenCount hook, displays live updates"
{{test_fixtures}} = "text samples of various sizes"
{{mocking_requirements}} = "mock useTokenCount hook for unit tests"
{{performance_targets}} = "<100ms update time, <5 re-renders per typing session"
{{contract_validation}} = "props interface matches specification"
```

## Parameter Definitions
- `{{target_files}}`: Specific files being tested
- `{{happy_path_scenarios}}`: Normal usage scenarios that should work
- `{{edge_cases}}`: Boundary conditions and unusual inputs
- `{{error_scenarios}}`: Failure modes and error handling
- `{{performance_tests}}`: Speed and resource usage validation
- `{{integration_scenarios}}`: Cross-component interaction testing
- `{{test_fixtures}}`: Sample data needed for testing
- `{{mocking_requirements}}`: What to mock vs. test with real dependencies
- `{{performance_targets}}`: Quantified speed/resource requirements
- `{{contract_validation}}`: Interface and schema compliance testing