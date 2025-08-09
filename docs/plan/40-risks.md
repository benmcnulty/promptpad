# Risk Assessment & Mitigations

## Risk Prioritization Matrix

**Impact Scale:** Low (1) → Medium (2) → High (3) → Critical (4)  
**Probability:** Unlikely (1) → Possible (2) → Likely (3) → Almost Certain (4)  
**Risk Score:** Impact × Probability

## Critical Risks (Score 9-16)

### R1: Ollama Service Unavailability
**Impact:** 4 (App non-functional)  **Probability:** 3 (Likely during dev/demo)  **Score:** 12

**Description:** Local Ollama service down, wrong version, or gpt-oss:20b model missing

**Mitigations:**
- Graceful degradation with clear error messages
- Fallback to model list showing "Ollama unavailable"  
- Offline mode documentation for users
- Health check endpoint: GET /api/health
- Retry logic with exponential backoff
- Development setup verification script

**Test Hooks:**
```bash
# Simulate Ollama offline
sudo systemctl stop ollama  # Linux
brew services stop ollama   # macOS
pnpm test:offline-mode
```

**Detection:** Monitor API error rates, implement heartbeat checks

### R2: API Contract Drift
**Impact:** 4 (Breaking changes)  **Probability:** 2 (Possible)  **Score:** 8

**Description:** Inadvertent changes to /api/models or /api/refine request/response format

**Mitigations:**
- API contract tests in CI (request/response schema validation)
- TypeScript interfaces enforced
- ADR requirement for any API changes
- Version headers in API responses  
- Contract-first development approach
- Schema validation with Zod

**Test Hooks:**
```javascript
// Contract validation tests
describe('API Contract', () => {
  test('/api/models returns expected schema', async () => {
    const response = await fetch('/api/models');
    expect(response).toMatchSchema(modelsSchema);
  });
});
```

**Prevention:** Automated API compatibility checks in CI

### R3: Diff Algorithm Correctness
**Impact:** 3 (Data corruption)  **Probability:** 3 (Likely)  **Score:** 9

**Description:** Patch application fails or corrupts text, especially with CRLF/Unicode edge cases

**Mitigations:**
- Comprehensive edge case test suite
- Round-trip testing (apply patch → reverse patch → original text)
- CRLF normalization before diff
- Unicode-safe string operations
- Patch validation before application
- Fallback to full text replacement if patch fails

**Test Hooks:**
```javascript  
// Edge case test fixtures
const testCases = [
  { name: 'CRLF mixed', original: 'line1\r\nline2\nline3' },
  { name: 'Unicode emoji', original: '🚀 rocket ship 💡' },
  { name: 'Empty ranges', patches: [{op: 'delete', from: [0, 0]}] },
  { name: 'Large text', original: 'a'.repeat(100000) }
];
```

**Monitoring:** Track patch application success rates, user reports of text corruption

## High Risks (Score 6-8)

### R4: localStorage Quota Exceeded  
**Impact:** 2 (Feature degraded)  **Probability:** 3 (Likely with heavy usage)  **Score:** 6

**Description:** Browser localStorage fills up, breaking history persistence

**Mitigations:**
- History size limits (max 1000 entries)
- Automatic cleanup of old entries
- Storage quota monitoring
- Graceful degradation to session-only history
- User notification when approaching limits
- Compression for stored history data

**Test Hooks:**
```javascript
// Simulate localStorage full
Object.defineProperty(Storage.prototype, 'setItem', {
  value: () => { throw new Error('QuotaExceededError'); }
});
```

### R5: Performance Degradation  
**Impact:** 2 (Poor UX)  **Probability:** 3 (Likely with large prompts)  **Score:** 6

**Description:** Token counting, diff generation, or API calls block UI

**Mitigations:**
- Async operations with debouncing
- Web Workers for heavy computation
- Request timeouts and cancellation  
- Progressive loading states
- Performance monitoring and alerting
- Benchmark tests in CI

**Test Hooks:**
```javascript
// Performance regression tests
test('token counting completes in <100ms', async () => {
  const start = Date.now();
  await tokenCounter.count(largeText);
  expect(Date.now() - start).toBeLessThan(100);
});
```

### R6: Model Response Quality
**Impact:** 3 (Poor user experience)  **Probability:** 2 (Possible)  **Score:** 6  

**Description:** gpt-oss:20b produces low-quality refinements or refuses prompts

**Mitigations:**
- Carefully crafted prompt templates with examples
- Temperature ≤ 0.3 for consistency
- Fallback prompts for edge cases
- User feedback mechanism
- A/B testing of prompt variations
- Model evaluation metrics

**Test Hooks:**
- Qualitative prompt testing with standard inputs
- Response quality scoring (length, coherence, helpfulness)
- User acceptance testing sessions

## Medium Risks (Score 4-5)

### R7: Browser Compatibility Issues
**Impact:** 2 (Reduced accessibility)  **Probability:** 2 (Possible)  **Score:** 4

**Description:** Features fail in Safari, Firefox, or older browsers

**Mitigations:**
- Progressive enhancement approach
- Polyfills for missing APIs (Clipboard, etc.)
- Cross-browser testing checklist  
- Graceful fallbacks for unsupported features
- Clear browser requirements documentation

**Test Matrix:**
- Chrome 90+ (primary)
- Firefox 88+ (secondary)  
- Safari 14+ (secondary)
- Edge 90+ (secondary)

### R8: Security Vulnerabilities
**Impact:** 3 (Data exposure)  **Probability:** 1 (Unlikely)  **Score:** 3

**Description:** XSS, injection attacks, or secrets exposure

**Mitigations:**
- Input sanitization and validation
- Content Security Policy headers
- No eval() or innerHTML usage
- Environment variable validation
- Dependency security audits
- Secret scanning in CI

**Test Hooks:**
```bash
# Security audit commands
pnpm audit
pnpm dlx @lavamoat/allow-scripts
git secrets --scan
```

### R9: Integration Race Conditions
**Impact:** 2 (Intermittent failures)  **Probability:** 2 (Possible)  **Score:** 4

**Description:** Parallel PR development causes merge conflicts or integration issues

**Mitigations:**  
- Clear interface contracts between PRs
- Early integration testing
- Frequent rebasing on main
- Atomic API changes
- Feature flags for incomplete features
- Integration branch strategy if needed

**Process:**
- Daily integration checks
- Merge queue processing order
- Rollback procedures for failed merges

## Low Risks (Score 1-3)

### R10: Third-Party Dependency Updates
**Impact:** 1 (Minor disruption)  **Probability:** 3 (Likely)  **Score:** 3

**Description:** Breaking changes in Next.js, React, or other dependencies

**Mitigations:**
- Pinned dependency versions
- Automated dependency updates with testing
- Changelog monitoring
- Conservative update strategy
- Rollback plan for problematic updates

### R11: Development Environment Drift  
**Impact:** 1 (Dev friction)  **Probability:** 2 (Possible)  **Score:** 2

**Description:** Inconsistent Node/pnpm versions across developers

**Mitigations:**
- .nvmrc for Node version
- package.json engines specification  
- Setup scripts and documentation
- Docker development option
- CI/CD environment matching

## Risk Monitoring & Alerting

### Key Metrics to Track
```javascript
// Application health
- API error rates by endpoint
- Average response times
- Ollama connectivity uptime
- localStorage usage per user
- Performance regression trends

// User experience  
- Feature adoption rates
- Error report frequency
- User session lengths
- Conversion rates (input → refine → copy)
```

### Alerting Thresholds
- API error rate >5% (immediate)
- Response time >5s (warning)  
- Ollama downtime >1min (immediate)
- Performance regression >20% (warning)

### Incident Response Plan
1. **Detection:** Automated monitoring or user reports
2. **Assessment:** Impact and urgency scoring
3. **Mitigation:** Rollback, hotfix, or workaround
4. **Communication:** Update status page, notify users
5. **Resolution:** Root cause analysis and prevention
6. **Learning:** Post-mortem and process improvements

## Risk Acceptance Criteria

### Acceptable Risks (No mitigation planned)
- **Extremely rare browser crashes:** Impact high but probability negligible
- **Ollama version incompatibilities:** Users responsible for setup
- **Network latency variations:** Beyond application control
- **User hardware limitations:** Document minimum requirements

### Risk Appetite Statement
- **Zero tolerance:** Data corruption, security vulnerabilities
- **Low tolerance:** Service unavailability >5min, performance regression >50%  
- **Medium tolerance:** Feature degradation, cosmetic issues
- **High tolerance:** Edge case failures, advanced browser feature gaps

## Contingency Plans

### Critical Path Failures
If core functionality blocked:
1. **Ollama integration fails:** Mock mode for development/demo
2. **Diff algorithm unusable:** Fallback to simple text replacement
3. **History persistence broken:** Session-only mode
4. **Token counting fails:** Static estimates or disable feature

### Delivery Risk Mitigation  
- **PR sequence disruption:** Parallel development tracks
- **Performance issues:** Progressive enhancement approach
- **Integration failures:** Feature flags and rollback capability
- **Quality gate failures:** Manual override process with approval

### Business Continuity
- **Key developer unavailable:** Documentation and handoff protocols
- **Tool/service outage:** Alternative solutions and workarounds
- **Scope creep pressure:** Invariant protection and ADR process
- **Timeline pressure:** MVP scope reduction guidelines

This risk assessment provides a foundation for proactive issue prevention and rapid incident response throughout the Promptpad development lifecycle.