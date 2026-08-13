import { useEffect, useRef } from 'react'
import type { Pitch } from '../types'

type Props = {
  pitches: Pitch[]
}

export function HeatmapCanvas({ pitches }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = parent.clientWidth
      const h = parent.clientHeight
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const radius = Math.max(28, Math.min(w, h) * 0.12)

      for (const p of pitches) {
        const x = p.x * w
        const y = p.y * h
        const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
        if (p.result === 'strike') {
          g.addColorStop(0, 'rgba(220, 40, 30, 0.55)')
          g.addColorStop(0.45, 'rgba(255, 140, 40, 0.28)')
          g.addColorStop(1, 'rgba(255, 200, 60, 0)')
        } else {
          g.addColorStop(0, 'rgba(30, 90, 200, 0.5)')
          g.addColorStop(0.45, 'rgba(70, 140, 220, 0.24)')
          g.addColorStop(1, 'rgba(120, 180, 255, 0)')
        }
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      for (const p of pitches) {
        const x = p.x * w
        const y = p.y * h
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, Math.PI * 2)
        ctx.fillStyle = p.result === 'strike' ? '#fff6e5' : '#e8f1ff'
        ctx.fill()
        ctx.lineWidth = 2
        ctx.strokeStyle = p.result === 'strike' ? '#c41e3a' : '#1d4e89'
        ctx.stroke()
      }
    }

    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(parent)
    return () => observer.disconnect()
  }, [pitches])

  return <canvas className="heatmap-canvas" ref={ref} />
}
