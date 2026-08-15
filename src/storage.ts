import type { AppData, Player } from './types'
import { DEFAULT_ROSTER } from './roster'

export const STORAGE_KEY = 'kzone-data-v1'

const empty: AppData = {
  players: [],
  events: [],
  pitches: [],
  currentEventId: null,
  currentPlayerId: null,
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
  return [...existing, ...added].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
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
      currentEventId: parsed.currentEventId ?? null,
      currentPlayerId: parsed.currentPlayerId ?? null,
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
