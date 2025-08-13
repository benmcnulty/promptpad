// @ts-nocheck
"use client"

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { 
  ClusterVectorFrame, 
  ClusterVisualizationOptions
} from '@/lib/vectorization/cluster-types'

interface ClusterVisualizer3DProps {
  frame: ClusterVectorFrame | null
  options: ClusterVisualizationOptions
  activeClusterId?: string
  isLoading?: boolean
  loadingStep?: string
  loadingProgress?: number
  onWordClick?: (word: string, clusterId: string) => void
}

export default function ClusterVisualizer3DSimple({ 
  frame, 
  options, 
  activeClusterId,
  isLoading = false,
  loadingStep = 'Loading...',
  loadingProgress = 0,
  onWordClick 
}: ClusterVisualizer3DProps) {
  return (
    <div className="w-full h-full rounded-md overflow-hidden">
      <Canvas 
        camera={{ position: [5, 5, 5], fov: 60 }}
        style={{ background: '#0b1022' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={0.8} />
          
          {/* Simple scene content */}
          {isLoading ? (
            <LoadingScene step={loadingStep} progress={loadingProgress} />
          ) : frame && frame.clusters.length > 0 ? (
            <ClusterScene frame={frame} options={options} onWordClick={onWordClick} />
          ) : (
            <EmptyScene />
          )}
          
          <OrbitControls 
            enablePan 
            enableRotate 
            enableZoom 
            minDistance={2}
            maxDistance={20}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

function LoadingScene({ step, progress }: { step: string, progress: number }) {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial 
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh position={[0, -2, 0]}>
        <boxGeometry args={[3, 0.2, 0.2]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[-1.5 + (progress/100) * 3, -2, 0]}>
        <boxGeometry args={[progress/100 * 3, 0.2, 0.2]} />
        <meshStandardMaterial color="#22d3ee" />
      </mesh>
    </group>
  )
}

function ClusterScene({ 
  frame, 
  options, 
  onWordClick 
}: { 
  frame: ClusterVectorFrame
  options: ClusterVisualizationOptions
  onWordClick?: (word: string, clusterId: string) => void
}) {
  return (
    <group>
      {frame.clusters.map((cluster, index) => (
        <group key={cluster.id} position={cluster.position}>
          <mesh>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
          {cluster.words.slice(0, 8).map((word, wordIndex) => {
            const angle = (wordIndex / 8) * Math.PI * 2
            const radius = 0.8
            const x = Math.cos(angle) * radius
            const z = Math.sin(angle) * radius
            return (
              <mesh 
                key={`${cluster.id}-${word}-${wordIndex}`}
                position={[x, 0, z]}
                onClick={() => onWordClick?.(word, cluster.id)}
              >
                <sphereGeometry args={[0.05, 12, 12]} />
                <meshStandardMaterial color="#10b981" />
              </mesh>
            )
          })}
        </group>
      ))}
    </group>
  )
}

function EmptyScene() {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial 
          color="#6366f1"
          emissive="#6366f1"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  )
}