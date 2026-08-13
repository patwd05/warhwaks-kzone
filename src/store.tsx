import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppData, EventType, GameEvent, Pitch, Player } from './types'
import { loadData, newId, saveData } from './storage'

type StoreValue = AppData & {
  addPlayer: (name: string) => Player
  removePlayer: (id: string) => void
  createEvent: (input: {
    type: EventType
    date: string
    opponent: string
  }) => GameEvent
  addPitch: (input: {
    eventId: string
    playerId: string
    x: number
    y: number
    result: Pitch['result']
  }) => Pitch
  undoLastPitch: (eventId: string, playerId: string) => void
  setCurrentEventId: (id: string | null) => void
  setCurrentPlayerId: (id: string | null) => void
}

const StoreContext = createContext<StoreValue | null>(null)

function persist(next: AppData) {
  saveData(next)
  return next
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData())

  const addPlayer = useCallback((name: string) => {
    const player: Player = {
      id: newId(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    }
    setData((prev) =>
      persist({
        ...prev,
        players: [...prev.players, player],
        currentPlayerId: prev.currentPlayerId ?? player.id,
      }),
    )
    return player
  }, [])

  const removePlayer = useCallback((id: string) => {
    setData((prev) =>
      persist({
        ...prev,
        players: prev.players.filter((p) => p.id !== id),
        currentPlayerId:
          prev.currentPlayerId === id ? null : prev.currentPlayerId,
      }),
    )
  }, [])

  const createEvent = useCallback(
    (input: { type: EventType; date: string; opponent: string }) => {
      const event: GameEvent = {
        id: newId(),
        type: input.type,
        date: input.date,
        opponent: input.opponent.trim(),
        createdAt: new Date().toISOString(),
      }
      setData((prev) =>
        persist({
          ...prev,
          events: [event, ...prev.events],
          currentEventId: event.id,
        }),
      )
      return event
    },
    [],
  )

  const addPitch = useCallback(
    (input: {
      eventId: string
      playerId: string
      x: number
      y: number
      result: Pitch['result']
    }) => {
      const pitch: Pitch = {
        id: newId(),
        eventId: input.eventId,
        playerId: input.playerId,
        x: input.x,
        y: input.y,
        result: input.result,
        createdAt: new Date().toISOString(),
      }
      setData((prev) => persist({ ...prev, pitches: [...prev.pitches, pitch] }))
      return pitch
    },
    [],
  )

  const undoLastPitch = useCallback((eventId: string, playerId: string) => {
    setData((prev) => {
      let removed = false
      const pitches = [...prev.pitches]
      for (let i = pitches.length - 1; i >= 0; i--) {
        const p = pitches[i]
        if (p && p.eventId === eventId && p.playerId === playerId) {
          pitches.splice(i, 1)
          removed = true
          break
        }
      }
      if (!removed) return prev
      return persist({ ...prev, pitches })
    })
  }, [])

  const setCurrentEventId = useCallback((id: string | null) => {
    setData((prev) => persist({ ...prev, currentEventId: id }))
  }, [])

  const setCurrentPlayerId = useCallback((id: string | null) => {
    setData((prev) => persist({ ...prev, currentPlayerId: id }))
  }, [])

  const value = useMemo<StoreValue>(
    () => ({
      ...data,
      addPlayer,
      removePlayer,
      createEvent,
      addPitch,
      undoLastPitch,
      setCurrentEventId,
      setCurrentPlayerId,
    }),
    [
      data,
      addPlayer,
      removePlayer,
      createEvent,
      addPitch,
      undoLastPitch,
      setCurrentEventId,
      setCurrentPlayerId,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
