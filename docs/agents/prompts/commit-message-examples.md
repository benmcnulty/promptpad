# Reusable Prompt: Commit Message Examples

## Purpose
Provide standardized Conventional Commit patterns for consistent version control history.

## Why This Template
Ensures commit messages follow project conventions and provide clear change history for automated tooling and human readers.

## System Intent
Maintain consistent commit history; enable automated versioning; provide clear change communication; support semantic release.

## Format Template
```
{{type}}({{scope}}): {{description}}

{{optional_body}}

{{optional_footer}}
```

## Commit Types
- **feat**: New feature for users
- **fix**: Bug fix for users
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc)
- **refactor**: Code restructuring without changing behavior
- **perf**: Performance improvements
- **test**: Test additions or improvements
- **chore**: Maintenance tasks, dependencies, build process

## Scope Examples
- **api**: API endpoints and backend logic
- **ui**: User interface components
- **tokens**: Token counting functionality
- **diff**: Text diff and patch operations
- **history**: Undo/redo functionality
- **ollama**: Ollama integration
- **ci**: Continuous integration
- **docs**: Documentation

## Message Examples by Type

### Feature Commits
```
feat(tokens): implement live token counting with tiktoken
feat(api): add POST /api/refine endpoint with Ollama integration
feat(ui): create split-pane layout with resizable panels
feat(diff): implement Myers diff algorithm for patch generation
feat(history): add undo/redo functionality with localStorage
feat(ollama): integrate model selection dropdown with validation
```

### Bug Fix Commits
```
fix(diff): correct patch ranges for CRLF line endings
fix(tokens): prevent memory leak in token counting debounce
fix(api): handle Ollama service unavailable gracefully
fix(ui): resolve focus trap in model selection dropdown
fix(history): prevent localStorage quota exceeded errors
fix(ollama): add retry logic for connection timeouts
```

### Documentation Commits
```
docs(plan): add comprehensive build plan and agent pack
docs(api): update OpenAPI specification for /api/refine
docs(readme): add installation and setup instructions
docs(adr): create ADR for patch format specification
docs(devlog): add PR-0005 implementation summary
```

### Refactoring Commits
```
refactor(tokens): extract tokenizer interface for pluggability
refactor(api): separate validation schemas into dedicated module
refactor(ui): consolidate component prop interfaces
refactor(diff): optimize patch generation algorithm
refactor(history): simplify undo/redo state management
```

### Performance Commits
```
perf(tokens): optimize tiktoken counting with Web Workers
perf(diff): reduce memory allocation in patch generation
perf(ui): implement virtual scrolling for large outputs
perf(api): add response caching for model list
perf(history): limit history stack size to prevent memory growth
```

### Test Commits
```
test(diff): add comprehensive edge case coverage for CRLF
test(api): implement contract validation tests
test(tokens): add performance benchmarks for large inputs
test(ui): create integration tests for user workflows
test(history): add round-trip testing for undo/redo operations
```

### Chore Commits
```
chore(deps): update Next.js to 14.1.0
chore(ci): configure GitHub Actions pipeline
chore(build): optimize bundle size with dynamic imports
chore(lint): configure ESLint and Prettier rules
chore(git): add .gitignore patterns for build artifacts
```

## Multi-line Commit Examples

### Feature with Breaking Change
```
feat(api)!: redesign patch format with metadata support

Replace simple text-range operations with enhanced format
that includes operation metadata for better undo descriptions.

BREAKING CHANGE: patch format changed from {op, from, to} to 
{op, range, content, metadata}
```

### Bug Fix with Context
```
fix(diff): resolve Unicode handling in patch application

Patch application was failing for text containing emoji and
accented characters due to incorrect byte vs character indexing.

Added comprehensive Unicode test fixtures and fixed position
calculation to use character offsets consistently.

Fixes #23
```

### Refactor with Justification
```
refactor(tokens): migrate to pluggable tokenizer architecture

Extract tokenizer interface to support future model-specific
counting algorithms while maintaining tiktoken as default.

This enables better accuracy for different model families
without breaking existing functionality.
```

## Commit Message Guidelines

### Subject Line (First Line)
- Use imperative mood: "add", "fix", "update", not "added", "fixed", "updated"
- Lowercase first letter unless proper noun
- No period at end
- Maximum 50 characters
- Be specific and descriptive

### Body (Optional)
- Wrap at 72 characters
- Explain **what** and **why**, not **how**
- Use bullet points for multiple changes
- Reference issues and PRs when relevant

### Footer (Optional)
- Reference breaking changes: "BREAKING CHANGE: description"
- Reference issues: "Fixes #123", "Closes #456", "Refs #789"
- Co-authored commits: "Co-authored-by: Name <email>"

## Invalid Examples (Don't Do This)

```
❌ "Fixed bug"                    // Too vague
❌ "feat: Added new feature"      // Wrong tense
❌ "Fix(API): Handle errors"      // Wrong capitalization
❌ "fix: fixed the thing that was broken in the api when ollama is down"  // Too long
❌ "Update README.md"            // Missing type and scope
❌ "WIP: working on tokens"       // Work in progress shouldn't be committed
```

## Good Examples

```
✅ feat(tokens): implement real-time counting with debouncing
✅ fix(diff): handle empty text ranges in patch application  
✅ docs(api): add usage examples for /api/refine endpoint
✅ refactor(ui): extract reusable button component
✅ perf(history): optimize localStorage serialization
✅ test(ollama): add integration tests for model validation
✅ chore(deps): bump @types/node to latest LTS version
```

## Usage Prompt Template

```
Generate commit message for changes in {{files_changed}}:

CHANGE SUMMARY:
{{change_description}}

TYPE: {{commit_type}} (feat/fix/docs/refactor/perf/test/chore)
SCOPE: {{affected_area}} (api/ui/tokens/diff/history/ollama/ci/docs)
DESCRIPTION: {{imperative_summary}}

Optional body (if complex):
{{detailed_explanation}}

Optional footer (if applicable):
{{breaking_changes_or_issue_refs}}

Format: {{type}}({{scope}}): {{description}}
```

## Parameter Definitions
- `{{type}}`: Commit type (feat/fix/docs/refactor/perf/test/chore)
- `{{scope}}`: Affected area/component
- `{{description}}`: Imperative summary of changes
- `{{optional_body}}`: Detailed explanation if needed
- `{{optional_footer}}`: Breaking changes or issue references
- `{{files_changed}}`: List of modified files for context
- `{{change_description}}`: What was changed and why
- `{{commit_type}}`: Appropriate type based on change nature
- `{{affected_area}}`: Component or system area modified
- `{{imperative_summary}}`: Concise description in imperative mood
- `{{detailed_explanation}}`: Additional context if change is complex
- `{{breaking_changes_or_issue_refs}}`: BREAKING CHANGE notes or issue links