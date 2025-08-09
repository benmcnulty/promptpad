# Reusable Prompt: Reinforce with Patch Generation

## Purpose
Guide implementation of Reinforce operation that generates improved drafts with compact patch format.

## Why This Template
Ensures consistent patch generation for diff/undo/redo functionality while maintaining prompt quality improvements.

## System Intent
Generate tightened drafts with minimal patches; preserve original intent; enable undo/redo; respect token budgets.

## Developer Prompt Template

```
Implement Reinforce operation for Promptpad that takes {{current_draft}} and generates improvement with patch.

REINFORCE OBJECTIVES:
- Tighten coordination among goals, constraints, style, and variables
- Improve clarity without changing original intent
- Enhance actionability and specificity
- Remove redundancy and conflicts
- Maintain or reduce overall length

PATCH GENERATION:
- Generate compact text-range operations
- Minimize number of patch operations
- Use precise character positions
- Support operations: replace, insert, delete
- Validate patch can be applied and reversed

IMPLEMENTATION REQUIREMENTS:
- Input: {mode: "reinforce", draft: string, model: string, temperature: number}
- Output: {output: string, usage: {input_tokens, output_tokens}, patch: PatchOp[]}
- Patch format: [{op: "replace"|"insert"|"delete", from?: [start, end], at?: number, to?: string}]
- Performance: <5s response time
- Token budget: draft + template + output < 4000 tokens

EXAMPLE WORKFLOW:
1. Analyze draft for coordination issues
2. Generate improved version
3. Calculate minimal diff between original and improved
4. Return both full output and patch operations
5. Validate patch application produces same result

VERIFICATION:
{{patch_validation_tests}}
```

## Verification Commands
```bash
# Test patch generation
pnpm test lib/diff.test.ts --testNamePattern="patch generation"

# Test API integration
curl -X POST localhost:3000/api/refine \
  -H "Content-Type: application/json" \
  -d '{"mode":"reinforce","draft":"sample draft text","model":"gpt-oss:20b","temperature":0.25}'

# Validate patch format
ajv validate -s docs/agents/schemas/patch.schema.json -d patch-response.json

# Test round-trip application
pnpm test -- --testNamePattern="patch application round-trip"
```

## Usage Examples

### Example 1: Basic Reinforce Implementation
```
{{current_draft}} = "Write a summary of the data. Make it good and professional. Include important stuff."
{{patch_validation_tests}} = "
- Apply patch to original draft produces exact output
- Reverse patch application returns to original
- Patch operations use correct character positions
- Performance <200ms for patch generation
- Memory usage reasonable for large drafts
"
```

### Example 2: Complex Coordination Improvements  
```
{{current_draft}} = "Create a marketing strategy. Target small businesses. Use social media and email. Make it cost-effective but also high-quality. Include metrics but keep it simple."
{{patch_validation_tests}} = "
- Coordination conflicts resolved (cost-effective vs high-quality)
- Vague terms replaced with specific language
- Contradictions eliminated
- Structure improved for clarity
- Patch operations minimal but effective
"
```

### Example 3: Long Draft Optimization
```
{{current_draft}} = "[500+ word draft with redundancy, unclear goals, mixed constraints]"
{{patch_validation_tests}} = "
- Length reduced through redundancy elimination
- Goals clarified and prioritized
- Constraints made consistent
- Patch operations handle large text efficiently
- Token budget respected (<4000 total)
"
```

## Patch Operation Examples

### Replace Operation
```json
{
  "op": "replace",
  "from": [45, 67],
  "to": "specific and measurable"
}
```

### Insert Operation  
```json
{
  "op": "insert", 
  "at": 120,
  "to": "\n\nSUCCESS CRITERIA:\n"
}
```

### Delete Operation
```json
{
  "op": "delete",
  "from": [200, 235]
}
```

## Quality Criteria

**Patch Quality:**
- Minimal operations (prefer replace over delete+insert)
- Precise character positions
- No overlapping ranges
- Reversible operations

**Content Quality:**
- Original intent preserved
- Clarity improved
- Coordination enhanced
- Actionability increased
- Redundancy removed

## Parameter Definitions
- `{{current_draft}}`: The edited text from the output pane
- `{{patch_validation_tests}}`: Specific tests to verify patch correctness