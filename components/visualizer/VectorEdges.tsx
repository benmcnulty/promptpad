// @ts-nocheck
"use client"

import { Line } from '@react-three/drei'
import type { VectorFrame } from '@/lib/vectorization'

export default function VectorEdges({ frame, opacity = 0.35 }: { frame: VectorFrame; opacity?: number }) {
  const pointMap = new Map(frame.points.map(p => [p.id, p]))
  return (
    <group>
      {frame.edges.map((e, i) => {
        const a = pointMap.get(e.from)
        const b = pointMap.get(e.to)
        if (!a || !b) return null
        const points = [
          [a.position[0], a.position[1], a.position[2]] as [number, number, number],
          [b.position[0], b.position[1], b.position[2]] as [number, number, number],
        ]
        return (
          <Line
            key={i}
            points={points}
            color="#22d3ee" // cyan-400
            opacity={opacity}
            transparent
            lineWidth={1}
          />
        )
      })}
    </group>
  )
}
