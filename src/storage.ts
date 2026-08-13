import type { AppData } from './types'

/** Local persistence. Replace loadData/saveData with Supabase queries later. */

export const STORAGE_KEY = 'kzone-data-v1'

const empty: AppData = {
  players: [],
  events: [],
  pitches: [],
  currentEventId: null,
  currentPlayerId: null,
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as Partial<AppData>
    return {
      players: parsed.players ?? [],
      events: parsed.events ?? [],
      pitches: parsed.pitches ?? [],
      currentEventId: parsed.currentEventId ?? null,
      currentPlayerId: parsed.currentPlayerId ?? null,
    }
  } catch {
    return empty
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function newId(): string {
  return crypto.randomUUID()
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
