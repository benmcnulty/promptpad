# Reusable Prompt: Contract Guardrails

## Purpose
Prevent drift in API/patch schema by enforcing frozen contracts before any commits.

## Why This Template
API contract stability is critical for MVP success. Any breaking changes require ADR approval and careful coordination.

## System Intent
Freeze API endpoints and patch schema; require ADR for changes; maintain backward compatibility.

## Developer Prompt Template

```
Before committing {{changes}}, verify that these contracts remain unchanged:

FROZEN API ENDPOINTS:
- GET /api/models → [{name, family, parameters, default?}]
- POST /api/refine → {output: string, usage: {input_tokens, output_tokens}, patch?: PatchOp[]}

REQUEST SCHEMA (POST /api/refine):
{
  "mode": "refine" | "reinforce",
  "input"?: string,     // required for refine
  "draft"?: string,     // required for reinforce  
  "model": string,      // must default to "gpt-oss:20b"
  "temperature": number // must be ≤ 0.3
}

PATCH SCHEMA:
{
  "op": "replace" | "insert" | "delete",
  "from": [start, end], // for replace/delete
  "at": number,         // for insert
  "to": string          // replacement/insertion text
}

CONTRACT VALIDATION:
1. Verify endpoints return exact schema shapes
2. Confirm default model is "gpt-oss:20b"
3. Validate temperature maximum is 0.3
4. Test patch format compliance
5. Ensure backward compatibility

IF CHANGES REQUIRED:
STOP and open an ADR using docs/agents/prompts/risk-adr.md

VERIFICATION:
{{verification_commands}}
```

## Verification Commands
```bash
# API contract testing
curl -X GET http://localhost:3000/api/models
curl -X POST http://localhost:3000/api/refine \
  -H "Content-Type: application/json" \
  -d '{"mode":"refine","input":"test","model":"gpt-oss:20b","temperature":0.2}'

# Schema validation
ajv validate -s docs/agents/schemas/api-contract.schema.json -d response.json
ajv validate -s docs/agents/schemas/patch.schema.json -d patch.json

# Test suite
pnpm test api/
```

## Usage Examples

### Example 1: API Route Changes
```
{{changes}} = "modified POST /api/refine to add streaming support"
{{verification_commands}} = "
pnpm test app/api/refine/route.test.ts
curl -X POST localhost:3000/api/refine -d '{\"mode\":\"refine\",\"input\":\"test\",\"model\":\"gpt-oss:20b\",\"temperature\":0.2}'
ajv validate -s docs/agents/schemas/api-contract.schema.json -d response.json
"
```

### Example 2: Patch Format Updates
```
{{changes}} = "enhanced patch operations with metadata"
{{verification_commands}} = "
pnpm test lib/diff.test.ts
ajv validate -s docs/agents/schemas/patch.schema.json -d sample-patch.json
pnpm test -- --testNamePattern='patch application'
"
```

### Example 3: Model Integration Changes
```
{{changes}} = "added support for additional model families"
{{verification_commands}} = "
curl -X GET localhost:3000/api/models | jq '.[] | select(.default == true) | .name'
pnpm test lib/ollama.test.ts
pnpm test -- --testNamePattern='default model'
"
```

## Contract Violation Examples

**❌ BLOCKED - Requires ADR:**
- Adding new fields to API response
- Changing patch operation format
- Modifying default model or temperature limits
- Breaking backward compatibility

**✅ ALLOWED - No ADR needed:**
- Adding optional request fields with defaults
- Internal implementation improvements
- Performance optimizations
- Bug fixes that maintain contract

## Parameter Definitions
- `{{changes}}`: Specific modifications being made
- `{{verification_commands}}`: Commands to validate contract compliance