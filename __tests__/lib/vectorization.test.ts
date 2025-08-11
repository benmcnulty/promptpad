import { vectorizeText } from '@/lib/vectorization'

describe('vectorizeText', () => {
  const sample = 'Alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau.'

  it('produces deterministic points for same input', () => {
    const a = vectorizeText(sample, 'radialSpiral')
    const b = vectorizeText(sample, 'radialSpiral')
    expect(a.points.length).toBe(b.points.length)
    for (let i = 0; i < a.points.length; i++) {
      expect(a.points[i].id).toBe(b.points[i].id)
      expect(a.points[i].token).toBe(b.points[i].token)
      expect(a.points[i].position).toEqual(b.points[i].position)
    }
  })

  it('bounds positions roughly within expected ranges', () => {
    const frame = vectorizeText(sample, 'sequentialPath')
    for (const p of frame.points) {
      const [x, y, z] = p.position
      expect(Number.isFinite(x)).toBe(true)
      expect(Number.isFinite(y)).toBe(true)
      expect(Number.isFinite(z)).toBe(true)
      // loose bounds for helix path
      expect(Math.abs(x)).toBeLessThan(3)
      expect(Math.abs(y)).toBeLessThan(3)
      expect(z).toBeGreaterThanOrEqual(-1)
      expect(z).toBeLessThanOrEqual(1)
    }
    // edges connect sequentially
    expect(frame.edges.length).toBe(frame.points.length - 1)
  })
})

