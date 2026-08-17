import { formatDate } from '../storage'
import { useStore } from '../store'
import type { View } from '../types'

type Props = {
  onNavigate: (view: View) => void
}

export function HomeScreen({ onNavigate }: Props) {
  const { events, pitches, setCurrentEventId, removeEvent, cloudStatus, cloudError, refreshCloud } =
    useStore()

  function openEvent(id: string) {
    setCurrentEventId(id)
    onNavigate('track')
  }

  function deleteEvent(id: string, title: string) {
    if (!window.confirm(`Remove ${title} and all of its pitches?`)) return
    removeEvent(id)
  }

  return (
    <div className="screen screen-home">
      <header className="home-hero">
        <div className="home-brand">
          <img className="home-logo" src="/warhawks-logo.png" alt="" />
          <div className="home-brand-text">
            <p className="eyebrow">Warhawks</p>
            <h1>K-Zone</h1>
          </div>
        </div>
        <p className="lede">Track pitches by dragging the ball.</p>
        <button type="button" className={`cloud-pill cloud-pill--${cloudStatus}`} onClick={refreshCloud}>
          {cloudStatus === 'on' && 'Cloud synced'}
          {cloudStatus === 'connecting' && 'Connecting to cloud…'}
          {cloudStatus === 'off' && 'Saving on this device only'}
          {cloudStatus === 'error' && (cloudError ?? 'Cloud sync failed')}
        </button>
      </header>

      <button type="button" className="btn btn-primary btn-xl" onClick={() => onNavigate('setup')}>
        New event
      </button>

      <button type="button" className="btn btn-secondary" onClick={() => onNavigate('roster')}>
        Players
      </button>

      <button type="button" className="btn btn-secondary" onClick={() => onNavigate('team-stats')}>
        Team stats
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
              <li key={event.id} className="event-row">
                <button type="button" className="event-card" onClick={() => openEvent(event.id)}>
                  <span className={`pill pill-${event.type}`}>{event.type}</span>
                  <span className="event-card-title">{title}</span>
                  <span className="event-card-meta">
                    {formatDate(event.date)} · {count} {count === 1 ? 'pitch' : 'pitches'}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => deleteEvent(event.id, title)}
                >
                  Remove
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
