// @ts-nocheck
"use client"

import { Suspense } from 'react'
import { OrbitControls } from '@react-three/drei'
import type { VectorFrame } from '@/lib/vectorization'
import VectorPoints from './VectorPoints'
import VectorEdges from './VectorEdges'

export default function VectorScene({ frame }: { frame: VectorFrame }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[3, 3, 3]} intensity={0.6} />
      <pointLight position={[-3, -2, -4]} intensity={0.2} />
      <Suspense fallback={null}>
        <VectorEdges frame={frame} />
        <VectorPoints frame={frame} />
      </Suspense>
      <OrbitControls enablePan enableRotate enableZoom />
    </>
  )
}
