import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { Baseball } from '../components/Baseball'
import { AddPlayerSheet } from '../components/AddPlayerSheet'
import { BottomNav } from '../components/BottomNav'
import { Field } from '../components/Field'
import { PlayerSelect } from '../components/PlayerSelect'
import { StatsBar } from '../components/StatsBar'
import { clamp01, FIELD, isInStrikeZone } from '../field'
import { formatDate } from '../storage'
import { useStore } from '../store'
import type { PitchResult, View } from '../types'

type Props = {
  onNavigate: (view: View) => void
}

const RESET_MS = 1000
const TOUCH_LIFT = 52

export function TrackScreen({ onNavigate }: Props) {
  const {
    players,
    events,
    pitches,
    currentEventId,
    currentPlayerId,
    addPlayer,
    addPitch,
    undoLastPitch,
    setCurrentPlayerId,
  } = useStore()

  const fieldRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(FIELD.ballStart)
  const [dragging, setDragging] = useState(false)
  const [locked, setLocked] = useState(false)
  const [result, setResult] = useState<PitchResult | null>(null)
  const [zoneMode, setZoneMode] = useState<'idle' | PitchResult>('idle')
  const [adding, setAdding] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const pointerType = useRef<'mouse' | 'touch' | 'pen'>('mouse')
  const resetTimer = useRef<number | null>(null)
  const draggingRef = useRef(false)

  useEffect(() => {
    return () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current)
    }
  }, [])

  const event = events.find((e) => e.id === currentEventId)
  const playerPitches = useMemo(
    () =>
      pitches.filter(
        (p) => p.eventId === currentEventId && p.playerId === currentPlayerId,
      ),
    [pitches, currentEventId, currentPlayerId],
  )
  const strikes = playerPitches.filter((p) => p.result === 'strike').length
  const balls = playerPitches.filter((p) => p.result === 'ball').length

  const eventTitle = event
    ? event.type === 'game'
      ? event.opponent
        ? `vs ${event.opponent}`
        : 'Game'
      : event.opponent || 'Practice'
    : 'Event'

  const pointFromEvent = useCallback((e: PointerEvent) => {
    const field = fieldRef.current
    if (!field) return FIELD.ballStart
    const rect = field.getBoundingClientRect()
    const lift = pointerType.current === 'mouse' ? 0 : TOUCH_LIFT
    const x = (e.clientX - rect.left - dragOffset.current.x) / rect.width
    const y = (e.clientY - rect.top - dragOffset.current.y - lift) / rect.height
    return { x: clamp01(x), y: clamp01(y) }
  }, [])

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (locked || !currentPlayerId) {
      if (!currentPlayerId) setAdding(true)
      return
    }
    e.preventDefault()
    pointerType.current = e.pointerType === 'touch' ? 'touch' : e.pointerType === 'pen' ? 'pen' : 'mouse'
    const field = fieldRef.current
    if (!field) return
    const rect = field.getBoundingClientRect()
    const ballX = pos.x * rect.width
    const ballY = pos.y * rect.height
    dragOffset.current = {
      x: e.clientX - rect.left - ballX,
      y: e.clientY - rect.top - ballY,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingRef.current = true
    setDragging(true)
    const next = pointFromEvent(e)
    setPos(next)
    setZoneMode(isInStrikeZone(next.x, next.y) ? 'strike' : 'ball')
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || locked) return
    const next = pointFromEvent(e)
    setPos(next)
    setZoneMode(isInStrikeZone(next.x, next.y) ? 'strike' : 'ball')
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || locked) return
    draggingRef.current = false
    e.stopPropagation()
    const next = pointFromEvent(e)
    const call: PitchResult = isInStrikeZone(next.x, next.y) ? 'strike' : 'ball'
    setPos(next)
    setDragging(false)
    setLocked(true)
    setResult(call)
    setZoneMode(call)

    if (currentEventId && currentPlayerId) {
      addPitch({
        eventId: currentEventId,
        playerId: currentPlayerId,
        x: next.x,
        y: next.y,
        result: call,
      })
    }

    try {
      navigator.vibrate?.(call === 'strike' ? 18 : 8)
    } catch {
      /* ignore */
    }

    resetTimer.current = window.setTimeout(() => {
      setResult(null)
      setZoneMode('idle')
      setPos(FIELD.ballStart)
      setLocked(false)
    }, RESET_MS)
  }

  if (!event) {
    return (
      <div className="screen">
        <p className="empty-copy">No event selected.</p>
        <button type="button" className="btn btn-primary" onClick={() => onNavigate('home')}>
          Home
        </button>
      </div>
    )
  }

  return (
    <div className="screen screen-session">
      <header className="session-header">
        <button type="button" className="back-btn" onClick={() => onNavigate('home')}>
          Home
        </button>
        <div className="session-title">
          <strong>{eventTitle}</strong>
          <span>
            {event.type} · {formatDate(event.date)}
          </span>
        </div>
        <button
          type="button"
          className="back-btn"
          disabled={!currentPlayerId || playerPitches.length === 0 || locked}
          onClick={() => {
            if (currentEventId && currentPlayerId) undoLastPitch(currentEventId, currentPlayerId)
          }}
        >
          Undo
        </button>
      </header>

      <PlayerSelect
        players={players}
        value={currentPlayerId}
        onChange={setCurrentPlayerId}
        onAddPlayer={() => setAdding(true)}
      />

      <StatsBar pitches={playerPitches.length} strikes={strikes} balls={balls} />

      <div className="field-wrap" ref={fieldRef}>
        <Field zoneMode={dragging || result ? zoneMode : 'idle'}>
          <Baseball
            x={pos.x}
            y={pos.y}
            dragging={dragging}
            locked={locked}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        </Field>
        {result && (
          <div className={`call-banner call-banner--${result}`} role="status">
            {result === 'strike' ? 'STRIKE' : 'BALL'}
          </div>
        )}
        {!currentPlayerId && (
          <p className="field-hint">Select a player, then drag the ball to the pitch.</p>
        )}
        {currentPlayerId && !dragging && !result && (
          <p className="field-hint">Drag the ball to where the pitch crossed.</p>
        )}
      </div>

      <BottomNav view="track" onTrack={() => onNavigate('track')} onHeatmap={() => onNavigate('heatmap')} />

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
