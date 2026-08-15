import type { EventType, GameEvent, Pitch, Player } from './types'
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

async function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function fetchRemoteData(): Promise<{
  players: Player[]
  events: GameEvent[]
  pitches: Pitch[]
}> {
  if (!supabase) return { players: [], events: [], pitches: [] }

  const [playersRes, eventsRes, pitchesRes] = await Promise.all([
    supabase.from('players').select('*').order('sort_order', { ascending: true }),
    supabase.from('events').select('*').order('created_at', { ascending: false }),
    supabase.from('pitches').select('*').order('created_at', { ascending: true }),
  ])

  await throwIfError(playersRes.error)
  await throwIfError(eventsRes.error)
  await throwIfError(pitchesRes.error)

  return {
    players: ((playersRes.data ?? []) as PlayerRow[]).map(mapPlayer),
    events: ((eventsRes.data ?? []) as EventRow[]).map(mapEvent),
    pitches: ((pitchesRes.data ?? []) as PitchRow[]).map(mapPitch),
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
  const { error } = await supabase.from('events').insert({
    id: event.id,
    type: event.type,
    event_date: event.date,
    opponent: event.opponent,
    created_at: event.createdAt,
  })
  await throwIfError(error)
}

export async function deleteEvent(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('events').delete().eq('id', id)
  await throwIfError(error)
}

export async function insertPitch(pitch: Pitch): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('pitches').insert({
    id: pitch.id,
    event_id: pitch.eventId,
    player_id: pitch.playerId,
    x: pitch.x,
    y: pitch.y,
    result: pitch.result,
    created_at: pitch.createdAt,
  })
  await throwIfError(error)
}

export async function deletePitch(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('pitches').delete().eq('id', id)
  await throwIfError(error)
}

export function logSyncError(action: string, error: unknown) {
  console.error(`[supabase] ${action} failed`, error)
}
