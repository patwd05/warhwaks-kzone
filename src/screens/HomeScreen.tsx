import { formatDate } from '../storage'
import { useStore } from '../store'
import type { View } from '../types'

type Props = {
  onNavigate: (view: View) => void
}

export function HomeScreen({ onNavigate }: Props) {
  const { events, pitches, setCurrentEventId } = useStore()

  function openEvent(id: string) {
    setCurrentEventId(id)
    onNavigate('track')
  }

  return (
    <div className="screen screen-home">
      <header className="home-hero">
        <p className="eyebrow">Coach tools</p>
        <h1>K-Zone</h1>
        <p className="lede">Track pitches by dragging the ball. Built for the dugout.</p>
      </header>

      <button type="button" className="btn btn-primary btn-xl" onClick={() => onNavigate('setup')}>
        New event
      </button>

      <button type="button" className="btn btn-secondary" onClick={() => onNavigate('roster')}>
        Players
      </button>

      <section className="event-list">
        <h2>Recent events</h2>
        {events.length === 0 && (
          <p className="empty-copy">No events yet. Start a practice or game to begin tracking.</p>
        )}
        <ul>
          {events.map((event) => {
            const count = pitches.filter((p) => p.eventId === event.id).length
            const title =
              event.type === 'game'
                ? event.opponent
                  ? `vs ${event.opponent}`
                  : 'Game'
                : event.opponent
                  ? `Practice · ${event.opponent}`
                  : 'Practice'
            return (
              <li key={event.id}>
                <button type="button" className="event-card" onClick={() => openEvent(event.id)}>
                  <span className={`pill pill-${event.type}`}>{event.type}</span>
                  <span className="event-card-title">{title}</span>
                  <span className="event-card-meta">
                    {formatDate(event.date)} · {count} {count === 1 ? 'pitch' : 'pitches'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
