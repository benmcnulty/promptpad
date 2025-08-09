# Reusable Prompt: Code Review Checklist

## Purpose
Provide comprehensive review verification points for maintaining code quality and system invariants.

## Why This Template
Ensures consistent review standards across all PRs while catching potential invariant violations before merge.

## System Intent
Maintain code quality; verify invariant compliance; ensure test coverage; validate performance; check security.

## Developer Prompt Template

```
Conduct comprehensive code review for {{pr_title}} ({{files_changed}}).

## INVARIANT COMPLIANCE
- [ ] API contracts unchanged: GET /api/models, POST /api/refine
- [ ] Response format preserved: {output, usage, patch?}
- [ ] Default model remains gpt-oss:20b
- [ ] Temperature validation ≤ 0.3 enforced
- [ ] Local-first architecture maintained (no cloud dependencies)
- [ ] Two-operation constraint respected (Refine/Reinforce only)
- [ ] Single-screen UI layout preserved
- [ ] Patch format conforms to schema

## CODE QUALITY
- [ ] TypeScript strict mode compliance
- [ ] No `any` types without justification
- [ ] Proper error handling and user feedback
- [ ] Input validation and sanitization
- [ ] No console.log statements in production code
- [ ] Consistent naming conventions
- [ ] Appropriate abstractions and separation of concerns
- [ ] No duplicate code without refactoring

## TESTING & COVERAGE
- [ ] Unit tests added/updated for changed functionality
- [ ] Core libraries achieve ≥80% coverage (lib/diff.ts, lib/history.ts, lib/tokens/*)
- [ ] Edge cases covered (CRLF, Unicode, empty inputs, large data)
- [ ] Integration tests verify end-to-end functionality
- [ ] Performance tests validate requirements
- [ ] Error scenarios tested
- [ ] Mock strategies appropriate

## PERFORMANCE
- [ ] Token counting <100ms for 10KB text
- [ ] History operations <10ms each
- [ ] API responses <5s for normal prompts
- [ ] UI interactions maintain 60fps
- [ ] Memory usage reasonable and bounded
- [ ] No blocking operations on main thread
- [ ] Efficient algorithms for data processing

## SECURITY
- [ ] Input validation prevents injection
- [ ] No secrets exposed in code or logs
- [ ] Proper error handling (no stack traces to users)
- [ ] XSS prevention in UI components
- [ ] CORS configuration appropriate
- [ ] Dependencies scanned for vulnerabilities

## UI/UX (if applicable)
- [ ] Responsive design (375px to 1920px)
- [ ] Keyboard navigation functional
- [ ] Accessibility standards met (ARIA, semantic HTML)
- [ ] Focus management working correctly
- [ ] Loading states and error boundaries present
- [ ] Cross-browser compatibility verified

## DOCUMENTATION
- [ ] Code comments for complex logic
- [ ] API documentation updated
- [ ] README updated if user-facing changes
- [ ] Devlog entry complete and accurate
- [ ] ADR created if architectural changes

## INTEGRATION
- [ ] No breaking changes to existing functionality
- [ ] Dependencies properly managed
- [ ] Environment variables documented
- [ ] Database migrations (if any) reviewed
- [ ] Feature flags properly configured

## SPECIFIC CHECKS BY AREA
{{area_specific_checks}}

OVERALL ASSESSMENT:
- Code quality: {{quality_score}}/10
- Test coverage: {{coverage_assessment}}
- Performance: {{performance_assessment}}
- Security: {{security_assessment}}
- Documentation: {{documentation_assessment}}

RECOMMENDATION: {{approve_request_changes_comment}}
```

## Area-Specific Checks

### API Implementation
```
- [ ] Request/response validation comprehensive
- [ ] Error responses follow standard format
- [ ] Rate limiting considered
- [ ] Idempotency where appropriate
- [ ] Proper HTTP status codes
- [ ] OpenAPI documentation updated
```

### UI Components
```
- [ ] Props properly typed with TypeScript
- [ ] Component is testable and tested
- [ ] Styling follows design system
- [ ] Performance optimized (memoization, virtualization)
- [ ] Error boundaries handle failures
- [ ] Accessibility attributes present
```

### Core Libraries
```
- [ ] Algorithm correctness verified
- [ ] Edge cases thoroughly tested
- [ ] Performance benchmarked
- [ ] Memory leaks prevented
- [ ] Thread safety considered
- [ ] Error propagation appropriate
```

## Usage Examples

### Example 1: Token Counting Feature Review
```
{{pr_title}} = "feat(tokens): live token counting with tiktoken"
{{files_changed}} = "lib/tokens/*, components/TokenCounter.tsx, hooks/useTokenCount.ts"
{{area_specific_checks}} = "
TOKEN COUNTING SPECIFIC:
- [ ] Pluggable architecture allows future tokenizers
- [ ] Performance meets <100ms requirement for 10KB text
- [ ] Debouncing prevents excessive computation
- [ ] Error handling for invalid inputs
- [ ] Memory usage bounded and reasonable
- [ ] Integration with UI components seamless
"
{{quality_score}} = "8"
{{coverage_assessment}} = "85% achieved, exceeds 80% requirement"
{{performance_assessment}} = "Meets all targets, well-optimized"
{{security_assessment}} = "No concerns, proper input validation"
{{documentation_assessment}} = "Good, includes usage examples"
{{approve_request_changes_comment}} = "APPROVE - Well-implemented feature with comprehensive testing"
```

### Example 2: API Endpoint Review
```
{{pr_title}} = "feat(api): POST /api/refine with Ollama integration"
{{files_changed}} = "app/api/refine/route.ts, lib/ollama.ts, lib/prompts.ts"
{{area_specific_checks}} = "
API SPECIFIC:
- [ ] Contract compliance verified (frozen schema)
- [ ] Error responses standardized
- [ ] Ollama integration handles offline scenarios
- [ ] Request validation comprehensive
- [ ] Performance acceptable (<5s response time)
- [ ] Security review completed
"
{{approve_request_changes_comment}} = "REQUEST CHANGES - Need better error handling for Ollama failures"
```

### Example 3: Bug Fix Review  
```
{{pr_title}} = "fix(diff): correct patch ranges for CRLF line endings"
{{files_changed}} = "lib/diff.ts, __tests__/lib/diff.test.ts"
{{area_specific_checks}} = "
DIFF ALGORITHM SPECIFIC:
- [ ] Round-trip testing passes (apply → reverse → original)
- [ ] CRLF edge cases comprehensively tested
- [ ] Performance impact minimal
- [ ] No regression in existing functionality
- [ ] Error messages helpful for debugging
"
{{approve_request_changes_comment}} = "APPROVE - Solid fix with excellent test coverage"
```

## Review Severity Levels

**APPROVE**: 
- All invariants maintained
- Code quality high
- Tests comprehensive
- No security concerns
- Documentation complete

**APPROVE with COMMENTS**:
- Minor suggestions for improvement
- Non-blocking issues
- Future enhancement opportunities

**REQUEST CHANGES**:
- Invariant violations
- Code quality issues
- Insufficient testing
- Security concerns
- Missing documentation

**BLOCK**:
- API contract violations
- Critical security issues  
- Major architectural problems
- Insufficient test coverage for core libs

## Parameter Definitions
- `{{pr_title}}`: PR title for context
- `{{files_changed}}`: List of modified files
- `{{area_specific_checks}}`: Additional checks based on PR type
- `{{quality_score}}`: Subjective code quality rating 1-10
- `{{coverage_assessment}}`: Test coverage evaluation
- `{{performance_assessment}}`: Performance requirements compliance
- `{{security_assessment}}`: Security review findings
- `{{documentation_assessment}}`: Documentation completeness
- `{{approve_request_changes_comment}}`: Final recommendation with reasoning