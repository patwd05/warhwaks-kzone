import { formatDate, formatEventTitle } from './storage'
import type { AtBat, GameEvent, Pitch, Player } from './types'

export type StatKey =
  | 'pitches'
  | 'k'
  | 'kPct'
  | 'walks'
  | 'walkPct'
  | 'strikePct'
  | 'ballPct'
  | 'hitsPerAb'
  | 'pitchesPerBatter'

export type PitcherLine = {
  pitches: number
  strikes: number
  balls: number
  k: number
  walks: number
  hits: number
  atBats: number
  battersFaced: number
  atBatPitches: number
  strikePct: number | null
  ballPct: number | null
  kPct: number | null
  walkPct: number | null
  hitsPerAb: number | null
  pitchesPerBatter: number | null
}

export type GameStatRow = {
  key: string
  label: string
  sublabel: string
  season: boolean
  line: PitcherLine
}

export const STAT_CATEGORIES: { id: StatKey; label: string; short: string }[] = [
  { id: 'pitches', label: 'Pitches', short: 'P' },
  { id: 'k', label: 'Ks', short: 'K' },
  { id: 'kPct', label: 'K%', short: 'K%' },
  { id: 'walks', label: 'Walks', short: 'BB' },
  { id: 'walkPct', label: 'Walk %', short: 'BB%' },
  { id: 'strikePct', label: 'Strike %', short: 'Str%' },
  { id: 'ballPct', label: 'Ball %', short: 'Ball%' },
  { id: 'hitsPerAb', label: 'Hits / AB', short: 'H/AB' },
  { id: 'pitchesPerBatter', label: 'Pitches / batter', short: 'P/B' },
]

function ratio(part: number, whole: number): number | null {
  if (whole <= 0) return null
  return part / whole
}

export function lineFrom(pitches: Pitch[], atBats: AtBat[]): PitcherLine {
  const strikes = pitches.filter((p) => p.result === 'strike').length
  const balls = pitches.filter((p) => p.result === 'ball').length
  const k = atBats.filter((a) => a.outcome === 'k').length
  const walks = atBats.filter((a) => a.outcome === 'walk').length
  const hits = atBats.filter((a) => a.outcome === 'hit').length
  const officialAtBats =
    k + hits + atBats.filter((a) => a.outcome === 'error').length
  const battersFaced = atBats.length
  const atBatPitches = atBats.reduce((sum, atBat) => sum + atBat.pitches, 0)
  return {
    pitches: pitches.length,
    strikes,
    balls,
    k,
    walks,
    hits,
    atBats: officialAtBats,
    battersFaced,
    atBatPitches,
    strikePct: ratio(strikes, pitches.length),
    ballPct: ratio(balls, pitches.length),
    kPct: ratio(k, battersFaced),
    walkPct: ratio(walks, battersFaced),
    hitsPerAb: ratio(hits, officialAtBats),
    pitchesPerBatter: ratio(atBatPitches, battersFaced),
  }
}

export function gameIds(events: GameEvent[]): Set<string> {
  return new Set(events.filter((event) => event.type === 'game').map((event) => event.id))
}

export function playerLine(
  playerId: string,
  pitches: Pitch[],
  atBats: AtBat[],
  eventIds?: Set<string>,
): PitcherLine {
  return lineFrom(
    pitches.filter(
      (p) => p.playerId === playerId && (!eventIds || eventIds.has(p.eventId)),
    ),
    atBats.filter(
      (a) => a.playerId === playerId && (!eventIds || eventIds.has(a.eventId)),
    ),
  )
}

export function playerGameRows(
  playerId: string,
  events: GameEvent[],
  pitches: Pitch[],
  atBats: AtBat[],
): GameStatRow[] {
  const games = [...events]
    .filter((event) => event.type === 'game')
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))

  const rows: GameStatRow[] = []
  for (const event of games) {
    const line = lineFrom(
      pitches.filter((p) => p.playerId === playerId && p.eventId === event.id),
      atBats.filter((a) => a.playerId === playerId && a.eventId === event.id),
    )
    if (line.pitches === 0 && line.battersFaced === 0) continue
    rows.push({
      key: event.id,
      label: formatEventTitle(event),
      sublabel: formatDate(event.date),
      season: false,
      line,
    })
  }

  const season = playerLine(playerId, pitches, atBats, gameIds(events))
  if (season.pitches === 0 && season.battersFaced === 0 && rows.length === 0) return []

  return [
    {
      key: 'season',
      label: 'Season',
      sublabel: `${rows.length} ${rows.length === 1 ? 'game' : 'games'}`,
      season: true,
      line: season,
    },
    ...rows,
  ]
}

export function statValue(line: PitcherLine, key: StatKey): number | null {
  switch (key) {
    case 'pitches':
      return line.pitches
    case 'k':
      return line.k
    case 'kPct':
      return line.kPct
    case 'walks':
      return line.walks
    case 'walkPct':
      return line.walkPct
    case 'strikePct':
      return line.strikePct
    case 'ballPct':
      return line.ballPct
    case 'hitsPerAb':
      return line.hitsPerAb
    case 'pitchesPerBatter':
      return line.pitchesPerBatter
  }
}

export function formatPct(value: number | null): string {
  if (value == null) return '—'
  return `${Math.round(value * 100)}%`
}

export function formatAvg(value: number | null): string {
  if (value == null) return '—'
  const text = value.toFixed(3)
  return value >= 1 ? text : text.slice(1)
}

export function formatRate(value: number | null): string {
  if (value == null) return '—'
  return value.toFixed(1)
}

export function formatStat(line: PitcherLine, key: StatKey): string {
  switch (key) {
    case 'pitches':
    case 'k':
    case 'walks':
      return String(statValue(line, key) ?? 0)
    case 'kPct':
    case 'walkPct':
    case 'strikePct':
    case 'ballPct':
      return formatPct(statValue(line, key))
    case 'hitsPerAb':
      return formatAvg(statValue(line, key))
    case 'pitchesPerBatter':
      return formatRate(statValue(line, key))
  }
}

export function compareStat(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return b - a
}

export function rankPlayers(
  players: Player[],
  pitches: Pitch[],
  atBats: AtBat[],
  events: GameEvent[],
  key: StatKey,
): { player: Player; line: PitcherLine; value: number | null }[] {
  const games = gameIds(events)
  const useAllPitches = key === 'pitches' || key === 'strikePct' || key === 'ballPct'
  return [...players]
    .map((player) => {
      const line = playerLine(player.id, pitches, atBats, useAllPitches ? undefined : games)
      return { player, line, value: statValue(line, key) }
    })
    .filter((row) => row.line.pitches > 0 || row.line.battersFaced > 0)
    .sort((a, b) => compareStat(a.value, b.value) || a.player.name.localeCompare(b.player.name))
}
