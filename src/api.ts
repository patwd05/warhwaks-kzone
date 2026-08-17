import type { AtBat, AtBatOutcome, EventType, GameEvent, Pitch, Player } from './types'
import { supabase } from './supabase'

type PlayerRow = {
  id: string
  name: string
  sort_order: number
  created_at: string
}

type EventRow = {
  id: string
  type: EventType
  event_date: string
  opponent: string
  created_at: string
}

type PitchRow = {
  id: string
  event_id: string
  player_id: string
  x: number
  y: number
  result: Pitch['result']
  created_at: string
}

type AtBatRow = {
  id: string
  event_id: string
  player_id: string
  outcome: AtBatOutcome
  pitch_ids: string[] | null
  pitches: number
  strikes: number
  balls: number
  created_at: string
}

function mapPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }
}

function mapEvent(row: EventRow): GameEvent {
  return {
    id: row.id,
    type: row.type,
    date: row.event_date,
    opponent: row.opponent,
    createdAt: row.created_at,
  }
}

function mapPitch(row: PitchRow): Pitch {
  return {
    id: row.id,
    eventId: row.event_id,
    playerId: row.player_id,
    x: row.x,
    y: row.y,
    result: row.result,
    createdAt: row.created_at,
  }
}

function mapAtBat(row: AtBatRow): AtBat {
  return {
    id: row.id,
    eventId: row.event_id,
    playerId: row.player_id,
    outcome: row.outcome,
    pitchIds: row.pitch_ids ?? [],
    pitches: row.pitches,
    strikes: row.strikes,
    balls: row.balls,
    createdAt: row.created_at,
  }
}

function isMissingRelation(error: { message: string; code?: string } | null): boolean {
  if (!error) return false
  const msg = error.message.toLowerCase()
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table')
  )
}

async function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function fetchRemoteData(): Promise<{
  players: Player[]
  events: GameEvent[]
  pitches: Pitch[]
  atBats: AtBat[]
}> {
  if (!supabase) return { players: [], events: [], pitches: [], atBats: [] }

  const [playersRes, eventsRes, pitchesRes, atBatsRes] = await Promise.all([
    supabase.from('players').select('*').order('sort_order', { ascending: true }),
    supabase.from('events').select('*').order('created_at', { ascending: false }),
    supabase.from('pitches').select('*').order('created_at', { ascending: true }),
    supabase.from('at_bats').select('*').order('created_at', { ascending: true }),
  ])

  await throwIfError(playersRes.error)
  await throwIfError(eventsRes.error)
  await throwIfError(pitchesRes.error)
  if (atBatsRes.error && !isMissingRelation(atBatsRes.error)) {
    await throwIfError(atBatsRes.error)
  }

  return {
    players: ((playersRes.data ?? []) as PlayerRow[]).map(mapPlayer),
    events: ((eventsRes.data ?? []) as EventRow[]).map(mapEvent),
    pitches: ((pitchesRes.data ?? []) as PitchRow[]).map(mapPitch),
    atBats: atBatsRes.error ? [] : ((atBatsRes.data ?? []) as AtBatRow[]).map(mapAtBat),
  }
}

export async function insertPlayer(player: Player): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('players').insert({
    id: player.id,
    name: player.name,
    sort_order: player.sortOrder,
    created_at: player.createdAt,
  })
  await throwIfError(error)
}

export async function deletePlayer(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('players').delete().eq('id', id)
  await throwIfError(error)
}

export async function insertEvent(event: GameEvent): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('events').upsert(
    {
      id: event.id,
      type: event.type,
      event_date: event.date,
      opponent: event.opponent,
      created_at: event.createdAt,
    },
    { onConflict: 'id' },
  )
  await throwIfError(error)
}

export async function deleteEvent(id: string): Promise<void> {
  if (!supabase) return
  const atBatsRes = await supabase.from('at_bats').delete().eq('event_id', id)
  if (atBatsRes.error && !isMissingRelation(atBatsRes.error)) await throwIfError(atBatsRes.error)
  const pitchesRes = await supabase.from('pitches').delete().eq('event_id', id)
  await throwIfError(pitchesRes.error)
  const eventsRes = await supabase.from('events').delete().eq('id', id)
  await throwIfError(eventsRes.error)
}

export async function insertPitch(pitch: Pitch): Promise<void> {
  if (!supabase) return

  let lastMessage = 'Could not save pitch'
  for (let attempt = 0; attempt < 4; attempt++) {
    const { error } = await supabase.from('pitches').insert({
      id: pitch.id,
      event_id: pitch.eventId,
      player_id: pitch.playerId,
      x: pitch.x,
      y: pitch.y,
      result: pitch.result,
      created_at: pitch.createdAt,
    })
    if (!error) return
    lastMessage = error.message
    const retryable = error.message.includes('foreign key') || error.code === '23503'
    if (!retryable || attempt === 3) break
    await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)))
  }
  throw new Error(lastMessage)
}

export async function deletePitch(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('pitches').delete().eq('id', id)
  await throwIfError(error)
}

export async function insertAtBat(atBat: AtBat): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('at_bats').upsert(
    {
      id: atBat.id,
      event_id: atBat.eventId,
      player_id: atBat.playerId,
      outcome: atBat.outcome,
      pitch_ids: atBat.pitchIds,
      pitches: atBat.pitches,
      strikes: atBat.strikes,
      balls: atBat.balls,
      created_at: atBat.createdAt,
    },
    { onConflict: 'id' },
  )
  if (error && isMissingRelation(error)) {
    throw new Error('Run the at_bats SQL in supabase/schema.sql, then refresh.')
  }
  await throwIfError(error)
}

export async function deleteAtBat(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('at_bats').delete().eq('id', id)
  if (error && isMissingRelation(error)) return
  await throwIfError(error)
}

export function logSyncError(action: string, error: unknown) {
  console.error(`[supabase] ${action} failed`, error)
}
