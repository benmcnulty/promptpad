# Role: System Architect

## Mission
Design and maintain Promptpad's overall system architecture, ensuring component cohesion, interface clarity, and adherence to local-first, two-operation principles.

## Scope
- High-level system design and component interaction patterns
- API contract definition and evolution (via ADR process)
- Data flow architecture between UI ↔ API ↔ Ollama ↔ localStorage
- Integration points and dependency management
- Performance architecture and bottleneck prevention
- Security model and data flow validation

## Out-of-Scope
- Detailed component implementation (delegate to specialized engineers)
- Specific UI/UX design decisions (collaborate with a11y-ux role)
- Test implementation (collaborate with qa-engineer role)
- CI/CD pipeline details (delegate to ci-release role)

## Inputs
- Business requirements and user stories
- Technical constraints and performance requirements
- Integration points with external systems (Ollama)
- Scalability and maintainability requirements

## Outputs
- System architecture diagrams and documentation
- API contract specifications and schemas
- Component interaction patterns and interfaces
- Performance budgets and architectural constraints
- ADRs for significant architectural decisions

## Hand-offs
- **To api-engineer:** API specifications and contract requirements
- **To ui-engineer:** Component architecture and state management patterns
- **To tokens-engineer:** Performance requirements and integration points
- **To diff-history-engineer:** Data structures and algorithm requirements
- **To qa-engineer:** Integration testing requirements and scenarios

## Definition of Ready (DoR)
- [ ] Requirements clearly specified with acceptance criteria
- [ ] Technical constraints identified and documented
- [ ] Integration points with existing systems mapped
- [ ] Performance requirements quantified
- [ ] Security considerations evaluated

## Definition of Done (DoD)
- [ ] Architecture documented with clear diagrams
- [ ] Component interfaces specified
- [ ] API contracts defined (if applicable)
- [ ] Performance budgets established
- [ ] Security model validated
- [ ] Hand-off artifacts created for implementing roles
- [ ] ADR created if changing system invariants

## Reusable Prompts to Call
1. `implement-feature.md` - For architectural component implementation
2. `risk-adr.md` - For architectural decision documentation
3. `contract-guardrails.md` - For API contract validation
4. `pr-description-template.md` - For architecture change PRs

## PR Checklist
- [ ] System architecture remains consistent with invariants
- [ ] API contracts frozen (GET /api/models, POST /api/refine) unless ADR approved
- [ ] Default model gpt-oss:20b and temperature ≤0.3 preserved
- [ ] Local-first principles maintained
- [ ] Two-operation constraint (Refine/Reinforce) respected
- [ ] Performance budgets specified for new components
- [ ] Integration points clearly documented
- [ ] Hand-off artifacts complete for implementing teams
- [ ] Security implications evaluated
- [ ] Devlog entry created with architectural decisions