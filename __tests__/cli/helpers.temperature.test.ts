import { parseTemperature } from '@/lib/cli/utils/helpers'

describe('CLI helpers: parseTemperature', () => {
  it('parses valid numbers', () => {
    expect(parseTemperature('0')).toBe(0)
    expect(parseTemperature('0.2')).toBeCloseTo(0.2)
  })

  it('clamps above 0.3', () => {
    expect(parseTemperature('0.9')).toBe(0.3)
    expect(parseTemperature('100')).toBe(0.3)
  })

  it('rejects negative values', () => {
    expect(() => parseTemperature('-0.1')).toThrow(/Must be ≥ 0/)
  })

  it('rejects non-numeric', () => {
    expect(() => parseTemperature('abc' as any)).toThrow(/Invalid temperature/)
  })
})

