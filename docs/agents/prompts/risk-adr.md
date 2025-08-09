# Reusable Prompt: Risk & ADR Creation

## Purpose
Guide creation of Architecture Decision Records when invariants or significant technical decisions need documentation.

## Why This Template
Ensures consistent ADR format and prevents untracked architectural drift. Required for any changes to system invariants.

## System Intent
Document architectural decisions; track trade-offs; enable informed future changes; maintain system coherence.

## Developer Prompt Template

```
Create an ADR for {{decision_context}} in Promptpad.

DECISION TRIGGERS (when ADR required):
- API contract changes (endpoints, request/response format)
- Patch schema modifications
- Default model or temperature limit changes
- Architecture pattern changes
- Performance requirement modifications
- Security model updates
- Integration approach changes

ADR STRUCTURE:
# ADR {{number}}: {{title}}
Date: {{date}}
Status: {{status}} (Proposed | Accepted | Superseded by XXX)

## Context
{{problem_statement}}
{{current_constraints}}
{{decision_drivers}}

## Decision
{{chosen_solution}}
{{implementation_approach}}

## Consequences
### Positive
{{benefits}}

### Negative  
{{trade_offs}}
{{risks}}

### Mitigation
{{risk_mitigation_strategies}}

## References
{{related_prs}}
{{external_links}}
{{related_adrs}}

SAVE TO: docs/adr/{{padded_number}}-{{kebab-case-title}}.md
```

## Verification Commands
```bash
# Validate ADR format
markdownlint docs/adr/{{adr_file}}

# Check internal links
markdown-link-check docs/adr/{{adr_file}}

# Update ADR index if exists
echo "{{adr_entry}}" >> docs/adr/README.md
```

## Usage Examples

### Example 1: API Contract Change
```
{{decision_context}} = "adding streaming support to POST /api/refine"
{{number}} = "001"
{{title}} = "Add Streaming Support to Refine API"
{{date}} = "2024-08-09"
{{status}} = "Proposed"
{{problem_statement}} = "Large prompt generations can take >30s, causing UI freezing and poor UX"
{{current_constraints}} = "Frozen API contract requires backward compatibility"
{{decision_drivers}} = "User experience, performance, technical feasibility"
{{chosen_solution}} = "Add optional 'stream' parameter with SSE response format"
{{benefits}} = "Real-time feedback, better UX, cancellable requests"
{{trade_offs}} = "API complexity, client implementation burden"
{{risks}} = "Breaking changes if not handled carefully"
{{risk_mitigation_strategies}} = "Feature flag, backward compatibility, extensive testing"
```

### Example 2: Patch Format Evolution
```
{{decision_context}} = "enhancing patch format with metadata for better undo/redo"
{{number}} = "002"
{{title}} = "Enhance Patch Format with Metadata"
{{problem_statement}} = "Current patch format lacks context for complex undo operations"
{{chosen_solution}} = "Add optional metadata field to patch operations"
{{benefits}} = "Better undo descriptions, user context, debugging"
{{trade_offs}} = "Increased payload size, complexity"
{{risks}} = "Breaking existing diff/history functionality"
```

### Example 3: Performance Architecture
```
{{decision_context}} = "implementing Web Workers for token counting"
{{number}} = "003"
{{title}} = "Use Web Workers for Token Counting"
{{problem_statement}} = "Large text token counting blocks UI thread >100ms"
{{chosen_solution}} = "Implement pluggable Web Worker tokenizer backend"
{{benefits}} = "Non-blocking UI, better performance, scalability"
{{trade_offs}} = "Implementation complexity, browser compatibility"
{{risks}} = "Worker management overhead, debugging difficulty"
```

## ADR Categories & Numbering

**001-099**: API and Contract Decisions
**100-199**: Architecture and Performance  
**200-299**: Security and Compliance
**300-399**: Developer Experience and Tooling
**400-499**: UI/UX and Accessibility
**500-599**: Testing and Quality

## Status Lifecycle
- **Proposed**: Under review, not yet approved
- **Accepted**: Approved and implemented
- **Superseded by XXX**: Replaced by newer ADR
- **Deprecated**: No longer relevant

## Parameter Definitions
- `{{decision_context}}`: What architectural decision needs documentation
- `{{number}}`: Sequential ADR number (pad with zeros: 001, 002)
- `{{title}}`: Clear, specific decision title
- `{{date}}`: Date in YYYY-MM-DD format
- `{{status}}`: Current ADR status (Proposed/Accepted/Superseded/Deprecated)
- `{{problem_statement}}`: Why this decision is needed
- `{{current_constraints}}`: Limitations and requirements to consider
- `{{decision_drivers}}`: Factors influencing the decision
- `{{chosen_solution}}`: What approach was selected
- `{{benefits}}`: Positive outcomes expected
- `{{trade_offs}}`: Negative consequences or costs
- `{{risks}}`: Potential problems and failure modes
- `{{risk_mitigation_strategies}}`: How risks will be managed