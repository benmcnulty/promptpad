import { buildRefinePrompt, buildReinforcePrompt, buildSpecPrompt } from '@/lib/cli/utils/prompts'

describe('CLI prompt builders', () => {
  it('buildRefinePrompt includes INPUT marker', () => {
    const p = buildRefinePrompt('do stuff')
    expect(p).toContain('INPUT: do stuff')
  })
  it('buildReinforcePrompt includes DRAFT marker', () => {
    const p = buildReinforcePrompt('a draft')
    expect(p).toContain('DRAFT: a draft')
  })
  it('buildSpecPrompt includes specification sections', () => {
    const p = buildSpecPrompt('make a tool')
    expect(p).toContain('**Project Overview**')
  })
})
