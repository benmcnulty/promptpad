"use client"

import { createContext, useContext, useMemo, useState } from 'react'
import type { VectorFrame } from '@/lib/vectorization'

interface VectorFrameCtx {
  frame: VectorFrame | null
  setFrame: (f: VectorFrame | null) => void
}

const Ctx = createContext<VectorFrameCtx | undefined>(undefined)

export function VectorFrameProvider({ children }: { children: React.ReactNode }) {
  const [frame, setFrame] = useState<VectorFrame | null>(null)
  const value = useMemo(() => ({ frame, setFrame }), [frame])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useVectorFrame(): VectorFrameCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useVectorFrame must be used within VectorFrameProvider')
  return ctx
}

