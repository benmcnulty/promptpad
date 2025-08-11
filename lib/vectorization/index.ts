import type { LayoutMode, VectorEdge, VectorFrame, VectorPoint } from './types'

function tokenize(text: string): string[] {
  return text
    .replace(/[\r\n]+/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(Boolean)
}

// Simple deterministic 32-bit hash
function hash32(str: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Map token index + hash to a 3D point on a spiral with slight radial variance
function positionForToken(token: string, index: number, total: number, mode: LayoutMode): [number, number, number] {
  const seed = hash32(token + ':' + index)
  const rng = (seed % 10000) / 10000 // [0,1)

  if (mode === 'sequentialPath') {
    // Place along a gentle helix path
    const t = index / Math.max(1, total - 1)
    const angle = t * Math.PI * 6
    const radius = 1.0 + 0.5 * Math.sin(t * Math.PI * 2)
    const x = radius * Math.cos(angle)
    const y = radius * Math.sin(angle)
    const z = -1 + 2 * t
    return [x, y, z]
  }

  // radialSpiral (default)
  const a = 0.2 // spiral separation
  const b = 0.15 // radial growth
  const theta = index * a * 2
  const r = b * index + 0.1 * (rng - 0.5)
  const x = r * Math.cos(theta)
  const y = r * Math.sin(theta)
  const z = (rng - 0.5) * 2 // depth in [-1,1]
  return [x, y, z]
}

export function vectorizeText(
  output: string,
  mode: LayoutMode = 'radialSpiral'
): VectorFrame {
  const tokens = tokenize(output)
  const points: VectorPoint[] = tokens.map((token, i) => {
    const position = positionForToken(token, i, tokens.length, mode)
    return {
      id: `${i}`,
      token,
      position,
      magnitude: (hash32(token) % 1000) / 1000,
    }
  })

  // Connect sequential tokens with edges
  const edges: VectorEdge[] = []
  for (let i = 0; i < Math.max(0, points.length - 1); i++) {
    edges.push({ from: points[i].id, to: points[i + 1].id, weight: 1 })
  }

  return {
    points,
    edges,
    meta: { source: 'demo', createdAt: Date.now() },
  }
}

export type { VectorPoint, VectorEdge, VectorFrame, LayoutMode } from './types'

