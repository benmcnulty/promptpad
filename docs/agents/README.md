# Claude Code Agent Pack - Quick Start Guide

## Overview

This Agent Pack provides standardized roles, reusable prompts, and validation schemas for coordinating Claude Code subagents throughout Promptpad MVP development. Use this pack to maintain consistency and enforce system invariants across all development activities.

## Quick Start

### 1. Choose Your Role
Select the appropriate role based on your PR scope:

```bash
# For API development
docs/agents/roles/api-engineer.md

# For UI components  
docs/agents/roles/ui-engineer.md

# For core algorithms
docs/agents/roles/diff-history-engineer.md

# For system design
docs/agents/roles/architect.md
```

### 2. Use Reusable Prompts
Copy-paste prompt templates with your specific parameters:

```markdown
# Example: Feature implementation
{{task}} = "implement live token counting"
{{files}} = "components/TokenCounter.tsx, lib/tokens/index.ts"
{{tests}} = "__tests__/components/TokenCounter.test.tsx"
{{acceptance_criteria}} = "real-time updates, <100ms performance"
```

### 3. Validate Against Schemas
Run validation before committing:

```bash
# API contract validation
ajv validate -s docs/agents/schemas/api-contract.schema.json -d response.json

# Patch format validation
ajv validate -s docs/agents/schemas/patch.schema.json -d patch.json

# Coverage threshold check
pnpm test --coverage --coverageThreshold=@/docs/agents/schemas/coverage-thresholds.json
```

## Common Workflows

### Starting a New Feature PR

1. **Select Role**: Choose from `docs/agents/roles/`
2. **Review DoR**: Check Definition of Ready criteria
3. **Use Prompt**: Apply `implement-feature.md` template
4. **Validate Contract**: Run `contract-guardrails.md` checks
5. **Write Tests**: Use `write-tests.md` template
6. **Create PR**: Apply `pr-description-template.md`
7. **Write Devlog**: Use `devlog-entry-template.md`

### Code Review Process

1. **Apply Checklist**: Use `code-review-checklist.md`
2. **Check Invariants**: Verify API contracts unchanged
3. **Validate Tests**: Ensure coverage targets met
4. **Performance Check**: Verify requirements met
5. **Security Review**: Check for vulnerabilities

### Handling Architectural Changes

1. **Assess Impact**: Determine if invariants affected
2. **Create ADR**: Use `risk-adr.md` template
3. **Update Contracts**: Modify schemas if approved
4. **Communicate Changes**: Update documentation

## Prompt Templates Usage

### implement-feature.md
```bash
# Parameters to replace
{{feature_name}} = "live token counting display"
{{files}} = "components/TokenCounter.tsx, hooks/useTokenCount.ts"
{{tests}} = "__tests__/components/TokenCounter.test.tsx"
{{acceptance_criteria}} = "real-time counts update, <100ms performance"
```

### write-tests.md  
```bash
# Parameters to replace
{{target_files}} = "lib/diff.ts"
{{happy_path_scenarios}} = "simple text changes, patch application"
{{edge_cases}} = "CRLF mixed with LF, Unicode emoji"
{{performance_tests}} = "10KB text diff generation <100ms"
```

### contract-guardrails.md
```bash
# Run validation
curl -X POST localhost:3000/api/refine -d '{"mode":"refine","input":"test","model":"gpt-oss:20b","temperature":0.2}'
ajv validate -s docs/agents/schemas/api-contract.schema.json -d response.json
```

## Schema Validation Examples

### API Contract Validation
```bash
# Validate GET /api/models response
curl -s http://localhost:3000/api/models | \
  ajv validate -s docs/agents/schemas/api-contract.schema.json

# Validate POST /api/refine request
echo '{"mode":"refine","input":"test","model":"gpt-oss:20b","temperature":0.2}' | \
  ajv validate -s docs/agents/schemas/api-contract.schema.json

# Validate POST /api/refine response  
curl -s -X POST http://localhost:3000/api/refine \
  -H "Content-Type: application/json" \
  -d '{"mode":"refine","input":"test","model":"gpt-oss:20b","temperature":0.2}' | \
  ajv validate -s docs/agents/schemas/api-contract.schema.json
```

### Patch Format Validation
```bash
# Validate patch operations
echo '[{"op":"replace","from":[0,5],"to":"Hello"}]' | \
  ajv validate -s docs/agents/schemas/patch.schema.json

# Validate complex patch
echo '[
  {"op":"replace","from":[0,5],"to":"Create"},
  {"op":"insert","at":25,"to":" comprehensive"},
  {"op":"delete","from":[45,60]}
]' | ajv validate -s docs/agents/schemas/patch.schema.json
```

### Coverage Validation
```bash
# Check coverage thresholds
pnpm test --coverage

# Specific file coverage  
pnpm test lib/diff.ts --coverage

# Validate against thresholds
npx jest --coverage --coverageThreshold='@/docs/agents/schemas/coverage-thresholds.json'
```

## Embedding in PR Descriptions

### Implementation Evidence
```markdown
## Implementation Details
Used `docs/agents/prompts/implement-feature.md` with:
- Feature: Live token counting with tiktoken
- Files: lib/tokens/*, components/TokenCounter.tsx
- Tests: Achieved 85% coverage, performance <100ms
- Contract: No API changes, schema compliance verified
```

### Review Checklist
```markdown
## Review Checklist  
Applied `docs/agents/prompts/code-review-checklist.md`:
- [x] API contracts unchanged (GET /api/models, POST /api/refine)
- [x] Default model remains gpt-oss:20b
- [x] Temperature ≤ 0.3 enforced
- [x] Test coverage ≥80% for core libs achieved
- [x] Performance requirements met
- [x] Security review completed
```

## Role Specialization

### Backend Development
- **Role**: `api-engineer.md`
- **Key Prompts**: `implement-feature.md`, `contract-guardrails.md`
- **Schemas**: `api-contract.schema.json`
- **Focus**: Endpoint implementation, Ollama integration

### Frontend Development  
- **Role**: `ui-engineer.md`
- **Key Prompts**: `implement-feature.md`, `write-tests.md`
- **Focus**: React components, real-time updates

### Algorithm Development
- **Role**: `diff-history-engineer.md`
- **Key Prompts**: `write-tests.md`, `reinforce-diff-generation.md`
- **Schemas**: `patch.schema.json`
- **Focus**: Text processing, patch generation

### Quality Assurance
- **Role**: `qa-engineer.md`
- **Key Prompts**: `write-tests.md`, `code-review-checklist.md`
- **Schemas**: `coverage-thresholds.json`
- **Focus**: Test coverage, edge cases

## Common Mistakes to Avoid

### ❌ Don't Do This
```bash
# Changing API contracts without ADR
{"mode": "refine", "streaming": true}  # New field breaks contract

# Exceeding temperature limit
{"temperature": 0.5}  # Must be ≤ 0.3

# Invalid patch format
{"op": "modify", "range": [0, 5]}  # Should use "replace"

# Insufficient test coverage
# lib/diff.ts: 65% coverage  # Must be ≥80%
```

### ✅ Do This Instead
```bash
# Follow contract exactly
{"mode": "refine", "input": "text", "model": "gpt-oss:20b", "temperature": 0.2}

# Use correct patch format
{"op": "replace", "from": [0, 5], "to": "new text"}

# Achieve coverage targets
# lib/diff.ts: 85% coverage with edge cases
```

## Emergency Procedures

### Contract Violation Detected
1. **STOP** development immediately
2. Open ADR using `risk-adr.md` template
3. Get approval before proceeding
4. Update schemas if changes approved
5. Communicate to all team members

### Test Coverage Failure
1. Identify uncovered code paths
2. Use `write-tests.md` to add missing tests
3. Focus on edge cases and error scenarios
4. Verify coverage meets thresholds
5. Document any intentional exclusions

### Performance Regression
1. Run performance benchmarks
2. Identify bottleneck components
3. Profile and optimize critical paths
4. Verify targets met before merge
5. Update performance monitoring

## Support and Resources

### Documentation
- **Full Index**: `docs/agents/00-index.md`
- **Role Definitions**: `docs/agents/roles/`
- **Prompt Templates**: `docs/agents/prompts/`
- **Schema Validation**: `docs/agents/schemas/`

### Commands Reference
```bash
# Validation commands
ajv validate -s <schema> -d <data>
pnpm test --coverage
pnpm typecheck && pnpm lint && pnpm build

# Development commands  
pnpm dev                    # Start development server
curl -X GET /api/models     # Test models endpoint
curl -X POST /api/refine    # Test refine endpoint
```

### Getting Help
1. Check role-specific guidance in `docs/agents/roles/`
2. Review prompt templates in `docs/agents/prompts/`
3. Validate against schemas in `docs/agents/schemas/`
4. Consult build plan in `docs/plan/`
5. Review AIDEVOPS.md for process guidance

This Agent Pack ensures consistent, high-quality development while maintaining all Promptpad system invariants throughout the MVP build process.