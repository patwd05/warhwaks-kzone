import type { AppData, AtBat, Pitch, Player } from './types'
import { DEFAULT_ROSTER } from './roster'

export const STORAGE_KEY = 'kzone-data-v1'

const empty: AppData = {
  players: [],
  events: [],
  pitches: [],
  atBats: [],
  currentEventId: null,
  currentPlayerId: null,
  removedEventIds: [],
  unsyncedEventIds: [],
  unsyncedPitchIds: [],
  unsyncedAtBatIds: [],
}

export function newId(): string {
  return crypto.randomUUID()
}

export function seedPlayers(existing: Player[] = []): Player[] {
  const have = new Set(existing.map((p) => p.name.toLowerCase()))
  const maxOrder = existing.reduce((max, p) => Math.max(max, p.sortOrder), 0)
  const added: Player[] = []
  DEFAULT_ROSTER.forEach((name, index) => {
    if (have.has(name.toLowerCase())) return
    added.push({
      id: newId(),
      name,
      sortOrder: maxOrder + index + 1,
      createdAt: new Date().toISOString(),
    })
  })
  return [...existing, ...added].sort((a, b) => a.name.localeCompare(b.name))
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { ...empty, players: seedPlayers() }
    }
    const parsed = JSON.parse(raw) as Partial<AppData>
    const players = seedPlayers(
      (parsed.players ?? []).map((p) => ({
        ...p,
        sortOrder: p.sortOrder ?? 0,
      })),
    )
    return {
      players,
      events: parsed.events ?? [],
      pitches: parsed.pitches ?? [],
      atBats: parsed.atBats ?? [],
      currentEventId: parsed.currentEventId ?? null,
      currentPlayerId: parsed.currentPlayerId ?? null,
      removedEventIds: parsed.removedEventIds ?? [],
      unsyncedEventIds: parsed.unsyncedEventIds ?? [],
      unsyncedPitchIds: parsed.unsyncedPitchIds ?? [],
      unsyncedAtBatIds: parsed.unsyncedAtBatIds ?? [],
    }
  } catch {
    return { ...empty, players: seedPlayers() }
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function todayInputValue(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, d ?? 1)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatEventTitle(event: { type: 'practice' | 'game'; opponent: string }): string {
  if (event.type === 'game') return event.opponent ? `vs ${event.opponent}` : 'Game'
  return event.opponent ? `Practice · ${event.opponent}` : 'Practice'
}

export function claimedPitchIds(atBats: AtBat[], eventId: string, playerId: string): Set<string> {
  const claimed = new Set<string>()
  for (const atBat of atBats) {
    if (atBat.eventId !== eventId || atBat.playerId !== playerId) continue
    for (const id of atBat.pitchIds) claimed.add(id)
  }
  return claimed
}

export function currentAtBatPitches(
  pitches: Pitch[],
  atBats: AtBat[],
  eventId: string,
  playerId: string,
): Pitch[] {
  const claimed = claimedPitchIds(atBats, eventId, playerId)
  return pitches.filter(
    (p) => p.eventId === eventId && p.playerId === playerId && !claimed.has(p.id),
  )
}
