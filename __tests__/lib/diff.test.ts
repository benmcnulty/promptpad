import { applyPatch, computePatch, invertPatch, safeApply } from '@/lib/diff'

describe('diff utilities', () => {
  it('produces empty patch for identical strings', () => {
    expect(computePatch('abc', 'abc')).toEqual([])
  })

  it('computes single replace patch for change', () => {
    const patch = computePatch('hello world', 'hello brave world')
    expect(patch[0]).toEqual({ op: 'replace', from: [6, 6], to: 'brave ' })
    const applied = applyPatch('hello world', patch)
    expect(applied).toBe('hello brave world')
  })

  it('handles complete replacement', () => {
    const patch = computePatch('old', 'new value')
    expect(patch[0].from).toEqual([0, 3])
    const applied = applyPatch('old', patch)
    expect(applied).toBe('new value')
  })

  it('handles empty -> text', () => {
    const patch = computePatch('', 'abc')
    expect(patch[0]).toEqual({ op: 'replace', from: [0, 0], to: 'abc' })
    expect(applyPatch('', patch)).toBe('abc')
  })

  it('inverts a patch', () => {
    const before = 'abc123xyz'
    const after = 'abcXYZxyz'
    const p = computePatch(before, after)
    const inv = invertPatch(before, p)
    const forward = applyPatch(before, p)
    const back = applyPatch(forward, inv)
    expect(forward).toBe(after)
    expect(back).toBe(before)
  })

  it('works with unicode + CRLF', () => {
    const a = 'Hello\r\n🌍 world'
    const b = 'Hello\r\n🌍 brave world'
    const p = computePatch(a, b)
    expect(applyPatch(a, p)).toBe(b)
  })

  it('throws on overlapping patch ops', () => {
    expect(() => applyPatch('abcdef', [
      { op: 'replace', from: [1, 3], to: 'X' },
      { op: 'replace', from: [2, 4], to: 'Y' },
    ])).toThrow('Overlapping')
  })

  it('safeApply falls back on overlapping ops without throwing', () => {
    const result = safeApply('abcdef', [
      { op: 'replace', from: [1, 3], to: 'X' },
      { op: 'replace', from: [2, 4], to: 'Y' },
    ])
    expect(typeof result).toBe('string')
  })
})
