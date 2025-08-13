import { parseTimeout, handleCliError, formatDuration } from '@/lib/cli/utils/helpers'

describe('CLI helpers extended', () => {
  const exit = process.exit as any
  let exitCode: number | undefined
  beforeEach(() => {
    exitCode = undefined
    // @ts-ignore
    process.exit = (code?: number) => { exitCode = code; throw new Error('exit') }
  })
  afterEach(() => { process.exit = exit })

  it('parseTimeout validates and warns for long values', () => {
    expect(parseTimeout('1500')).toBe(1500)
    expect(() => parseTimeout('abc')).toThrow(/Invalid timeout/)
    expect(() => parseTimeout('500')).toThrow(/at least 1000/)
  })

  it('handleCliError exits with code 1 and prints troubleshooting', () => {
    const err = new Error('Ollama service is not running. Please start Ollama and try again.')
    try { handleCliError('refine', err, false) } catch {}
    expect(exitCode).toBe(1)
  })

  it('formatDuration formats correctly', () => {
    expect(formatDuration(200)).toBe('200ms')
    expect(formatDuration(2200)).toMatch(/2.2s/)
    expect(formatDuration(62000)).toMatch(/1m/)    
  })
})
