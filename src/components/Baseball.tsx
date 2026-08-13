import type { PointerEvent } from 'react'

type Props = {
  x: number
  y: number
  dragging: boolean
  locked: boolean
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void
  onPointerMove: (e: PointerEvent<HTMLDivElement>) => void
  onPointerUp: (e: PointerEvent<HTMLDivElement>) => void
}

export function Baseball({
  x,
  y,
  dragging,
  locked,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: Props) {
  return (
    <div
      className={`baseball ${dragging ? 'is-dragging' : ''} ${locked ? 'is-locked' : ''}`}
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
      onPointerDown={locked ? undefined : onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="button"
      aria-label="Drag pitch location"
    >
      <svg viewBox="0 0 64 64" aria-hidden>
        <defs>
          <radialGradient id="ballShade" cx="35%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#f3f1ea" />
            <stop offset="100%" stopColor="#d9d3c4" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#ballShade)" stroke="#c8c0b0" strokeWidth="1.2" />
        <path
          d="M18 12c8 10 8 30 0 40"
          fill="none"
          stroke="#c41e3a"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M46 12c-8 10-8 30 0 40"
          fill="none"
          stroke="#c41e3a"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M16 20l4 2M15 28l5 1.5M16 36l4 1M18 44l3 2M48 20l-4 2M49 28l-5 1.5M48 36l-4 1M46 44l-3 2"
          stroke="#c41e3a"
          strokeWidth="1.15"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
