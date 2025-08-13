// @ts-nocheck
"use client"

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import { Color, Vector3 } from 'three'
import type { 
  ClusterVectorFrame, 
  ClusterVisualizationOptions, 
  ColorScheme 
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

export default function ClusterVisualizer3D({ 
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
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => {
          try {
            gl.setClearColor('#0b1022', 1)
          } catch (error) {
            console.warn('Failed to set clear color:', error)
          }
        }}
        dpr={[1, 2]}
        linear
        flat
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.4} />
        
        <ClusterScene 
          frame={frame} 
          options={options} 
          activeClusterId={activeClusterId}
          isLoading={isLoading}
          loadingStep={loadingStep}
          loadingProgress={loadingProgress}
          onWordClick={onWordClick}
        />
        
        <OrbitControls 
          enablePan 
          enableRotate 
          enableZoom 
          minDistance={2}
          maxDistance={20}
        />
      </Canvas>
    </div>
  )
}

function ClusterScene({ 
  frame, 
  options, 
  activeClusterId,
  isLoading,
  loadingStep,
  loadingProgress,
  onWordClick 
}: {
  frame: ClusterVectorFrame | null
  options: ClusterVisualizationOptions
  activeClusterId?: string
  isLoading?: boolean
  loadingStep?: string
  loadingProgress?: number
  onWordClick?: (word: string, clusterId: string) => void
}) {
  const groupRef = useRef<THREE.Group>(null)

  // Group points by cluster for rendering
  const clusterGroups = useMemo(() => {
    const groups = new Map()
    
    if (!frame?.points || !Array.isArray(frame.points)) {
      return groups
    }
    
    frame.points.forEach(point => {
      if (!point?.group) return
      
      if (!groups.has(point.group)) {
        groups.set(point.group, [])
      }
      groups.get(point.group).push(point)
    })
    
    return groups
  }, [frame?.points])

  const hasData = frame && frame.clusters && clusterGroups.size > 0

  return (
    <group ref={groupRef}>
      {/* Show loading animation in 3D scene when loading */}
      {isLoading && (
        <LoadingAnimationMesh 
          step={loadingStep} 
          progress={loadingProgress} 
          position={[0, 0, 0]} 
        />
      )}
      
      {/* Render cluster data when available and not loading */}
      {!isLoading && hasData && (
        <>
          {/* Render cluster connections */}
          {options.showConnections && (
            <ClusterConnections frame={frame} options={options} />
          )}
          
          {/* Render each cluster */}
          {Array.from(clusterGroups.entries()).map(([clusterId, points]) => {
            const cluster = frame.clusters.find(c => c.id === clusterId)
            if (!cluster) return null
            
            return (
              <ClusterGroup
                key={clusterId}
                cluster={cluster}
                points={points}
                options={options}
                isActive={activeClusterId === clusterId}
                onWordClick={onWordClick}
              />
            )
          })}
          
          {/* Particle effects */}
          {options.particleEffects && (
            <ParticleEffects frame={frame} options={options} />
          )}
        </>
      )}
      
      {/* Show placeholder scene when no data and not loading */}
      {!isLoading && !hasData && (
        <PlaceholderScene />
      )}
    </group>
  )
}

function ClusterGroup({ 
  cluster, 
  points, 
  options, 
  isActive, 
  onWordClick 
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)

  useFrame((state) => {
    try {
      if (options.animateExpansion && groupRef.current) {
        // Gentle rotation for active clusters
        if (isActive) {
          groupRef.current.rotation.y += 0.01
        }
      }
    } catch (error) {
      // Silently handle animation errors
    }
  })

  // Validate cluster and points data
  if (!cluster || !points || !Array.isArray(points) || points.length === 0) {
    return null
  }

  const clusterColor = getClusterColor(cluster, options.colorScheme)

  return (
    <group ref={groupRef} position={cluster.position}>
      {/* Cluster center indicator */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial 
          color={clusterColor}
          emissive={clusterColor}
          emissiveIntensity={isActive ? 0.5 : 0.2}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Cluster label using Text component instead of Html */}
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.15}
        color={isActive ? "#ffffff" : "#374151"}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {cluster.parentWord || 'Root'}
      </Text>

      {/* Word points */}
      {points.map((point, index) => (
        <WordPoint
          key={point.id}
          point={point}
          cluster={cluster}
          options={options}
          isHovered={hoveredWord === point.token}
          onHover={setHoveredWord}
          onClick={onWordClick}
        />
      ))}

      {/* Cluster boundary (optional) */}
      {isActive && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[options.clusterSpacing, 32, 32]} />
          <meshBasicMaterial 
            color={clusterColor}
            transparent
            opacity={0.1}
            wireframe
          />
        </mesh>
      )}
    </group>
  )
}

function WordPoint({ 
  point, 
  cluster, 
  options, 
  isHovered, 
  onHover, 
  onClick 
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [clicked, setClicked] = useState(false)

  useFrame((state) => {
    try {
      if (meshRef.current) {
        // Gentle floating animation
        const time = state.clock.getElapsedTime()
        meshRef.current.position.y += Math.sin(time * 2 + point.position[0]) * 0.002
        
        // Scale on hover
        const targetScale = isHovered ? 1.3 : (clicked ? 1.1 : 1)
        meshRef.current.scale.lerp(new Vector3(targetScale, targetScale, targetScale), 0.1)
      }
    } catch (error) {
      // Silently handle animation errors
    }
  })

  const wordColor = getWordColor(point, cluster, options.colorScheme)

  const handleClick = (e: THREE.Event) => {
    e.stopPropagation()
    setClicked(true)
    setTimeout(() => setClicked(false), 200)
    onClick?.(point.token, cluster.id)
  }

  return (
    <group position={point.position}>
      {/* Word sphere */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerEnter={() => onHover(point.token)}
        onPointerLeave={() => onHover(null)}
      >
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial
          color={wordColor}
          emissive={wordColor}
          emissiveIntensity={isHovered ? 0.4 : 0.1}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Word label */}
      <Text
        position={[0, -0.15, 0]}
        fontSize={0.06}
        color={isHovered ? "#ffffff" : wordColor.getHexString()}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.002}
        outlineColor="#000000"
      >
        {point.token}
      </Text>

      {/* Hover effects */}
      {isHovered && (
        <>
          {/* Glow ring */}
          <mesh>
            <ringGeometry args={[0.12, 0.15, 16]} />
            <meshBasicMaterial
              color={wordColor}
              transparent
              opacity={0.6}
            />
          </mesh>
          
          {/* Hover text using Text component */}
          <Text
            position={[0, 0.3, 0]}
            fontSize={0.08}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.005}
            outlineColor="#000000"
          >
            {`${point.token}\nClick to expand`}
          </Text>
        </>
      )}
    </group>
  )
}

function ClusterConnections({ frame, options }: { frame: ClusterVectorFrame | null, options: ClusterVisualizationOptions }) {
  if (!options.showConnections) return null

  return (
    <group>
      {frame.edges.map((edge, index) => {
        const fromPoint = frame.points.find(p => p.id === edge.from)
        const toPoint = frame.points.find(p => p.id === edge.to)
        
        if (!fromPoint || !toPoint) return null

        return (
          <Line
            key={`connection-${index}`}
            points={[fromPoint.position, toPoint.position]}
            color="#22d3ee"
            opacity={0.4}
            transparent
            lineWidth={1}
          />
        )
      })}
    </group>
  )
}

function ParticleEffects({ frame, options }: { frame: ClusterVectorFrame | null, options: ClusterVisualizationOptions }) {
  const particlesRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    try {
      if (particlesRef.current) {
        particlesRef.current.rotation.y += 0.002
      }
    } catch (error) {
      // Silently handle animation errors
    }
  })

  // Create particle positions around clusters
  const particlePositions = useMemo(() => {
    const positions = []
    frame.clusters.forEach(cluster => {
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2
        const radius = 0.5 + Math.random() * 2
        positions.push([
          cluster.position[0] + Math.cos(angle) * radius,
          cluster.position[1] + Math.random() * 2 - 1,
          cluster.position[2] + Math.sin(angle) * radius
        ])
      }
    })
    return positions
  }, [frame.clusters])

  return (
    <group ref={particlesRef}>
      {particlePositions.map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}
    </group>
  )
}

// Color utility functions
function getClusterColor(cluster, colorScheme: ColorScheme): Color {
  switch (colorScheme) {
    case 'depth':
      const depthColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      return new Color(depthColors[cluster.depth % depthColors.length])
      
    case 'rainbow':
      const hue = (cluster.depth * 137.508) % 360 // Golden angle for even distribution
      return new Color().setHSL(hue / 360, 0.7, 0.6)
      
    case 'monochrome':
      const lightness = 0.3 + (cluster.depth * 0.1)
      return new Color().setHSL(0.6, 0.7, Math.min(lightness, 0.8))
      
    case 'semantic':
    default:
      // Hash-based color from cluster content
      const hash = cluster.words.join('').split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0)
      const semanticHue = Math.abs(hash) % 360
      return new Color().setHSL(semanticHue / 360, 0.7, 0.6)
  }
}

function getWordColor(point, cluster, colorScheme: ColorScheme): Color {
  const baseColor = getClusterColor(cluster, colorScheme)
  
  // Slightly vary the color for individual words
  const wordHash = point.token.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const variation = (Math.abs(wordHash) % 100) / 100 * 0.2 - 0.1 // ±0.1 variation
  
  const hsl = baseColor.getHSL({ h: 0, s: 0, l: 0 })
  return new Color().setHSL(
    hsl.h,
    Math.max(0.2, Math.min(1, hsl.s + variation)),
    Math.max(0.3, Math.min(0.9, hsl.l + variation))
  )
}

// Loading animation component for 3D scene
function LoadingAnimationMesh({ 
  step, 
  progress, 
  position 
}: { 
  step?: string
  progress?: number
  position: [number, number, number] 
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const textRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    try {
      if (meshRef.current) {
        // Gentle pulsing animation
        const time = state.clock.getElapsedTime()
        const pulseScale = 1 + Math.sin(time * 2) * 0.3
        meshRef.current.scale.setScalar(pulseScale)
        
        // Slow rotation
        meshRef.current.rotation.y += 0.02
        meshRef.current.rotation.x += 0.01
      }
    } catch (error) {
      // Silently handle animation errors
    }
  })

  return (
    <group position={position}>
      {/* Central pulsing orb */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={0.5}
          transparent
          opacity={0.7}
        />
      </mesh>
      
      {/* Progress ring */}
      {progress !== undefined && progress > 0 && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 0.9, 32, 1, 0, (progress / 100) * Math.PI * 2]} />
          <meshBasicMaterial
            color="#10b981"
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
      
      {/* Floating particles */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const radius = 1.5
        return (
          <FloatingParticle
            key={i}
            position={[
              Math.cos(angle) * radius,
              Math.sin(angle) * radius,
              Math.cos(angle * 2) * 0.5
            ]}
            delay={i * 0.2}
          />
        )
      })}
      
      {/* Loading text */}
      <Text
        ref={textRef}
        position={[0, -1.5, 0]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {step || 'Loading...'}
      </Text>
      
      {/* Progress percentage */}
      {progress !== undefined && (
        <Text
          position={[0, -2, 0]}
          fontSize={0.15}
          color="#22d3ee"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {Math.round(progress)}%
        </Text>
      )}
    </group>
  )
}

// Floating particle component for loading animation
function FloatingParticle({ 
  position, 
  delay 
}: { 
  position: [number, number, number]
  delay: number 
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    try {
      if (meshRef.current) {
        const time = state.clock.getElapsedTime() + delay
        meshRef.current.position.y += Math.sin(time * 3) * 0.01
        meshRef.current.rotation.x += 0.02
        meshRef.current.rotation.z += 0.01
        
        // Fade in/out effect
        const opacity = 0.5 + Math.sin(time * 2) * 0.3
        meshRef.current.material.opacity = opacity
      }
    } catch (error) {
      // Silently handle animation errors
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.08, 12, 12]} />
      <meshStandardMaterial
        color="#3b82f6"
        emissive="#3b82f6"
        emissiveIntensity={0.3}
        transparent
        opacity={0.6}
      />
    </mesh>
  )
}

// Placeholder scene for when no data is available
function PlaceholderScene() {
  return (
    <group>
      {/* Central welcome orb */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          color="#6366f1"
          emissive="#6366f1"
          emissiveIntensity={0.2}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Welcome text */}
      <Text
        position={[0, -1, 0]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        Enter a concept to begin
      </Text>
      
      {/* Ambient particles */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2
        const radius = 2 + Math.random() * 1
        const height = (Math.random() - 0.5) * 2
        return (
          <AmbientParticle
            key={i}
            position={[
              Math.cos(angle) * radius,
              height,
              Math.sin(angle) * radius
            ]}
            delay={i * 0.3}
          />
        )
      })}
    </group>
  )
}

// Ambient particle for placeholder scene
function AmbientParticle({ 
  position, 
  delay 
}: { 
  position: [number, number, number]
  delay: number 
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    try {
      if (meshRef.current) {
        const time = state.clock.getElapsedTime() + delay
        meshRef.current.position.y += Math.sin(time * 1.5) * 0.005
        meshRef.current.rotation.y += 0.005
        
        // Gentle opacity pulse
        const opacity = 0.2 + Math.sin(time * 1.2) * 0.1
        meshRef.current.material.opacity = opacity
      }
    } catch (error) {
      // Silently handle animation errors
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshBasicMaterial
        color="#8b5cf6"
        transparent
        opacity={0.3}
      />
    </mesh>
  )
}