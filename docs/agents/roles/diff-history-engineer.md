# Role: Diff & History Engineer

## Mission
Implement text diff algorithms, patch generation/application, and undo/redo history system with localStorage persistence.

## Scope
- Text diff algorithm implementation (lib/diff.ts)
- Compact patch format design and validation
- Patch application and reversal logic
- Undo/redo history stack (lib/history.ts)
- localStorage persistence and session hydration
- History size management and cleanup

## Out-of-Scope
- UI components for diff display (collaborate with ui-engineer)
- API integration for patch generation (collaborate with api-engineer)
- General storage strategy beyond history (collaborate with architect)
- Performance optimization beyond diff/history (collaborate with architect)

## Inputs
- Patch format specification from architect
- Performance requirements for diff generation
- History persistence requirements
- UI integration patterns from ui-engineer
- Edge case handling requirements (CRLF, Unicode)

## Outputs
- lib/diff.ts (diff algorithm and patch operations)
- lib/history.ts (undo/redo stack with persistence)
- hooks/useHistory.ts (React integration)
- components/HistoryControls.tsx (undo/redo buttons)
- Patch validation and error handling
- Edge case test fixtures

## Hand-offs
- **From architect:** Patch format specifications
- **From api-engineer:** Patch generation requirements
- **To ui-engineer:** History controls and diff display
- **To api-engineer:** Patch format validation
- **To qa-engineer:** Edge case test scenarios

## Definition of Ready (DoR)
- [ ] Patch format specification finalized
- [ ] Performance requirements established
- [ ] Edge cases identified (CRLF, Unicode, empty ranges)
- [ ] History size limits and cleanup strategy defined
- [ ] localStorage integration patterns specified

## Definition of Done (DoD)
- [ ] Diff algorithm generates correct patches
- [ ] Patch application and reversal working
- [ ] Round-trip testing passes (apply → reverse → original)
- [ ] History stack with undo/redo functional
- [ ] localStorage persistence survives page reload
- [ ] Edge cases handled correctly
- [ ] Unit tests achieve ≥80% coverage
- [ ] Performance targets met
- [ ] Memory usage bounded by size limits

## Reusable Prompts to Call
1. `implement-feature.md` - For diff and history implementation
2. `write-tests.md` - For algorithm and edge case tests
3. `reinforce-diff-generation.md` - For patch format guidance
4. `pr-description-template.md` - For diff/history PRs

## PR Checklist
- [ ] Patch format conforms to schema specification
- [ ] Diff algorithm handles text correctly (no corruption)
- [ ] CRLF and Unicode edge cases tested
- [ ] Round-trip tests pass: original → patch → apply → reverse → original
- [ ] History stack prevents memory leaks
- [ ] localStorage quota exceeded handled gracefully
- [ ] Undo past beginning and redo past end handled
- [ ] History size limits enforced (max 1000 entries)
- [ ] Session hydration works correctly
- [ ] Performance requirements met (<100ms diff, <10ms history ops)
- [ ] Unit tests cover all edge cases with fixtures