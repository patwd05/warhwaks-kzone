export type EventType = 'practice' | 'game'
export type PitchResult = 'ball' | 'strike'
export type AtBatOutcome = 'walk' | 'k' | 'hbp' | 'hit' | 'error'
export type View = 'home' | 'setup' | 'roster' | 'team-stats' | 'track' | 'heatmap' | 'player-heatmap'
export type HeatmapScope = 'event' | 'practices' | 'games' | 'all'

export const AT_BAT_OUTCOMES: { id: AtBatOutcome; label: string; short: string }[] = [
  { id: 'walk', label: 'Walk', short: 'BB' },
  { id: 'k', label: 'K', short: 'K' },
  { id: 'hbp', label: 'HBP', short: 'HBP' },
  { id: 'hit', label: 'Hit', short: 'H' },
  { id: 'error', label: 'Error', short: 'E' },
]

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

export type AtBat = {
  id: string
  eventId: string
  playerId: string
  outcome: AtBatOutcome
  pitchIds: string[]
  pitches: number
  strikes: number
  balls: number
  createdAt: string
}

export type AppData = {
  players: Player[]
  events: GameEvent[]
  pitches: Pitch[]
  atBats: AtBat[]
  currentEventId: string | null
  currentPlayerId: string | null
  removedEventIds: string[]
  unsyncedEventIds: string[]
  unsyncedPitchIds: string[]
  unsyncedAtBatIds: string[]
}
