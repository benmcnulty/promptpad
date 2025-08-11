// @ts-nocheck
"use client"

import { useMemo, useRef } from 'react'
import { InstancedMesh, Object3D, Color } from 'three'
import type { VectorFrame } from '@/lib/vectorization'

export default function VectorPoints({ frame, size = 0.03 }: { frame: VectorFrame; size?: number }) {
  const ref = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])

  const colors = useMemo(() => {
    // map magnitude to color on a cyan-indigo ramp
    return frame.points.map((p) => {
      const t = p.magnitude ?? 0.5
      const c = new Color().setHSL(0.58 - t * 0.15, 0.8, 0.55) // ~indigo→cyan
      return c
    })
  }, [frame])

  // Position instances
  useMemo(() => {
    if (!ref.current) return
    for (let i = 0; i < frame.points.length; i++) {
      const p = frame.points[i]
      dummy.position.set(p.position[0], p.position[1], p.position[2])
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
      const c = colors[i]
      ref.current.setColorAt?.(i, c)
    }
    ref.current.instanceMatrix.needsUpdate = true
    // Optional: instanceColor exists when using color instancing
    if ((ref.current as any).instanceColor) (ref.current as any).instanceColor.needsUpdate = true
  }, [frame, colors, dummy])

  return (
    <instancedMesh ref={ref} args={[undefined as any, undefined as any, frame.points.length]}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshStandardMaterial roughness={0.35} metalness={0.1} />
    </instancedMesh>
  )
}
