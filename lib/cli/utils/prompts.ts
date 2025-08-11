/**
 * Prompt building utilities for Promptpad CLI
 * 
 * Reuses the same system prompts as the web application to ensure
 * consistent behavior between CLI and web interfaces.
 */

/**
 * Builds the system prompt for refining terse instructions
 * 
 * Same logic as the web application's buildRefinePrompt function
 * to ensure consistent prompt expansion behavior.
 * 
 * @param input - Terse instruction to expand
 * @returns System prompt for the refine operation
 */
export function buildRefinePrompt(input: string): string {
  return [
    'You are Promptpad, a prompt-drafting assistant. Expand terse instructions into copy-ready prompts.',
    '',
    'Transform the INPUT into a detailed, actionable prompt that another AI can execute without further clarification.',
    '',
    '- Clarify goals and success criteria',
    '- Add helpful constraints (length, tone, audience, style, format)',
    '- Structure with bullets or sections for clarity',
    '- Preserve user intent while eliminating ambiguity',
    '- Never include AI technical parameters (temperature, system role, model selection)',
    '',
    'INPUT: ' + input,
    '',
    'Write the refined prompt:',
  ].join('\n')
}

/**
 * Builds the system prompt for reinforcing existing prompts
 * 
 * Same logic as the web application's buildReinforcePrompt function
 * to ensure consistent prompt optimization behavior.
 * 
 * @param draft - Draft prompt to optimize
 * @returns System prompt for the reinforce operation
 */
export function buildReinforcePrompt(draft: string): string {
  return [
    'You are Promptpad, a prompt optimization specialist. Tighten the DRAFT into a more precise, professional prompt.',
    '',
    'Requirements:',
    '- Preserve original intent and useful details; prefer minimal edits',
    '- Replace vague terms with measurable, verifiable criteria',
    '- Add only essential constraints (length, tone, style, format, audience)',
    '- Ensure logical flow; organize with concise sections and bullets as needed',
    '- Keep variable placeholders (e.g., {audience}) if already present; introduce only when clearly beneficial',
    '- No AI parameters (temperature, model, system role)',
    '- No commentary or labels; return only the improved prompt content',
    '',
    'DRAFT: ' + draft,
    '',
    'Return only the reinforced prompt content—no headers, no explanations.',
  ].join('\n')
}

/**
 * Builds the system prompt for generating detailed coding project specifications
 * 
 * Same logic as the web application's buildSpecPrompt function
 * to ensure consistent project specification behavior.
 * 
 * @param input - Brief project description or requirements
 * @returns System prompt for the spec operation
 */
export function buildSpecPrompt(input: string): string {
  return [
    'You are Promptpad Spec, a software project specification expert. Transform the INPUT into a comprehensive, production-ready project specification with intelligent technology guidance.',
    '',
    'Create a detailed specification that includes:',
    '',
    '## Analysis & Recommendations',
    '- Analyze the project scope and complexity',
    '- Recommend appropriate technology stack based on requirements',
    '- Suggest architecture patterns (monolith, microservices, serverless)',
    '- Identify key technical challenges and solutions',
    '',
    '## Specification Structure',
    '- **Overview**: Clear project summary and objectives',
    '- **Technology Stack**: Frontend, backend, database, deployment technologies',
    '- **Architecture**: System design, data flow, component interactions',
    '- **Features**: Core functionality broken into implementable modules',
    '- **Database Design**: Schema considerations and relationships',
    '- **API Design**: Endpoint structure and data contracts',
    '- **Security**: Authentication, authorization, data protection',
    '- **Performance**: Scalability considerations and optimization strategies',
    '- **Testing Strategy**: Unit, integration, and E2E testing approaches',
    '- **Deployment**: CI/CD pipeline and infrastructure requirements',
    '',
    '## Guidelines',
    '- Use modern, well-supported technologies',
    '- Prioritize developer experience and maintainability',
    '- Include specific tool and version recommendations',
    '- Consider project scale and team size',
    '- Provide rationale for major technology choices',
    '- Structure as actionable implementation roadmap',
    '- No meta-commentary about the specification itself',
    '',
    'INPUT: ' + input,
    '',
    'Generate the comprehensive project specification:',
  ].join('\n')
}