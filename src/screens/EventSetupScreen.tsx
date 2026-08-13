import { useState, type FormEvent } from 'react'
import { todayInputValue } from '../storage'
import { useStore } from '../store'
import type { EventType, View } from '../types'

type Props = {
  onNavigate: (view: View) => void
}

export function EventSetupScreen({ onNavigate }: Props) {
  const { createEvent } = useStore()
  const [type, setType] = useState<EventType>('practice')
  const [date, setDate] = useState(todayInputValue)
  const [opponent, setOpponent] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (type === 'game' && !opponent.trim()) return
    createEvent({ type, date, opponent })
    onNavigate('track')
  }

  const canStart = type === 'practice' || opponent.trim().length > 0

  return (
    <div className="screen">
      <header className="screen-header">
        <button type="button" className="back-btn" onClick={() => onNavigate('home')}>
          Back
        </button>
        <h1>New event</h1>
      </header>

      <form className="setup-form" onSubmit={submit}>
        <p className="field-label">Type</p>
        <div className="segmented" role="group" aria-label="Event type">
          <button
            type="button"
            className={type === 'practice' ? 'is-active' : ''}
            onClick={() => setType('practice')}
          >
            Practice
          </button>
          <button
            type="button"
            className={type === 'game' ? 'is-active' : ''}
            onClick={() => setType('game')}
          >
            Game
          </button>
        </div>

        <label className="field-label" htmlFor="event-date">
          Date
        </label>
        <input id="event-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <label className="field-label" htmlFor="opponent">
          {type === 'game' ? 'Opponent' : 'Notes (optional)'}
        </label>
        <input
          id="opponent"
          autoComplete="off"
          placeholder={type === 'game' ? 'Tigers' : 'Bullpen, live BP…'}
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
        />

        <button type="submit" className="btn btn-primary btn-xl" disabled={!canStart}>
          Start tracking
        </button>
      </form>
    </div>
  )
}
