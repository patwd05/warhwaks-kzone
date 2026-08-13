import { useMemo, useState } from 'react'
import { AddPlayerSheet } from '../components/AddPlayerSheet'
import { BottomNav } from '../components/BottomNav'
import { Field } from '../components/Field'
import { HeatmapCanvas } from '../components/HeatmapCanvas'
import { PlayerSelect } from '../components/PlayerSelect'
import { StatsBar } from '../components/StatsBar'
import { formatDate } from '../storage'
import { useStore } from '../store'
import type { HeatmapScope, View } from '../types'

type Props = {
  onNavigate: (view: View) => void
}

export function HeatmapScreen({ onNavigate }: Props) {
  const { players, events, pitches, currentEventId, currentPlayerId, addPlayer, setCurrentPlayerId } =
    useStore()
  const [scope, setScope] = useState<HeatmapScope>('event')
  const [adding, setAdding] = useState(false)

  const event = events.find((e) => e.id === currentEventId)

  const filtered = useMemo(() => {
    let list = pitches
    if (currentPlayerId) {
      list = list.filter((p) => p.playerId === currentPlayerId)
    }
    if (scope === 'event' && currentEventId) {
      list = list.filter((p) => p.eventId === currentEventId)
    } else if (scope === 'practices' || scope === 'games') {
      const type = scope === 'practices' ? 'practice' : 'game'
      const ids = new Set(events.filter((e) => e.type === type).map((e) => e.id))
      list = list.filter((p) => ids.has(p.eventId))
    }
    return list
  }, [pitches, events, currentPlayerId, currentEventId, scope])

  const strikes = filtered.filter((p) => p.result === 'strike').length
  const balls = filtered.filter((p) => p.result === 'ball').length
  const playerName = players.find((p) => p.id === currentPlayerId)?.name

  const scopeLabel =
    scope === 'event'
      ? event
        ? event.type === 'game'
          ? event.opponent
            ? `vs ${event.opponent}`
            : 'This game'
          : 'This practice'
        : 'This event'
      : scope === 'practices'
        ? 'All practices'
        : scope === 'games'
          ? 'All games'
          : 'All events'

  return (
    <div className="screen screen-session">
      <header className="session-header">
        <button type="button" className="back-btn" onClick={() => onNavigate('home')}>
          Home
        </button>
        <div className="session-title">
          <strong>Heatmap</strong>
          <span>
            {playerName ?? 'All players'}
            {event ? ` · ${formatDate(event.date)}` : ''}
          </span>
        </div>
        <span className="header-spacer" />
      </header>

      <PlayerSelect
        players={players}
        value={currentPlayerId}
        onChange={setCurrentPlayerId}
        onAddPlayer={() => setAdding(true)}
        allowAll
      />

      <div className="segmented" role="group" aria-label="Heatmap range">
        <button
          type="button"
          className={scope === 'event' ? 'is-active' : ''}
          onClick={() => setScope('event')}
        >
          This event
        </button>
        <button
          type="button"
          className={scope === 'practices' ? 'is-active' : ''}
          onClick={() => setScope('practices')}
        >
          Practices
        </button>
        <button
          type="button"
          className={scope === 'games' ? 'is-active' : ''}
          onClick={() => setScope('games')}
        >
          Games
        </button>
        <button
          type="button"
          className={scope === 'all' ? 'is-active' : ''}
          onClick={() => setScope('all')}
        >
          All
        </button>
      </div>

      <StatsBar pitches={filtered.length} strikes={strikes} balls={balls} />
      <p className="scope-caption">{scopeLabel}</p>

      <div className="field-wrap">
        <Field>
          <HeatmapCanvas pitches={filtered} />
        </Field>
        {filtered.length === 0 && (
          <p className="field-hint">No pitches for this view yet.</p>
        )}
        <div className="heatmap-legend">
          <span className="legend-swatch legend-swatch--strike" /> Strike
          <span className="legend-swatch legend-swatch--ball" /> Ball
        </div>
      </div>

      <BottomNav view="heatmap" onTrack={() => onNavigate('track')} onHeatmap={() => onNavigate('heatmap')} />

      {adding && (
        <AddPlayerSheet
          onClose={() => setAdding(false)}
          onAdd={(name) => {
            const player = addPlayer(name)
            setCurrentPlayerId(player.id)
            setAdding(false)
          }}
        />
      )}
    </div>
  )
}
