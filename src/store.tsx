import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import { loadData, newId, saveData, todayInputValue } from './storage'
import { isSupabaseConfigured, supabase } from './supabase'

export type CloudStatus = 'off' | 'connecting' | 'on' | 'error'

type RemoteData = {
  players: Player[]
  events: GameEvent[]
  pitches: Pitch[]
}

type StoreValue = AppData & {
  cloudStatus: CloudStatus
  cloudError: string | null
  refreshCloud: () => void
  addPlayer: (name: string) => Player
  removePlayer: (id: string) => void
  createEvent: (input: {
    type: EventType
    date: string
    opponent: string
  }) => Promise<GameEvent>
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

const eventSaveQueue = new Map<string, Promise<void>>()

function applyRemote(prev: AppData, remote: RemoteData): AppData {
  const removed = new Set(prev.removedEventIds ?? [])
  const unsyncedEvents = new Set(prev.unsyncedEventIds ?? [])
  const unsyncedPitches = new Set(prev.unsyncedPitchIds ?? [])
  const inFlightEventIds = new Set(eventSaveQueue.keys())
  const players = remote.players.length > 0 ? remote.players : prev.players

  let currentPlayerId = prev.currentPlayerId
  if (
    remote.players.length > 0 &&
    currentPlayerId &&
    !remote.players.some((p) => p.id === currentPlayerId)
  ) {
    const previous = prev.players.find((p) => p.id === currentPlayerId)
    currentPlayerId =
      remote.players.find((p) => p.name.toLowerCase() === previous?.name.toLowerCase())?.id ??
      null
  }

  const remoteEvents = remote.events.filter((e) => !removed.has(e.id))
  const remotePitches = remote.pitches.filter((p) => !removed.has(p.eventId))
  const remoteEventIds = new Set(remoteEvents.map((e) => e.id))
  const remotePitchIds = new Set(remotePitches.map((p) => p.id))

  // Keep local-only rows that this device created and has not confirmed on the server.
  // Do not keep cached copies of events that used to exist remotely — those were deleted.
  const pendingEvents = prev.events.filter(
    (e) =>
      !remoteEventIds.has(e.id) &&
      !removed.has(e.id) &&
      (inFlightEventIds.has(e.id) || unsyncedEvents.has(e.id)),
  )
  const events = [...pendingEvents, ...remoteEvents]
  const eventIds = new Set(events.map((e) => e.id))

  const pendingPitches = prev.pitches.filter(
    (p) =>
      !remotePitchIds.has(p.id) &&
      !removed.has(p.eventId) &&
      eventIds.has(p.eventId) &&
      unsyncedPitches.has(p.id),
  )
  const pitches = [...remotePitches, ...pendingPitches]

  const removedEventIds = [...removed].filter(
    (id) =>
      remote.events.some((e) => e.id === id) || remote.pitches.some((p) => p.eventId === id),
  )

  let currentEventId = prev.currentEventId
  if (currentEventId && !eventIds.has(currentEventId)) {
    currentEventId = null
  }

  return persist({
    ...prev,
    players,
    events,
    pitches,
    currentPlayerId,
    currentEventId,
    removedEventIds,
    unsyncedEventIds: [...unsyncedEvents].filter((id) => !remoteEventIds.has(id) && eventIds.has(id)),
    unsyncedPitchIds: [...unsyncedPitches].filter(
      (id) => !remotePitchIds.has(id) && pitches.some((p) => p.id === id),
    ),
  })
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Cloud sync failed'
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => {
    const local = loadData()
    if (!isSupabaseConfigured) return local
    return {
      ...local,
      players: [],
      currentPlayerId: null,
    }
  })
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>(
    isSupabaseConfigured ? 'connecting' : 'off',
  )
  const [cloudError, setCloudError] = useState<string | null>(null)
  const dataRef = useRef(data)
  dataRef.current = data

  const refreshCloud = useCallback(() => {
    if (!isSupabaseConfigured) return
    setCloudStatus((status) => (status === 'off' ? 'off' : 'connecting'))
    fetchRemoteData()
      .then((remote) => {
        let unsyncedToPush: GameEvent[] = []
        let unsyncedPitchesToPush: Pitch[] = []
        setData((prev) => {
          const next = applyRemote(prev, remote)
          unsyncedToPush = next.events.filter((event) => next.unsyncedEventIds.includes(event.id))
          unsyncedPitchesToPush = next.pitches.filter((pitch) =>
            next.unsyncedPitchIds.includes(pitch.id),
          )
          for (const id of next.removedEventIds) {
            void deleteEvent(id).catch((error) => logSyncError('remove event', error))
          }
          return next
        })
        for (const event of unsyncedToPush) {
          void insertEvent(event)
            .then(() => {
              setData((prev) =>
                persist({
                  ...prev,
                  unsyncedEventIds: prev.unsyncedEventIds.filter((id) => id !== event.id),
                }),
              )
            })
            .catch((error) => logSyncError('sync event', error))
        }
        for (const pitch of unsyncedPitchesToPush) {
          void insertPitch(pitch)
            .then(() => {
              setData((prev) =>
                persist({
                  ...prev,
                  unsyncedPitchIds: prev.unsyncedPitchIds.filter((id) => id !== pitch.id),
                }),
              )
            })
            .catch((error) => logSyncError('sync pitch', error))
        }
        setCloudStatus('on')
        setCloudError(null)
      })
      .catch((error) => {
        logSyncError('load', error)
        setCloudStatus('error')
        setCloudError(errorMessage(error))
      })
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    const client = supabase

    refreshCloud()

    const onVis = () => {
      if (document.visibilityState === 'visible') refreshCloud()
    }
    window.addEventListener('focus', refreshCloud)
    document.addEventListener('visibilitychange', onVis)

    const channel = client
      .channel('kzone-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, refreshCloud)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pitches' }, refreshCloud)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, refreshCloud)
      .subscribe()

    return () => {
      window.removeEventListener('focus', refreshCloud)
      document.removeEventListener('visibilitychange', onVis)
      void client.removeChannel(channel)
    }
  }, [refreshCloud])

  const addPlayer = useCallback((name: string) => {
    const player: Player = {
      id: newId(),
      name: name.trim(),
      sortOrder: Date.now() % 1_000_000,
      createdAt: new Date().toISOString(),
    }
    setData((prev) => {
      const maxOrder = prev.players.reduce((max, p) => Math.max(max, p.sortOrder), 0)
      const nextPlayer = { ...player, sortOrder: maxOrder + 1 }
      player.sortOrder = nextPlayer.sortOrder
      return persist({
        ...prev,
        players: [...prev.players, nextPlayer],
        currentPlayerId: prev.currentPlayerId ?? nextPlayer.id,
      })
    })
    void insertPlayer(player).catch((error) => {
      logSyncError('add player', error)
      setCloudError(errorMessage(error))
    })
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
    void deletePlayer(id).catch((error) => {
      logSyncError('remove player', error)
      setCloudError(errorMessage(error))
    })
  }, [])

  const createEvent = useCallback(
    async (input: { type: EventType; date: string; opponent: string }) => {
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
          currentPlayerId: null,
          unsyncedEventIds: prev.unsyncedEventIds.includes(event.id)
            ? prev.unsyncedEventIds
            : [...prev.unsyncedEventIds, event.id],
        }),
      )
      const save = insertEvent(event)
      eventSaveQueue.set(event.id, save)
      try {
        await save
        setData((prev) =>
          persist({
            ...prev,
            unsyncedEventIds: prev.unsyncedEventIds.filter((id) => id !== event.id),
          }),
        )
        setCloudError(null)
      } catch (error) {
        logSyncError('create event', error)
        setCloudError(errorMessage(error))
        throw error
      } finally {
        eventSaveQueue.delete(event.id)
      }
      return event
    },
    [],
  )

  const removeEvent = useCallback((id: string) => {
    eventSaveQueue.delete(id)
    setData((prev) =>
      persist({
        ...prev,
        events: prev.events.filter((e) => e.id !== id),
        pitches: prev.pitches.filter((p) => p.eventId !== id),
        currentEventId: prev.currentEventId === id ? null : prev.currentEventId,
        removedEventIds: prev.removedEventIds.includes(id)
          ? prev.removedEventIds
          : [...prev.removedEventIds, id],
        unsyncedEventIds: prev.unsyncedEventIds.filter((eventId) => eventId !== id),
        unsyncedPitchIds: prev.unsyncedPitchIds.filter(
          (pitchId) => !prev.pitches.some((p) => p.id === pitchId && p.eventId === id),
        ),
      }),
    )
    void deleteEvent(id).catch((error) => {
      logSyncError('remove event', error)
      setCloudError(errorMessage(error))
    })
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
      setData((prev) =>
        persist({
          ...prev,
          pitches: [...prev.pitches, pitch],
          unsyncedPitchIds: prev.unsyncedPitchIds.includes(pitch.id)
            ? prev.unsyncedPitchIds
            : [...prev.unsyncedPitchIds, pitch.id],
        }),
      )
      void (async () => {
        try {
          if (dataRef.current.removedEventIds.includes(pitch.eventId)) return
          const pendingEvent = eventSaveQueue.get(pitch.eventId)
          if (pendingEvent) await pendingEvent
          if (dataRef.current.removedEventIds.includes(pitch.eventId)) return
          if (!dataRef.current.events.some((item) => item.id === pitch.eventId)) return
          const event = dataRef.current.events.find((item) => item.id === pitch.eventId)
          if (
            event &&
            (eventSaveQueue.has(event.id) || dataRef.current.unsyncedEventIds.includes(event.id))
          ) {
            await insertEvent({
              ...event,
              date: event.date || todayInputValue(),
            })
          }
          if (dataRef.current.removedEventIds.includes(pitch.eventId)) return
          if (!dataRef.current.events.some((item) => item.id === pitch.eventId)) return
          await insertPitch(pitch)
          setData((prev) =>
            persist({
              ...prev,
              unsyncedPitchIds: prev.unsyncedPitchIds.filter((id) => id !== pitch.id),
            }),
          )
          setCloudError(null)
        } catch (error) {
          logSyncError('add pitch', error)
          setCloudError(errorMessage(error))
        }
      })()
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
      return persist({
        ...prev,
        pitches,
        unsyncedPitchIds: prev.unsyncedPitchIds.filter((id) => id !== removedId),
      })
    })
    if (removedId) {
      void deletePitch(removedId).catch((error) => {
        logSyncError('undo pitch', error)
        setCloudError(errorMessage(error))
      })
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
      cloudStatus,
      cloudError,
      refreshCloud,
      players: [...data.players].sort((a, b) => a.name.localeCompare(b.name)),
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
      cloudStatus,
      cloudError,
      refreshCloud,
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
