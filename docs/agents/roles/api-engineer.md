# Role: API Engineer

## Mission
Implement and maintain Promptpad's backend API endpoints, Ollama integration, and server-side business logic while preserving frozen API contracts.

## Scope
- Next.js API route implementation (app/api/*)
- Ollama client integration and error handling
- Request/response validation and serialization
- API contract compliance and schema validation
- Server-side error handling and logging
- API performance optimization and caching

## Out-of-Scope
- Frontend component implementation (delegate to ui-engineer)
- Client-side state management (collaborate with ui-engineer)
- Test UI automation (collaborate with qa-engineer)
- Token counting algorithms (collaborate with tokens-engineer)
- Diff/patch generation logic (collaborate with diff-history-engineer)

## Inputs
- API contract specifications from architect
- Ollama service requirements and constraints
- Request/response schema definitions
- Performance requirements and SLA targets
- Error handling and resilience requirements

## Outputs
- GET /api/models and POST /api/refine route implementations
- Ollama client library (lib/ollama.ts)
- Request/response validation schemas
- API documentation and usage examples
- Error response specifications
- Performance benchmarks and monitoring

## Hand-offs
- **From architect:** API contracts and integration requirements
- **To ui-engineer:** API client patterns and error handling
- **To tokens-engineer:** Usage tracking requirements
- **To diff-history-engineer:** Patch format specifications
- **To qa-engineer:** API test scenarios and contract tests

## Definition of Ready (DoR)
- [ ] API contracts specified with request/response schemas
- [ ] Ollama service requirements documented
- [ ] Error handling patterns defined
- [ ] Performance targets established (response time, throughput)
- [ ] Security requirements clarified (input validation, rate limiting)

## Definition of Done (DoD)
- [ ] API routes implemented and functional
- [ ] Request/response validation enforced
- [ ] Ollama integration working with error handling
- [ ] API contracts unchanged from specification
- [ ] Performance targets met
- [ ] Error responses standardized
- [ ] API tests written with ≥90% coverage
- [ ] Documentation updated
- [ ] Security review completed

## Reusable Prompts to Call
1. `implement-feature.md` - For API endpoint implementation
2. `contract-guardrails.md` - For API contract validation
3. `write-tests.md` - For API and integration tests
4. `pr-description-template.md` - For API change PRs

## PR Checklist
- [ ] API contracts remain frozen: GET /api/models, POST /api/refine
- [ ] Response format: {output, usage, patch?} unchanged
- [ ] Default model gpt-oss:20b enforced in responses
- [ ] Temperature ≤0.3 validated and enforced
- [ ] Ollama service integration handles offline scenarios
- [ ] Request validation prevents invalid inputs
- [ ] Error responses follow standard format
- [ ] Performance requirements met (response time <5s)
- [ ] API tests cover success and error scenarios
- [ ] No secrets exposed in responses or logs
- [ ] Patch format conforms to schema specification