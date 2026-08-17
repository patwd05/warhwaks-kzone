import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { AtBatBar } from '../components/AtBatBar'
import { Baseball } from '../components/Baseball'
import { AddPlayerSheet } from '../components/AddPlayerSheet'
import { BottomNav } from '../components/BottomNav'
import { Field } from '../components/Field'
import { PlayerSelect } from '../components/PlayerSelect'
import { StatsBar } from '../components/StatsBar'
import { clamp01, FIELD, isInStrikeZone } from '../field'
import { currentAtBatPitches, formatDate } from '../storage'
import { useStore } from '../store'
import { AT_BAT_OUTCOMES, type AtBatOutcome, type PitchResult, type View } from '../types'

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
    atBats = [],
    currentEventId,
    currentPlayerId,
    addPlayer,
    addPitch,
    undoLastPitch,
    completeAtBat,
    setCurrentPlayerId,
    cloudError,
  } = useStore()

  const fieldRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(FIELD.ballStart)
  const [dragging, setDragging] = useState(false)
  const [locked, setLocked] = useState(false)
  const [result, setResult] = useState<PitchResult | null>(null)
  const [atBatResult, setAtBatResult] = useState<AtBatOutcome | null>(null)
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
  const selectedPlayerId = players.some((p) => p.id === currentPlayerId)
    ? currentPlayerId
    : null
  const playerPitches = useMemo(
    () =>
      pitches.filter(
        (p) => p.eventId === currentEventId && p.playerId === selectedPlayerId,
      ),
    [pitches, currentEventId, selectedPlayerId],
  )
  const strikes = playerPitches.filter((p) => p.result === 'strike').length
  const balls = playerPitches.filter((p) => p.result === 'ball').length
  const isGame = event?.type === 'game'
  const pitcherAtBats = useMemo(
    () =>
      atBats
        .filter((ab) => ab.eventId === currentEventId && ab.playerId === selectedPlayerId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [atBats, currentEventId, selectedPlayerId],
  )
  const atBatPitches = useMemo(
    () =>
      currentEventId && selectedPlayerId
        ? currentAtBatPitches(pitches, atBats, currentEventId, selectedPlayerId)
        : [],
    [pitches, atBats, currentEventId, selectedPlayerId],
  )
  const atBatStrikes = atBatPitches.filter((p) => p.result === 'strike').length
  const atBatBalls = atBatPitches.filter((p) => p.result === 'ball').length
  const lastOutcome = pitcherAtBats[pitcherAtBats.length - 1]?.outcome
  const lastOutcomeLabel = lastOutcome
    ? AT_BAT_OUTCOMES.find((item) => item.id === lastOutcome)?.short
    : null
  const canUndo = Boolean(
    selectedPlayerId &&
      !locked &&
      (isGame ? atBatPitches.length > 0 || pitcherAtBats.length > 0 : playerPitches.length > 0),
  )

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
    if (locked || !selectedPlayerId) return
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

    if (currentEventId && selectedPlayerId) {
      addPitch({
        eventId: currentEventId,
        playerId: selectedPlayerId,
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
    <div className={`screen screen-session${isGame ? ' screen-session--game' : ''}`}>
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
          disabled={!canUndo}
          onClick={() => {
            if (currentEventId && selectedPlayerId) undoLastPitch(currentEventId, selectedPlayerId)
          }}
        >
          Undo
        </button>
      </header>

      <PlayerSelect
        players={players}
        value={selectedPlayerId}
        onChange={setCurrentPlayerId}
        onAddPlayer={() => setAdding(true)}
      />

      <StatsBar
        pitches={playerPitches.length}
        strikes={strikes}
        balls={balls}
        atBat={
          isGame
            ? {
                number: pitcherAtBats.length + 1,
                pitches: atBatPitches.length,
                strikes: atBatStrikes,
                balls: atBatBalls,
                lastOutcome: lastOutcomeLabel,
              }
            : null
        }
      />
      {cloudError && <p className="cloud-error">{cloudError}</p>}

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
        {atBatResult && !result && (
          <div className={`call-banner call-banner--atbat call-banner--${atBatResult}`} role="status">
            {AT_BAT_OUTCOMES.find((item) => item.id === atBatResult)?.label.toUpperCase()}
          </div>
        )}
        {!selectedPlayerId && (
          <p className="field-hint">Select a Pitcher, then drag the ball to the pitch.</p>
        )}
        {selectedPlayerId && !dragging && !result && !atBatResult && (
          <p className="field-hint">
            {isGame
              ? 'Drag the pitch, then mark Walk, K, HBP, Hit, or Error.'
              : 'Drag the ball to where the pitch crossed.'}
          </p>
        )}
      </div>

      {isGame && (
        <AtBatBar
          disabled={!selectedPlayerId}
          onSelect={(outcome) => {
            if (!currentEventId || !selectedPlayerId) return
            completeAtBat({
              eventId: currentEventId,
              playerId: selectedPlayerId,
              outcome,
            })
            setAtBatResult(outcome)
            try {
              navigator.vibrate?.(24)
            } catch {
              /* ignore */
            }
            window.setTimeout(() => setAtBatResult(null), 800)
          }}
        />
      )}

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
