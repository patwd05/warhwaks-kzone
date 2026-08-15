-- Warhawks K-Zone
-- Paste this into the Supabase SQL Editor and run it.

create extension if not exists pgcrypto;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('practice', 'game')),
  event_date date not null,
  opponent text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.pitches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  x double precision not null,
  y double precision not null,
  result text not null check (result in ('ball', 'strike')),
  created_at timestamptz not null default now()
);

create index if not exists pitches_event_id_idx on public.pitches (event_id);
create index if not exists pitches_player_id_idx on public.pitches (player_id);
create index if not exists pitches_created_at_idx on public.pitches (created_at);
create index if not exists events_event_date_idx on public.events (event_date desc);

alter table public.players enable row level security;
alter table public.events enable row level security;
alter table public.pitches enable row level security;

drop policy if exists "players_all" on public.players;
drop policy if exists "events_all" on public.events;
drop policy if exists "pitches_all" on public.pitches;

create policy "players_all" on public.players for all using (true) with check (true);
create policy "events_all" on public.events for all using (true) with check (true);
create policy "pitches_all" on public.pitches for all using (true) with check (true);

grant select, insert, update, delete on public.players to anon, authenticated;
grant select, insert, update, delete on public.events to anon, authenticated;
grant select, insert, update, delete on public.pitches to anon, authenticated;

insert into public.players (name, sort_order)
select names.name, names.sort_order
from (
  values
    ('Cam', 1),
    ('William', 2),
    ('Maddox', 3),
    ('Casen', 4),
    ('Sammy', 5),
    ('Paxton', 6),
    ('Hayes', 7),
    ('Luke', 8),
    ('George', 9),
    ('Connor', 10),
    ('Brady', 11)
) as names(name, sort_order)
where not exists (
  select 1 from public.players p where p.name = names.name
);
