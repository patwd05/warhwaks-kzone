export type EventType = 'practice' | 'game'
export type PitchResult = 'ball' | 'strike'
export type View = 'home' | 'setup' | 'roster' | 'track' | 'heatmap' | 'player-heatmap'
export type HeatmapScope = 'event' | 'practices' | 'games' | 'all'

export type Player = {
  id: string
  name: string
  sortOrder: number
  createdAt: string
}

export type GameEvent = {
  id: string
  type: EventType
  date: string
  opponent: string
  createdAt: string
}

export type Pitch = {
  id: string
  eventId: string
  playerId: string
  x: number
  y: number
  result: PitchResult
  createdAt: string
}

export type AppData = {
  players: Player[]
  events: GameEvent[]
  pitches: Pitch[]
  currentEventId: string | null
  currentPlayerId: string | null
  removedEventIds: string[]
  unsyncedEventIds: string[]
  unsyncedPitchIds: string[]
}
