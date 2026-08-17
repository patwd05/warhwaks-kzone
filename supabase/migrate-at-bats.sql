-- Additive update for an existing Warhawks K-Zone database.
-- Paste into the Supabase SQL Editor and run once.
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS.

create table if not exists public.at_bats (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  outcome text not null check (outcome in ('walk', 'k', 'hbp', 'hit', 'error')),
  pitch_ids uuid[] not null default '{}',
  pitches integer not null default 0,
  strikes integer not null default 0,
  balls integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists at_bats_event_id_idx on public.at_bats (event_id);
create index if not exists at_bats_player_id_idx on public.at_bats (player_id);
create index if not exists at_bats_created_at_idx on public.at_bats (created_at);

alter table public.at_bats enable row level security;
drop policy if exists "at_bats_all" on public.at_bats;
create policy "at_bats_all" on public.at_bats for all using (true) with check (true);
grant select, insert, update, delete on public.at_bats to anon, authenticated;
alter table public.at_bats replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.at_bats;
  exception when duplicate_object then null;
  end;
end $$;
