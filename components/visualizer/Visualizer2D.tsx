"use client"

import { useEffect, useMemo, useRef } from 'react'
import type { VectorFrame } from '@/lib/vectorization'

interface Props {
  frame: VectorFrame
  width?: number
  height?: number
  pointSize?: number
  edgeOpacity?: number
  animate?: boolean
  speed?: number
  trails?: boolean
  trailStrength?: number
}

// Lightweight 2D preview that projects 3D positions with depth shading.
export default function Visualizer2D({ frame, width = 640, height = 360, pointSize = 2.5, edgeOpacity = 0.4, animate = true, speed = 1, trails = true, trailStrength = 0.08 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  const projected = useMemo(() => {
    // Normalize positions to fit viewport
    const xs = frame.points.map(p => p.position[0])
    const ys = frame.points.map(p => p.position[1])
    const zs = frame.points.map(p => p.position[2])
    const minX = Math.min(...xs, -1)
    const maxX = Math.max(...xs, 1)
    const minY = Math.min(...ys, -1)
    const maxY = Math.max(...ys, 1)
    const minZ = Math.min(...zs, -1)
    const maxZ = Math.max(...zs, 1)
    return { minX, maxX, minY, maxY, minZ, maxZ }
  }, [frame])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    let raf = 0
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let t = 0

    function norm(val: number, min: number, max: number) {
      return max - min === 0 ? 0.5 : (val - min) / (max - min)
    }

    const draw = () => {
      if (!trails) {
        ctx.clearRect(0, 0, width, height)
        const grd = ctx.createLinearGradient(0, 0, width, height)
        grd.addColorStop(0, 'rgba(12, 10, 30, 1)')
        grd.addColorStop(1, 'rgba(40, 20, 70, 1)')
        ctx.fillStyle = grd
        ctx.fillRect(0, 0, width, height)
      } else {
        // Fade previous frame to create trails
        ctx.globalAlpha = trailStrength
        ctx.fillStyle = 'rgba(11,16,34,1)'
        ctx.fillRect(0, 0, width, height)
        ctx.globalAlpha = 1
      }

      // edges
      ctx.lineWidth = 1
      for (const e of frame.edges) {
        const a = frame.points.find(p => p.id === e.from)
        const b = frame.points.find(p => p.id === e.to)
        if (!a || !b) continue
        const ax = norm(a.position[0], projected.minX, projected.maxX) * width
        const ay = norm(a.position[1], projected.minY, projected.maxY) * height
        const bx = norm(b.position[0], projected.minX, projected.maxX) * width
        const by = norm(b.position[1], projected.minY, projected.maxY) * height
        const za = norm(a.position[2], projected.minZ, projected.maxZ)
        const zb = norm(b.position[2], projected.minZ, projected.maxZ)
        const alpha = Math.min(1, edgeOpacity * (0.5 + 0.5 * Math.min(za, zb)))
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha.toFixed(3)})` // cyan-400
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(bx, by)
        ctx.stroke()
      }

      // animated travelers along edges
      if (animate && !prefersReduced) {
        ctx.globalCompositeOperation = 'lighter'
        for (let i = 0; i < frame.edges.length; i++) {
          const e = frame.edges[i]
          const a = frame.points.find(p => p.id === e.from)
          const b = frame.points.find(p => p.id === e.to)
          if (!a || !b) continue
          const ax = norm(a.position[0], projected.minX, projected.maxX) * width
          const ay = norm(a.position[1], projected.minY, projected.maxY) * height
          const bx = norm(b.position[0], projected.minX, projected.maxX) * width
          const by = norm(b.position[1], projected.minY, projected.maxY) * height
          const tt = ((t * 0.01 * speed) + i * 0.07) % 1
          const x = ax + (bx - ax) * tt
          const y = ay + (by - ay) * tt
          const r = 2 + 2 * Math.sin((t + i) * 0.02)
          const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 3)
          grad.addColorStop(0, 'rgba(34, 211, 238, 1)') // cyan-400
          grad.addColorStop(1, 'rgba(34, 211, 238, 0)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(x, y, r * 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalCompositeOperation = 'source-over'
      }

      // points
      for (let i = 0; i < frame.points.length; i++) {
        const p = frame.points[i]
        const x = norm(p.position[0], projected.minX, projected.maxX) * width
        const y = norm(p.position[1], projected.minY, projected.maxY) * height
        const z = norm(p.position[2], projected.minZ, projected.maxZ)
        const base = pointSize + 2 * z
        const pulse = !animate || prefersReduced ? 1 : Math.sin(t * 0.04 * speed + i * 0.3) * 0.6 + 0.6
        const r = Math.max(1, base * pulse)
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5)
        grad.addColorStop(0, `rgba(99, 102, 241, 1)`) // indigo-500
        grad.addColorStop(1, `rgba(6, 182, 212, 0.06)`) // cyan-500 faint
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }

      t += 1
      if (animate && !prefersReduced) raf = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(raf)
  }, [frame, projected, dpr, width, height, pointSize, edgeOpacity, animate, speed, trails, trailStrength])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="2D projection of 3D vector visualization"
      className="rounded-md border border-white/20 shadow-inner"
    />
  )
}
