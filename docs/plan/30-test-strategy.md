# Test Strategy & Coverage Map

## Overview

This document defines comprehensive testing approach for Promptpad MVP, emphasizing core library reliability while maintaining development velocity.

## Testing Philosophy

**Priorities:**
1. **Core libraries first** - lib/diff.ts, lib/history.ts, lib/tokens/* require ≥80% coverage
2. **API contract enforcement** - All endpoints tested for request/response compliance  
3. **Edge case handling** - CRLF, Unicode, empty inputs, large texts
4. **Integration points** - Key handoffs between components
5. **User journey coverage** - Critical path scenarios

**Non-priorities for MVP:**
- Visual regression testing
- Load/stress testing  
- Cross-browser automation (manual testing sufficient)
- Comprehensive component unit tests (focus on integration)

## Test Categories & Coverage Targets

### Unit Tests (≥80% coverage required)

#### lib/diff.ts
**Target Coverage:** 80%
```javascript
// Core scenarios
- Text diff generation (add, delete, modify)
- Patch application and reversal
- Empty input handling
- Single character changes
- Large text processing

// Edge cases  
- CRLF vs LF line endings
- Unicode characters (emoji, accents)
- Very long lines (>1000 chars)
- Empty ranges and zero-length patches
- Malformed patch objects

// Performance
- 10KB text processing <100ms
- Memory usage stays reasonable
- No infinite loops on edge inputs
```

#### lib/history.ts  
**Target Coverage:** 80%
```javascript
// Core operations
- Push/undo/redo stack operations
- localStorage persistence
- Session hydration
- History size limits

// Edge cases
- Empty history stack
- Undo past beginning
- Redo past end  
- localStorage quota exceeded
- Corrupted localStorage data
- Multiple browser tabs/windows

// Performance
- History operations <10ms
- Memory usage bounded by size limit
- localStorage I/O non-blocking
```

#### lib/tokens/*
**Target Coverage:** 80%  
```javascript
// Token counting accuracy  
- Short texts (<100 chars)
- Medium texts (100-1000 chars)  
- Long texts (1000-10000 chars)
- Empty strings and whitespace
- Special characters and Unicode

// Performance
- Counting completes <100ms for 10KB text
- Debounced updates work correctly
- Non-blocking UI behavior
- Memory usage reasonable

// Pluggable architecture
- Interface compliance
- Multiple tokenizer switching
- Error handling for unavailable tokenizers
```

### API Tests (100% endpoint coverage)

#### GET /api/models
```javascript
// Success cases
- Returns valid JSON array
- gpt-oss:20b marked as default
- All required fields present
- Response time <1s

// Error cases  
- Ollama service unavailable
- Invalid model format response
- Network timeout handling
```

#### POST /api/refine
```javascript
// Refine mode
- Valid input processing
- Empty input rejection
- Invalid model handling  
- Temperature validation
- Usage tracking accuracy
- Response format compliance

// Reinforce mode  
- Draft text processing
- Patch generation validation
- Empty draft handling
- Large draft processing

// Error scenarios
- Ollama service down
- Invalid request format
- Model not found
- Generation timeout
- Rate limiting
```

### Integration Tests

#### End-to-End User Flows
```javascript
// Happy path
1. Load app → models populate
2. Type input → tokens count
3. Click Refine → output appears with usage
4. Edit output → history tracks changes
5. Click Reinforce → diff shows, apply works
6. Undo/Redo → history navigation works
7. Copy → clipboard contains text
8. Reload page → history persists

// Error recovery
1. Start with Ollama offline → graceful degradation
2. Network interruption during generation → retry logic
3. Invalid model selection → fallback to default
4. localStorage full → history cleanup
5. Corrupted localStorage → fresh start
```

### Component Tests (Selected)

**Focus on integration over unit testing of components**

#### Critical Components Only
- TokenCounter (integration with lib/tokens)
- DiffViewer (integration with lib/diff)  
- HistoryControls (integration with lib/history)

### Performance Benchmarks

#### Response Time Requirements
- Token counting: <100ms for 10KB text
- History operations: <10ms each
- API responses: <5s for normal prompts  
- UI updates: 60fps during typing
- Page load: <2s on broadband

#### Memory Usage Limits
- JavaScript heap: <100MB normal usage
- localStorage: <10MB total
- History stack: <1000 entries max
- Token counting: <50MB temporary allocation

## Test Commands & Scripts

### Local Development
```bash
# Run all tests with coverage
pnpm test --coverage

# Watch mode for TDD
pnpm test --watch lib/diff.test.ts

# Specific test suites  
pnpm test lib/
pnpm test api/
pnpm test components/

# Performance benchmarks
pnpm test:perf

# Integration tests (requires Ollama)
pnpm test:integration
```

### CI Pipeline  
```bash
# Full test suite (required for merge)
pnpm test --coverage --ci
pnpm test:integration
pnpm test:e2e

# Coverage enforcement
pnpm test --coverage --coverageThreshold='{
  "lib/diff.ts": {"lines": 80, "branches": 80},
  "lib/history.ts": {"lines": 80, "branches": 80}, 
  "lib/tokens/*": {"lines": 80, "branches": 80}
}'
```

### Manual Testing Checklist

#### PR Acceptance Testing
```
[ ] App loads without console errors
[ ] Model dropdown populates (requires Ollama running)
[ ] Token counts update while typing
[ ] Refine button produces output
[ ] Manual edits tracked in history
[ ] Undo/redo buttons functional
[ ] Reinforce shows diff preview
[ ] Apply/discard patch works
[ ] Copy button works
[ ] Page reload preserves history
[ ] Responsive design functional
[ ] Keyboard shortcuts work
[ ] Tab navigation accessible
```

## Test Data & Fixtures

### Standard Test Inputs
```javascript
// Short prompt
"Summarize this article"

// Medium prompt  
"Create a comprehensive marketing strategy for a new SaaS product targeting small businesses in the healthcare sector. Include pricing, positioning, and go-to-market approach."

// Long prompt (edge case)
"[500+ word detailed scenario with multiple paragraphs, special characters, and complex requirements]"

// Edge cases
""  // empty
"🚀💡🎯"  // emoji only
"Line 1\r\nLine 2\nLine 3"  // mixed line endings
"a".repeat(10000)  // very long single line
```

### Patch Edge-Case Fixtures
- CRLF lines and mixed endings: `"Line 1\r\nLine 2\nLine 3"`
- Astral-plane Unicode: `"Prompt 🚀✨ with emoji and 𐐷 characters"`
- Empty/no-op patch: `[]` or `{ op: "replace", from: [5,5], to: "" }`
- Overlapping ranges (should be rejected):
  ```json
  [
    {"op":"replace","from":[10,20],"to":"A"},
    {"op":"delete","from":[15,25]}
  ]
  ```

### Mock API Responses
```javascript
// Successful generation
{
  "output": "Expanded prompt content here...",
  "usage": {"input_tokens": 15, "output_tokens": 150}
}

// Reinforcement with patch
{
  "output": "Improved prompt content...", 
  "usage": {"input_tokens": 50, "output_tokens": 55},
  "patch": [
    {"op": "replace", "from": [20, 30], "to": "better word"}
  ]
}

// Error response
{
  "error": "Model not available",
  "code": "MODEL_UNAVAILABLE"
}
```

## Coverage Enforcement

### Required Thresholds
- **lib/diff.ts**: 80% lines, 80% branches
- **lib/history.ts**: 80% lines, 80% branches  
- **lib/tokens/***: 80% lines, 75% branches
- **API routes**: 100% lines, 90% branches
- **Overall project**: 70% lines (excluding UI components)

### Coverage Exclusions
```javascript
// Exclude from coverage requirements
- UI component render methods
- Error boundary fallbacks
- Development-only code paths
- Third-party library wrappers
- Console logging statements
```

### Quality Gates
PR cannot merge unless:
1. All required coverage thresholds met
2. No failing tests in CI
3. Performance benchmarks pass
4. Integration tests pass with local Ollama
5. Manual acceptance checklist completed

## Test Environment Setup

### Local Development
```bash  
# Install dependencies
pnpm install

# Start Ollama (required for integration tests)
ollama serve &
ollama pull gpt-oss:20b

# Run test suite
pnpm test
```

### CI Environment  
```yaml
# GitHub Actions setup
- Install Node 20
- Install pnpm
- Cache dependencies
- Start Ollama service  
- Pull test model
- Run full test suite with coverage
- Upload coverage reports
```

### Mock Strategy
- **Unit tests**: Mock all external dependencies
- **Integration tests**: Real Ollama for API contract validation
- **Component tests**: Mock heavy dependencies, real UI interactions

### Mock Ollama (CI Toggle)
- Environment toggle: `USE_MOCK_OLLAMA=true` in CI to bypass local service
- Expected fixtures:
  - `models.json`: list with `gpt-oss:20b` as default
  - `refine.response.json`: `{ output, usage }` sample
  - `reinforce.response.json`: `{ output, usage, patch }` sample with minimal ops
- Behavior:
  - `/api/models` serves `models.json`
  - `/api/refine` returns fixture based on `mode`
  - Latency simulation: 100–300ms
  - Error simulation: toggleable via `MOCK_ERROR` env for negative tests

## Error Testing Strategy

### Network & Service Failures
- Ollama service unavailable
- Network timeouts during generation
- Rate limiting responses
- Invalid model responses
- Partial response data

### Data Integrity
- Corrupted localStorage
- Invalid patch format
- Malformed API responses  
- Unicode encoding issues
- Large data processing

### User Input Edge Cases
- Empty inputs
- Extremely long inputs
- Special characters
- Rapid successive operations
- Invalid clipboard operations

## Performance Testing

### Automated Benchmarks
```javascript
// Token counting performance
benchmark('tiktoken-10kb', () => {
  tokenizer.count(text10kb);
}); // Target: <100ms

// History operations
benchmark('history-1000-entries', () => {
  for(let i = 0; i < 1000; i++) {
    history.push(`change ${i}`);
  }
}); // Target: <1s total

// Diff generation  
benchmark('diff-large-text', () => {
  diff.create(text5kb, modifiedText5kb);
}); // Target: <200ms
```

### Load Testing (Optional)
- Stress test with 100KB prompts
- Rapid-fire API requests
- Memory usage over time
- localStorage size growth patterns

This comprehensive test strategy ensures MVP reliability while maintaining development velocity through focused coverage of critical components.
