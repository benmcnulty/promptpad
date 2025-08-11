"use client"

import type { VectorFrame } from '@/lib/vectorization'

// Placeholder to avoid build-time dependency on @react-three/* when 3D is disabled.
// When NEXT_PUBLIC_ENABLE_R3F=1 and deps are installed, we can swap this with the real Canvas-based renderer.
export default function Visualizer3D({ frame }: { frame: VectorFrame }) {
  return (
    <div className="w-full h-[360px] rounded-md overflow-hidden border border-yellow-300/40 bg-yellow-50/50 flex items-center justify-center text-yellow-800">
      3D rendering disabled. Install R3F deps and set NEXT_PUBLIC_ENABLE_R3F=1.
    </div>
  )
}
