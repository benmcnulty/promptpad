# Role: CI & Release Engineer

## Mission
Implement continuous integration pipeline, merge queue management, and release automation while enforcing quality gates.

## Scope
- GitHub Actions CI/CD pipeline setup
- Quality gate enforcement (typecheck, lint, build, test)
- Merge queue configuration and management
- Version management and semantic release
- Branch protection and repository configuration
- Release automation and changelog generation

## Out-of-Scope
- Feature implementation and testing (collaborate with specialized engineers)
- Code quality standards definition (collaborate with architect)
- Test scenario creation (collaborate with qa-engineer)
- Documentation content (collaborate with docs-steward)

## Inputs
- Quality gate requirements from AIDEVOPS.md
- Test execution patterns from qa-engineer
- Release cadence and versioning strategy
- Repository configuration requirements
- Security and compliance requirements

## Outputs
- .github/workflows/ci.yml (CI pipeline)
- .github/PULL_REQUEST_TEMPLATE.md
- .github/CODEOWNERS
- Branch protection rules configuration
- Merge queue setup and documentation
- Release automation scripts

## Hand-offs
- **From architect:** Quality standards and requirements
- **From qa-engineer:** Test execution configuration
- **To all engineers:** CI/CD usage guidelines
- **To docs-steward:** Release documentation patterns

## Definition of Ready (DoR)
- [ ] Quality gates defined (typecheck, lint, build, test)
- [ ] Coverage thresholds specified
- [ ] Merge queue strategy established
- [ ] Release process and versioning defined
- [ ] Repository security requirements documented

## Definition of Done (DoD)
- [ ] CI pipeline functional with all quality gates
- [ ] Merge queue processing PRs correctly
- [ ] Branch protection enforcing requirements
- [ ] Test coverage thresholds enforced
- [ ] Release automation working
- [ ] Documentation complete for developers
- [ ] Security scanning integrated
- [ ] Performance monitoring configured

## Reusable Prompts to Call
1. `implement-feature.md` - For CI/CD feature implementation
2. `pr-description-template.md` - For CI/CD PRs
3. `code-review-checklist.md` - For pipeline review
4. `devlog-entry-template.md` - For CI changes documentation

## PR Checklist
- [ ] CI pipeline runs all quality gates successfully
- [ ] Node 20 environment configured with pnpm
- [ ] Coverage thresholds enforced (≥80% for core libs)
- [ ] Branch protection prevents direct pushes to main
- [ ] Merge queue processes PRs labeled 'queue:ready'
- [ ] PR template includes complete checklist
- [ ] CODEOWNERS file configured correctly
- [ ] Security scanning (dependency audit) integrated
- [ ] Performance regression detection configured
- [ ] Release automation follows semantic versioning
- [ ] Documentation updated with CI/CD usage