import { useMemo, useState } from 'react'
import { AddPlayerSheet } from '../components/AddPlayerSheet'
import { BottomNav } from '../components/BottomNav'
import { Field } from '../components/Field'
import { HeatmapCanvas } from '../components/HeatmapCanvas'
import { PitcherStatsTable } from '../components/PitcherStatsTable'
import { PlayerSelect } from '../components/PlayerSelect'
import { StatsBar } from '../components/StatsBar'
import { formatDate, formatEventTitle } from '../storage'
import { playerGameRows } from '../stats'
import { useStore } from '../store'
import type { HeatmapScope, View } from '../types'

type Props = {
  onNavigate: (view: View) => void
  mode?: 'session' | 'player'
  backView?: View
}

export function HeatmapScreen({ onNavigate, mode = 'session', backView = 'roster' }: Props) {
  const {
    players,
    events,
    pitches,
    atBats,
    currentEventId,
    currentPlayerId,
    addPlayer,
    setCurrentPlayerId,
  } = useStore()
  const isPlayerView = mode === 'player'
  const [scope, setScope] = useState<HeatmapScope>(isPlayerView ? 'all' : 'event')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(currentEventId)
  const [adding, setAdding] = useState(false)
  const [pane, setPane] = useState<'heatmap' | 'table'>('heatmap')

  const eventId = scope === 'event' ? selectedEventId : currentEventId
  const event = events.find((e) => e.id === eventId)
  const playerName = players.find((p) => p.id === currentPlayerId)?.name

  const pitchedEvents = useMemo(() => {
    const ids = new Set(
      pitches
        .filter((p) => !currentPlayerId || p.playerId === currentPlayerId)
        .map((p) => p.eventId),
    )
    return events.filter((item) => ids.has(item.id))
  }, [events, pitches, currentPlayerId])

  const filtered = useMemo(() => {
    let list = pitches
    if (currentPlayerId) {
      list = list.filter((p) => p.playerId === currentPlayerId)
    } else if (isPlayerView) {
      return []
    }
    if (scope === 'event') {
      if (!selectedEventId) return []
      list = list.filter((p) => p.eventId === selectedEventId)
    } else if (scope === 'practices' || scope === 'games') {
      const type = scope === 'practices' ? 'practice' : 'game'
      const ids = new Set(events.filter((e) => e.type === type).map((e) => e.id))
      list = list.filter((p) => ids.has(p.eventId))
    }
    return list
  }, [pitches, events, currentPlayerId, selectedEventId, scope, isPlayerView])

  const tableRows = useMemo(
    () =>
      currentPlayerId ? playerGameRows(currentPlayerId, events, pitches, atBats ?? []) : [],
    [currentPlayerId, events, pitches, atBats],
  )

  const strikes = filtered.filter((p) => p.result === 'strike').length
  const balls = filtered.filter((p) => p.result === 'ball').length

  const showTable = isPlayerView && pane === 'table'

  const scopeLabel =
    scope === 'event'
      ? event
        ? `${formatEventTitle(event)} · ${formatDate(event.date)}`
        : 'Select an event'
      : scope === 'practices'
        ? 'All practices'
        : scope === 'games'
          ? 'All games'
          : 'All events'

  return (
    <div className={`screen ${isPlayerView ? '' : 'screen-session'}`}>
      <header className="session-header">
        <button
          type="button"
          className="back-btn"
          onClick={() => onNavigate(isPlayerView ? backView : 'home')}
        >
          {isPlayerView ? (backView === 'team-stats' ? 'Stats' : 'Players') : 'Home'}
        </button>
        <div className="session-title">
          <strong>{isPlayerView ? (playerName ?? 'Pitcher') : 'Heatmap'}</strong>
          <span>
            {isPlayerView
              ? showTable
                ? 'Season stats'
                : 'Heatmap'
              : (playerName ?? 'Select a player')}
          </span>
        </div>
        <span className="header-spacer" />
      </header>

      {!isPlayerView && (
        <PlayerSelect
          players={players}
          value={currentPlayerId}
          onChange={setCurrentPlayerId}
          onAddPlayer={() => setAdding(true)}
          allowAll
        />
      )}

      {isPlayerView && (
        <div className="segmented" role="group" aria-label="Player view">
          <button
            type="button"
            className={pane === 'heatmap' ? 'is-active' : ''}
            onClick={() => setPane('heatmap')}
          >
            Heatmap
          </button>
          <button
            type="button"
            className={pane === 'table' ? 'is-active' : ''}
            onClick={() => setPane('table')}
          >
            Table
          </button>
        </div>
      )}

      {!showTable && (
        <div className="segmented" role="group" aria-label="Heatmap range">
        <button
          type="button"
          className={scope === 'event' ? 'is-active' : ''}
          onClick={() => {
            setScope('event')
            if (!selectedEventId || !pitchedEvents.some((item) => item.id === selectedEventId)) {
              setSelectedEventId(currentEventId && pitchedEvents.some((item) => item.id === currentEventId)
                ? currentEventId
                : pitchedEvents[0]?.id ?? null)
            }
          }}
        >
          Event
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
      )}

      {!showTable && scope === 'event' && (
        <select
          aria-label="Event"
          value={
            selectedEventId && pitchedEvents.some((item) => item.id === selectedEventId)
              ? selectedEventId
              : ''
          }
          onChange={(e) => setSelectedEventId(e.target.value || null)}
        >
          <option value="" disabled>
            Select event
          </option>
          {pitchedEvents.length === 0 && (
            <option value="" disabled>
              No events with pitches
            </option>
          )}
          {pitchedEvents.map((item) => (
            <option key={item.id} value={item.id}>
              {formatEventTitle(item)} · {formatDate(item.date)}
            </option>
          ))}
        </select>
      )}

      {showTable ? (
        <>
          <p className="scope-caption">Games this season · swipe for more columns</p>
          <PitcherStatsTable rows={tableRows} />
        </>
      ) : (
        <>
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
        </>
      )}

      {!isPlayerView && (
        <BottomNav view="heatmap" onTrack={() => onNavigate('track')} onHeatmap={() => onNavigate('heatmap')} />
      )}

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
