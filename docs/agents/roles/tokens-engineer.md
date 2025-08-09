# Role: Tokens Engineer

## Mission
Implement token counting abstraction, performance optimization, and pluggable tokenizer architecture for real-time UI feedback.

## Scope
- Token counting interface design and implementation (lib/tokens/*)
- tiktoken integration as default counter
- Performance optimization for real-time counting
- Pluggable tokenizer architecture for future extensibility
- Token count display components and hooks
- Performance monitoring and benchmarking

## Out-of-Scope
- UI component styling (collaborate with ui-engineer)
- API endpoint usage tracking (collaborate with api-engineer)
- General performance optimization beyond tokens (collaborate with architect)
- Test infrastructure setup (collaborate with qa-engineer)

## Inputs
- Performance requirements (<100ms for 10KB text)
- Token counting accuracy specifications
- UI integration requirements from ui-engineer
- Pluggable architecture requirements from architect
- Model-specific tokenizer requirements

## Outputs
- lib/tokens/index.ts (abstract interface)
- lib/tokens/tiktoken.ts (default implementation)
- hooks/useTokenCount.ts (React integration)
- components/TokenCounter.tsx (display component)
- Performance benchmarks and monitoring
- Documentation for tokenizer plugins

## Hand-offs
- **From architect:** Performance requirements and architecture
- **From ui-engineer:** Display component integration needs
- **To ui-engineer:** Token count hooks and components
- **To api-engineer:** Usage tracking patterns
- **To qa-engineer:** Performance test scenarios

## Definition of Ready (DoR)
- [ ] Performance targets specified (<100ms for 10KB text)
- [ ] Token counting accuracy requirements defined
- [ ] UI integration patterns established
- [ ] Pluggable architecture requirements documented
- [ ] Supported tokenizer types identified

## Definition of Done (DoD)
- [ ] Abstract token counting interface implemented
- [ ] tiktoken default implementation functional
- [ ] Performance targets met consistently
- [ ] Real-time UI integration working
- [ ] Pluggable architecture allows tokenizer switching
- [ ] Unit tests achieve ≥80% coverage
- [ ] Performance benchmarks documented
- [ ] Memory usage remains bounded
- [ ] Non-blocking UI behavior verified

## Reusable Prompts to Call
1. `implement-feature.md` - For tokenizer implementation
2. `write-tests.md` - For performance and accuracy tests
3. `pr-description-template.md` - For tokenization feature PRs

## PR Checklist
- [ ] Token counting interface is pluggable and extensible
- [ ] Default tiktoken implementation handles edge cases
- [ ] Performance requirement met: <100ms for 10KB text
- [ ] Memory usage stays reasonable (<50MB temporary allocation)
- [ ] UI remains responsive during counting operations
- [ ] Debounced updates prevent excessive computation
- [ ] Error handling for invalid or extremely large inputs
- [ ] Unit tests cover accuracy and performance scenarios
- [ ] Integration tests verify UI behavior
- [ ] Documentation includes usage examples
- [ ] No blocking operations on main thread