import type { ReactNode } from 'react'
import { FIELD } from '../field'
import type { PitchResult } from '../types'

type Props = {
  children?: ReactNode
  zoneMode?: 'idle' | PitchResult
}

export function Field({ children, zoneMode = 'idle' }: Props) {
  const zone = {
    left: `${FIELD.zone.left * 100}%`,
    top: `${FIELD.zone.top * 100}%`,
    width: `${FIELD.zone.width * 100}%`,
    height: `${FIELD.zone.height * 100}%`,
  }
  const plate = {
    left: `${FIELD.plate.left * 100}%`,
    top: `${FIELD.plate.top * 100}%`,
    width: `${FIELD.plate.width * 100}%`,
    height: `${FIELD.plate.height * 100}%`,
  }

  return (
    <div className={`field field--${zoneMode}`}>
      <div className="field-grass" />
      <div className="field-dirt" />
      <div className="strike-zone" style={zone} aria-hidden>
        <span className="strike-zone-label">STRIKE ZONE</span>
      </div>
      <svg className="home-plate" style={plate} viewBox="0 0 17 17" aria-hidden>
        <path
          d="M8.5 0.4 L16.6 8.5 L16.6 16.6 L0.4 16.6 L0.4 8.5 Z"
          fill="#f7f4ec"
          stroke="#d9d2c3"
          strokeWidth="0.45"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 1.6 L15.4 8.5 L15.4 15.5 L1.6 15.5 L1.6 8.5 Z"
          fill="none"
          stroke="#cfc6b4"
          strokeWidth="0.2"
        />
      </svg>
      {children}
    </div>
  )
}
