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