import React from 'react'
import { render, screen } from '@testing-library/react'
import Visualizer2D from '@/components/visualizer/Visualizer2D'
import type { VectorFrame } from '@/lib/vectorization'

const frame: VectorFrame = {
  points: [
    { id: 'a', token: 'seed', position: [-1, -1, -1], magnitude: 0.2 },
    { id: 'b', token: 'soil', position: [1, 1, 1], magnitude: 0.8 }
  ],
  edges: [{ from: 'a', to: 'b', weight: 1 }, { from: 'a', to: 'missing', weight: 1 }],
  meta: { source: 'demo', createdAt: 1 }
}
function drawingContext() {
  const gradient = { addColorStop: jest.fn() }
  return {
    scale: jest.fn(), clearRect: jest.fn(), fillRect: jest.fn(), beginPath: jest.fn(), moveTo: jest.fn(), lineTo: jest.fn(), stroke: jest.fn(), arc: jest.fn(), fill: jest.fn(),
    createLinearGradient: jest.fn(() => gradient), createRadialGradient: jest.fn(() => gradient),
    globalAlpha: 1, globalCompositeOperation: 'source-over', fillStyle: '', strokeStyle: '', lineWidth: 0
  }
}

describe('2D projection drawing at the canvas boundary', () => {
  afterEach(() => jest.restoreAllMocks())

  it('projects coordinates, filters broken edges and sizes the canvas for device pixels', () => {
    const ctx = drawingContext()
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as any)
    jest.replaceProperty(window, 'devicePixelRatio', 2)
    const raf = jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(7)
    const cancel = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    const { unmount } = render(<Visualizer2D frame={frame} width={200} height={100} animate={false} trails={false} edgeOpacity={0.6} pointSize={3} />)
    const canvas = screen.getByRole('img') as HTMLCanvasElement
    expect(canvas.width).toBe(400)
    expect(canvas.height).toBe(200)
    expect(canvas.style.width).toBe('200px')
    expect(ctx.scale).toHaveBeenCalledWith(2, 2)
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 200, 100)
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0)
    expect(ctx.lineTo).toHaveBeenCalledWith(200, 100)
    expect(ctx.stroke).toHaveBeenCalledTimes(1)
    expect(ctx.strokeStyle).toBe('rgba(56, 189, 248, 0.300)')
    expect(ctx.arc.mock.calls.map(call => call.slice(0, 3))).toEqual([[0, 0, 3], [200, 100, 5]])
    expect(raf).not.toHaveBeenCalled()
    unmount()
    expect(cancel).toHaveBeenCalledWith(0)
  })

  it('advances travelers, applies trails and cancels the owned animation on rerender and unmount', () => {
    const ctx = drawingContext()
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as any)
    const callbacks: FrameRequestCallback[] = []
    const raf = jest.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { callbacks.push(callback); return callbacks.length })
    const cancel = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    const { rerender, unmount } = render(<Visualizer2D frame={frame} width={200} height={100} speed={2} trailStrength={0.2} />)
    expect(ctx.clearRect).not.toHaveBeenCalled()
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 200, 100)
    expect(ctx.globalAlpha).toBe(1)
    expect(ctx.globalCompositeOperation).toBe('source-over')
    expect(ctx.arc).toHaveBeenCalledTimes(3)
    callbacks[0](16)
    expect(ctx.arc.mock.calls[3].slice(0, 2)).toEqual([4, 2])
    expect(raf).toHaveBeenCalledTimes(2)
    rerender(<Visualizer2D frame={frame} animate={false} trails={false} />)
    expect(cancel).toHaveBeenCalledWith(2)
    expect(raf).toHaveBeenCalledTimes(2)
    unmount()
    expect(cancel).toHaveBeenLastCalledWith(0)
  })

  it('honors reduced motion even when animation is requested', () => {
    const ctx = drawingContext()
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as any)
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: jest.fn(() => ({ matches: true })) })
    const raf = jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(7)
    render(<Visualizer2D frame={frame} width={200} height={100} animate />)
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    expect(raf).not.toHaveBeenCalled()
    expect(ctx.arc).toHaveBeenCalledTimes(2)
    expect(ctx.arc.mock.calls.map(call => call[2])).toEqual([2.5, 4.5])
  })

  it('keeps the accessible canvas available when no drawing context can be acquired', () => {
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const raf = jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(7)
    render(<Visualizer2D frame={frame} />)
    expect(screen.getByRole('img', { name: '2D projection of 3D vector visualization' })).toBeInTheDocument()
    expect(raf).not.toHaveBeenCalled()
  })
})
