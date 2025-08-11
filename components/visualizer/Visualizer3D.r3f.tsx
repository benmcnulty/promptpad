// @ts-nocheck
"use client"

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'
import { AdditiveBlending, Color } from 'three'
import type { VectorFrame } from '@/lib/vectorization'

function Points({ frame, size = 0.03, animate = true }) {
  return (
    <group>
      {frame.points.map((p, i) => {
        const c = new Color().setHSL(0.58 - (p.magnitude ?? 0.5) * 0.15, 0.8, 0.6)
        return (
          <mesh key={p.id} position={p.position}>
            <sphereGeometry args={[size, 12, 12]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.35} blending={AdditiveBlending} transparent />
          </mesh>
        )
      })}
    </group>
  )
}

function Edges({ frame, opacity = 0.35 }) {
  const pointMap = new Map(frame.points.map(p => [p.id, p]))
  return (
    <group>
      {frame.edges.map((e, i) => {
        const a = pointMap.get(e.from)
        const b = pointMap.get(e.to)
        if (!a || !b) return null
        return (
          <Line key={i} points={[a.position, b.position]} color="#22d3ee" opacity={opacity} transparent lineWidth={1} />
        )
      })}
    </group>
  )
}

export default function Visualizer3D({ frame, pointSize = 0.03, edgeOpacity = 0.35, animate = true }: { frame: VectorFrame, pointSize?: number, edgeOpacity?: number, animate?: boolean }) {
  return (
    <div className="w-full h-[480px] rounded-md overflow-hidden border border-white/20">
      <Canvas camera={{ position: [0, 0, 3.5], fov: 60 }}>
        <color attach="background" args={["#0b1022"]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[3, 3, 3]} intensity={0.6} />
        <pointLight position={[-3, -2, -4]} intensity={0.2} />
        <Edges frame={frame} opacity={edgeOpacity} />
        <Points frame={frame} size={pointSize} animate={animate} />
        <OrbitControls enablePan enableRotate enableZoom />
      </Canvas>
    </div>
  )
}

