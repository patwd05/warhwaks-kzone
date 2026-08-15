import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  deletePitch,
  deletePlayer,
  fetchRemoteData,
  insertEvent,
  insertPitch,
  insertPlayer,
  deleteEvent,
  logSyncError,
} from './api'
import type { AppData, EventType, GameEvent, Pitch, Player } from './types'
import { loadData, newId, saveData } from './storage'
import { isSupabaseConfigured } from './supabase'

type StoreValue = AppData & {
  addPlayer: (name: string) => Player
  removePlayer: (id: string) => void
  createEvent: (input: {
    type: EventType
    date: string
    opponent: string
  }) => GameEvent
  removeEvent: (id: string) => void
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

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    fetchRemoteData()
      .then((remote) => {
        if (cancelled) return
        setData((prev) => {
          const players = remote.players.length > 0 ? remote.players : prev.players
          if (remote.players.length === 0 && prev.players.length > 0) {
            for (const player of prev.players) {
              void insertPlayer(player).catch((error) => logSyncError('seed player', error))
            }
          }
          return persist({
            ...prev,
            players,
            events: remote.events,
            pitches: remote.pitches,
            currentEventId: prev.currentEventId,
            currentPlayerId: prev.currentPlayerId,
          })
        })
      })
      .catch((error) => logSyncError('load', error))
    return () => {
      cancelled = true
    }
  }, [])

  const addPlayer = useCallback((name: string) => {
    const player: Player = {
      id: newId(),
      name: name.trim(),
      sortOrder: Date.now(),
      createdAt: new Date().toISOString(),
    }
    setData((prev) =>
      persist({
        ...prev,
        players: [...prev.players, player],
        currentPlayerId: prev.currentPlayerId ?? player.id,
      }),
    )
    void insertPlayer(player).catch((error) => logSyncError('add player', error))
    return player
  }, [])

  const removePlayer = useCallback((id: string) => {
    setData((prev) =>
      persist({
        ...prev,
        players: prev.players.filter((p) => p.id !== id),
        pitches: prev.pitches.filter((p) => p.playerId !== id),
        currentPlayerId: prev.currentPlayerId === id ? null : prev.currentPlayerId,
      }),
    )
    void deletePlayer(id).catch((error) => logSyncError('remove player', error))
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
      void insertEvent(event).catch((error) => logSyncError('create event', error))
      return event
    },
    [],
  )

  const removeEvent = useCallback((id: string) => {
    setData((prev) =>
      persist({
        ...prev,
        events: prev.events.filter((e) => e.id !== id),
        pitches: prev.pitches.filter((p) => p.eventId !== id),
        currentEventId: prev.currentEventId === id ? null : prev.currentEventId,
      }),
    )
    void deleteEvent(id).catch((error) => logSyncError('remove event', error))
  }, [])

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
      void insertPitch(pitch).catch((error) => logSyncError('add pitch', error))
      return pitch
    },
    [],
  )

  const undoLastPitch = useCallback((eventId: string, playerId: string) => {
    let removedId: string | null = null
    setData((prev) => {
      const pitches = [...prev.pitches]
      for (let i = pitches.length - 1; i >= 0; i--) {
        const p = pitches[i]
        if (p && p.eventId === eventId && p.playerId === playerId) {
          removedId = p.id
          pitches.splice(i, 1)
          break
        }
      }
      if (!removedId) return prev
      return persist({ ...prev, pitches })
    })
    if (removedId) {
      void deletePitch(removedId).catch((error) => logSyncError('undo pitch', error))
    }
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
      players: [...data.players].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
      ),
      addPlayer,
      removePlayer,
      createEvent,
      removeEvent,
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
      removeEvent,
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
