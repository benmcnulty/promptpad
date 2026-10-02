import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import ClusterVisualizer3D from '@/components/cluster/ClusterVisualizer3D'
import ClusterVisualizer3DSimple from '@/components/cluster/ClusterVisualizer3DSimple'
import VectorScene from '@/components/visualizer/VectorScene'
import VectorRenderer from '@/components/visualizer/Visualizer3D.r3f'
import DisabledRenderer from '@/components/visualizer/Visualizer3D'
import type { ClusterVectorFrame, ClusterVisualizationOptions } from '@/lib/vectorization/cluster-types'

// The repository's minimal ambient Three declaration omits these CPU classes.
// Resolve the real runtime without expanding production declaration scope.
const { Matrix4, Vector3 } = jest.requireActual('three')

// A GPU boundary, not a substitute WebGL renderer. Host objects are real Three
// objects, JSX is mounted with React, and useFrame callbacks are driven by a
// deterministic clock. These tests prove scene logic and transforms, not pixels.
jest.mock('react/jsx-runtime', () => {
  const runtime = jest.requireActual('react/jsx-runtime')
  const React = jest.requireActual('react')
  const Three = jest.requireActual('three')
  const objects: any[] = []
  const hosts = new Map<string, any>()
  const kinds = new Set(['group', 'mesh', 'instancedMesh', 'sphereGeometry', 'boxGeometry', 'ringGeometry', 'meshStandardMaterial', 'meshBasicMaterial', 'ambientLight', 'pointLight', 'color'])
  function host(kind: string) {
    if (!hosts.has(kind)) {
      function Host(props: any) {
        const record = React.useMemo(() => ({
          kind, props, object: kind === 'instancedMesh' ? new Three.InstancedMesh(undefined, undefined, props.args[2]) : kind === 'mesh' ? new Three.Mesh() : new Three.Group()
        }), [])
        record.props = props
        React.useImperativeHandle(props.ref, () => record.object, [record])
        React.useLayoutEffect(() => {
          if (props.position) record.object.position.set(...props.position)
        }, [props.position])
        React.useEffect(() => {
          objects.push(record)
          return () => objects.splice(objects.indexOf(record), 1)
        }, [record])
        return React.createElement('div', {
          'data-gpu-kind': kind, 'data-args': JSON.stringify(props.args),
          onClick: props.onClick, onPointerEnter: props.onPointerEnter, onPointerLeave: props.onPointerLeave
        }, props.children)
      }
      hosts.set(kind, Host)
    }
    return hosts.get(kind)
  }
  const wrap = (fn: any) => (type: any, props: any, key: any) => fn(kinds.has(type) ? host(type) : type, props, key)
  return { ...runtime, jsx: wrap(runtime.jsx), jsxs: wrap(runtime.jsxs), objects }
})
jest.mock('react/jsx-dev-runtime', () => {
  const runtime = jest.requireMock('react/jsx-runtime')
  return { ...jest.requireActual('react/jsx-dev-runtime'), jsxDEV: runtime.jsx }
})
const mockFrameCallbacks = new Set<(state: any) => void>()
const mockSetClearColor = jest.fn()
jest.mock('@react-three/fiber', () => {
  const React = jest.requireActual('react')
  return {
    Canvas: ({ children, onCreated, camera }: any) => {
      React.useEffect(() => { onCreated?.({ gl: { setClearColor: mockSetClearColor } }) }, [onCreated])
      return React.createElement('div', { 'data-testid': 'gpu-boundary', 'data-camera': JSON.stringify(camera) }, children)
    },
    useFrame: (callback: (state: any) => void) => React.useEffect(() => {
      mockFrameCallbacks.add(callback)
      return () => mockFrameCallbacks.delete(callback)
    }, [callback])
  }
})
jest.mock('@react-three/drei', () => {
  const React = jest.requireActual('react')
  return {
    Text: React.forwardRef(({ children, color }: any, ref: any) => React.createElement('span', { ref, 'data-color': typeof color === 'string' ? color : color?.getHexString() }, children)),
    Line: ({ points, opacity }: any) => React.createElement('div', { 'data-testid': 'connection', 'data-points': JSON.stringify(points), 'data-opacity': opacity }),
    OrbitControls: (props: any) => React.createElement('div', { 'data-testid': 'orbit-controls', 'data-limits': JSON.stringify([props.minDistance, props.maxDistance]) })
  }
})

const objects = (): any[] => jest.requireMock('react/jsx-runtime').objects
const kinds = (kind: string) => objects().filter(record => record.kind === kind)
const tick = (time = 1) => act(() => { for (const callback of mockFrameCallbacks) callback({ clock: { getElapsedTime: () => time } }) })
const options: ClusterVisualizationOptions = { layout: 'spherical', colorScheme: 'depth', showConnections: true, animateExpansion: true, particleEffects: false, clusterSpacing: 2, wordSpacing: 0.8 }
const frame: ClusterVectorFrame = {
  clusters: [
    { id: 'root', sourcePrompt: 'garden', words: ['seed'], position: [0, 0, 0], connections: ['child'], createdAt: 1, depth: 0, isExpanded: false },
    { id: 'child', parentWord: 'seed', sourcePrompt: 'garden', words: ['grow'], position: [3, 0, 0], connections: ['root'], createdAt: 2, depth: 1, isExpanded: false }
  ],
  points: [
    { id: 'root_0', token: 'seed', position: [1, 2, 3], magnitude: 0.5, group: 'root' },
    { id: 'child_0', token: 'grow', position: [4, 5, 6], magnitude: 0.7, group: 'child' },
    { id: 'orphan', token: 'orphan', position: [0, 0, 0], magnitude: 0.5, group: 'missing-cluster' },
    { id: 'ungrouped', token: 'ungrouped', position: [0, 0, 0], magnitude: 0.5 }
  ],
  edges: [{ from: 'root_0', to: 'child_0', weight: 1 }, { from: 'root_0', to: 'missing', weight: 1 }],
  meta: { source: 'word-cluster', networkId: 'test', createdAt: 1 }
}

describe('scene logic at the GPU boundary', () => {
  beforeEach(() => { mockSetClearColor.mockReset(); jest.useFakeTimers() })
  afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers() })

  it('renders a placeholder for missing data and applies ambient animation transforms', () => {
    const { unmount } = render(<ClusterVisualizer3D frame={null} options={options} />)
    expect(screen.getByText('Enter a concept to begin')).toBeInTheDocument()
    expect(mockSetClearColor).toHaveBeenCalledWith('#0b1022', 1)
    expect(screen.getByTestId('orbit-controls')).toHaveAttribute('data-limits', '[2,20]')
    expect(mockFrameCallbacks.size).toBe(12)
    const ambient = kinds('mesh').slice(1)
    const before = ambient[0].object.position.y
    tick()
    expect(ambient[0].object.position.y).toBeCloseTo(before + Math.sin(1.5) * 0.005)
    expect(ambient[0].object.rotation.y).toBeCloseTo(0.005)
    expect(ambient[0].object.material.opacity).toBeGreaterThan(0.1)
    expect(ambient[0].object.material.opacity).toBeLessThanOrEqual(0.3)
    unmount()
    expect(mockFrameCallbacks.size).toBe(0)
  })

  it('renders loading progress, updates pulse and particle state, and replaces loading with data', () => {
    const { rerender } = render(<ClusterVisualizer3D frame={frame} options={options} isLoading loadingStep="Associating words" loadingProgress={45.4} />)
    expect(screen.getByText('Associating words')).toBeInTheDocument()
    expect(screen.getByText('45%')).toBeInTheDocument()
    expect(screen.queryByText('grow')).not.toBeInTheDocument()
    expect(kinds('ringGeometry')[0].props.args[5]).toBeCloseTo(0.454 * Math.PI * 2)
    const orb = kinds('mesh')[0].object
    const particle = kinds('mesh')[2].object
    const y = particle.position.y
    tick()
    expect(orb.scale.x).toBeCloseTo(1 + Math.sin(2) * 0.3)
    expect(orb.rotation.y).toBeCloseTo(0.02)
    expect(particle.position.y).not.toBe(y)
    expect(particle.material.opacity).toBeGreaterThanOrEqual(0.2)
    rerender(<ClusterVisualizer3D frame={frame} options={options} />)
    expect(screen.queryByText('Associating words')).not.toBeInTheDocument()
    expect(screen.getByText('grow')).toBeInTheDocument()
  })

  it('filters orphan points and broken edges, forwards word identity and handles hover/click transitions', () => {
    const click = jest.fn()
    const { container } = render(<ClusterVisualizer3D frame={frame} options={options} activeClusterId="root" onWordClick={click} />)
    expect(screen.queryByText('orphan')).not.toBeInTheDocument()
    expect(screen.queryByText('ungrouped')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('connection')).toHaveLength(1)
    expect(screen.getByTestId('connection')).toHaveAttribute('data-points', '[[1,2,3],[4,5,6]]')
    const word = screen.getByText('grow').parentElement!.querySelector('[data-gpu-kind="mesh"]')!
    fireEvent.pointerEnter(word)
    expect(screen.getByText(/grow\s+Click to expand/)).toBeInTheDocument()
    expect(container.querySelectorAll('[data-gpu-kind="ringGeometry"]')).toHaveLength(1)
    const moving = kinds('mesh').filter(record => record.props.onPointerEnter)[1].object
    tick()
    expect(kinds('group').some(record => record.object.rotation.y === 0.01)).toBe(true)
    expect(moving.scale.x).toBeCloseTo(1.03)
    fireEvent.click(word)
    expect(click).toHaveBeenCalledWith('grow', 'child')
    fireEvent.pointerLeave(word)
    expect(screen.queryByText(/Click to expand/)).not.toBeInTheDocument()
    tick()
    expect(moving.scale.x).toBeCloseTo(1.037)
    act(() => jest.advanceTimersByTime(200))
    expect(jest.getTimerCount()).toBe(0)
    tick()
    expect(moving.scale.x).toBeLessThan(1.037)
  })

  it('honors connection, expansion and particle toggles with real scene objects', () => {
    const { rerender } = render(<ClusterVisualizer3D frame={frame} options={{ ...options, showConnections: false, animateExpansion: false, particleEffects: true }} activeClusterId="root" />)
    expect(screen.queryByTestId('connection')).not.toBeInTheDocument()
    expect(kinds('sphereGeometry').filter(record => record.props.args[0] === 0.02)).toHaveLength(40)
    tick()
    expect(kinds('group').filter(record => record.props.position).every(record => record.object.rotation.y === 0)).toBe(true)
    expect(kinds('group').some(record => record.object.rotation.y === 0.002)).toBe(true)
    rerender(<ClusterVisualizer3D frame={frame} options={options} />)
    expect(kinds('sphereGeometry').filter(record => record.props.args[0] === 0.02)).toHaveLength(0)
    expect(screen.getAllByTestId('connection')).toHaveLength(1)
  })

  it('keeps colors stable per scheme and gives depth colors to the correct cluster centers', () => {
    const { rerender } = render(<ClusterVisualizer3D frame={frame} options={options} />)
    const centers = () => kinds('meshStandardMaterial').filter(record => record.props.opacity === 0.8).map(record => record.props.color.getHexString())
    expect(centers()).toEqual(['3b82f6', '10b981'])
    const palettes = new Set<string>()
    for (const colorScheme of ['semantic', 'rainbow', 'monochrome', 'custom'] as const) {
      rerender(<ClusterVisualizer3D frame={frame} options={{ ...options, colorScheme }} />)
      const first = centers()
      expect(first[0]).not.toBe(first[1])
      palettes.add(first.join(','))
      rerender(<ClusterVisualizer3D frame={{ ...frame }} options={{ ...options, colorScheme }} />)
      expect(centers()).toEqual(first)
    }
    // Custom currently intentionally uses the semantic palette.
    expect(palettes.size).toBe(3)
  })

  it('contains GPU setup failure and safely tolerates an animation transform failure', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    mockSetClearColor.mockImplementation(() => { throw new Error('Context unavailable') })
    render(<ClusterVisualizer3D frame={frame} options={options} />)
    expect(warn).toHaveBeenCalledWith('Failed to set clear color:', expect.any(Error))
    for (const record of kinds('mesh')) jest.spyOn(record.object.scale, 'lerp').mockImplementation(() => { throw new Error('Transform unavailable') })
    expect(() => tick()).not.toThrow()
    expect(screen.getByText('grow')).toBeInTheDocument()
  })

  it('keeps simple scene word selection bounded to eight visible nodes', () => {
    const click = jest.fn()
    const simpleFrame = { ...frame, clusters: [{ ...frame.clusters[0], words: Array.from({ length: 12 }, (_, i) => `word${i}`) }] }
    const { container, rerender } = render(<ClusterVisualizer3DSimple frame={simpleFrame} options={options} onWordClick={click} />)
    const meshes = container.querySelectorAll('[data-gpu-kind="mesh"]')
    expect(meshes).toHaveLength(9)
    fireEvent.click(meshes[8])
    expect(click).toHaveBeenCalledWith('word7', 'root')
    rerender(<ClusterVisualizer3DSimple frame={null} options={options} />)
    expect(container.querySelectorAll('[data-gpu-kind="mesh"]')).toHaveLength(1)
    rerender(<ClusterVisualizer3DSimple frame={null} options={options} isLoading loadingProgress={50} />)
    expect(kinds('boxGeometry').map(record => record.props.args[0])).toEqual([3, 1.5])
  })

  it('positions vector instances on the initial mount and updates them when the frame changes', () => {
    const vector = { ...frame, points: frame.points.slice(0, 2), meta: { source: 'demo' as const, createdAt: 1 } }
    const { rerender } = render(<VectorScene frame={vector} />)
    const instance = () => kinds('instancedMesh')[0].object
    const matrix = new Matrix4()
    instance().getMatrixAt(1, matrix)
    expect(new Vector3().setFromMatrixPosition(matrix).toArray()).toEqual([4, 5, 6])
    expect(instance().instanceColor).not.toBeNull()
    rerender(<VectorScene frame={{ ...vector, points: [{ ...vector.points[0], position: [7, 8, 9] }, vector.points[1]] }} />)
    instance().getMatrixAt(0, matrix)
    expect(new Vector3().setFromMatrixPosition(matrix).toArray()).toEqual([7, 8, 9])
    expect(screen.getAllByTestId('connection')).toHaveLength(1)
  })

  it('passes vector edge opacity and point size through the alternate scene and exposes disabled mode', () => {
    const vector = { ...frame, points: frame.points.slice(0, 2), meta: { source: 'demo' as const, createdAt: 1 } }
    const { rerender } = render(<VectorRenderer frame={vector} edgeOpacity={0.6} pointSize={0.1} />)
    expect(screen.getByTestId('connection')).toHaveAttribute('data-opacity', '0.6')
    expect(kinds('sphereGeometry').map(record => record.props.args[0])).toEqual([0.1, 0.1])
    rerender(<DisabledRenderer frame={vector} />)
    expect(screen.getByText(/3D rendering disabled/)).toBeInTheDocument()
    expect(screen.queryByTestId('gpu-boundary')).not.toBeInTheDocument()
  })
})
