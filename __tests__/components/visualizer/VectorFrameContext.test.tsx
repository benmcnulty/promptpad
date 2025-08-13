import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { VectorFrameProvider, useVectorFrame } from '@/components/visualizer/VectorFrameContext'

// Minimal vector frame mock
const frame = { points: [], edges: [], meta: { source: 't', createdAt: Date.now() } } as any

describe('VectorFrameContext', () => {
  it('provides and updates frame', () => {
    const wrapper = ({ children }: any) => <VectorFrameProvider>{children}</VectorFrameProvider>
    const { result } = renderHook(() => useVectorFrame(), { wrapper })
    expect(result.current.frame).toBeNull()
    act(() => { result.current.setFrame(frame) })
    expect(result.current.frame).toBe(frame)
  })

  it('throws if used outside provider', () => {
    const { result } = renderHook(() => {
      try { return useVectorFrame() } catch (e) { return e }
    })
    expect((result.current as Error).message).toMatch(/must be used/)
  })
})
