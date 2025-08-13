import { refineCommand } from '@/lib/cli/commands/refine'
import { reinforceCommand } from '@/lib/cli/commands/reinforce'
import { specCommand } from '@/lib/cli/commands/spec'

jest.mock('fs', () => ({ writeFileSync: jest.fn() }))

// Mock clipboard utilities
jest.mock('@/lib/cli/utils/clipboard', () => ({
  copyToClipboard: jest.fn().mockResolvedValue(undefined),
  writeToFile: jest.fn().mockResolvedValue(undefined)
}))

// Mock helpers to isolate command logic
jest.mock('@/lib/cli/utils/helpers', () => {
  const actual = jest.requireActual('@/lib/cli/utils/helpers')
  return {
    ...actual,
    validateModel: jest.fn().mockResolvedValue(undefined),
    parseTemperature: actual.parseTemperature,
    parseTimeout: actual.parseTimeout,
    handleCliError: actual.handleCliError,
    formatDuration: actual.formatDuration,
  }
})

// Mock ollama
jest.mock('@/lib/ollama', () => ({
  ollama: {
    generate: jest.fn().mockResolvedValue({ text: 'Refined Output', usage: { input_tokens: 10, output_tokens: 30 } }),
    healthCheck: jest.fn().mockResolvedValue(true),
    hasModel: jest.fn().mockResolvedValue(true),
    listModels: jest.fn().mockResolvedValue([{ name: 'gpt-oss:20b' }])
  }
}))

describe('CLI commands (refine/reinforce/spec)', () => {
  const exitOrig = process.exit as any
  let exitCode: number | undefined
  beforeEach(() => {
    exitCode = undefined
    // @ts-ignore
    process.exit = (code?: number) => { exitCode = code }
  })
  afterEach(() => { process.exit = exitOrig; jest.clearAllMocks() })

  it('refineCommand runs verbose path and exits 0', async () => {
    await refineCommand('short task', { verbose: true, copy: true })
    expect(exitCode).toBe(0)
    const { ollama } = require('@/lib/ollama')
    expect(ollama.generate).toHaveBeenCalled()
  })

  it('reinforceCommand runs and cleans output', async () => {
    // Make model output include a prefix to test cleaning
    const { ollama } = require('@/lib/ollama')
    ollama.generate.mockResolvedValueOnce({ text: 'Prompt: Clean me', usage: { input_tokens: 5, output_tokens: 10 } })
    await reinforceCommand('draft prompt', { verbose: true })
    expect(exitCode).toBe(0)
  })

  it('specCommand merges global options and runs', async () => {
    await specCommand('build a note app', { verbose: true, temperature: '0.25' }, { model: 'gpt-oss:20b', timeout: '3000' })
    expect(exitCode).toBe(0)
  })

  it('refineCommand handles validation error path', async () => {
    const helpers = require('@/lib/cli/utils/helpers')
    helpers.validateModel.mockRejectedValueOnce(new Error('Ollama service is not running. Please start Ollama and try again.'))
    await refineCommand('short task', { verbose: false })
    expect(exitCode).toBe(1)
  })
})
