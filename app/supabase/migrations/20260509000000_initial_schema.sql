-- TFL initial schema

-- users (extends Supabase auth.users)
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique,
  name        text not null,
  avatar_url  text,
  is_guest    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- tournaments
create table public.tournaments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  manager_id  uuid not null references public.users(id),
  status      text not null default 'registration'
                check (status in ('registration', 'active', 'complete')),
  max_players int not null check (max_players in (4, 8, 16, 32)),
  join_code   text not null unique,
  created_at  timestamptz not null default now()
);

-- tournament_players
create table public.tournament_players (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references public.tournaments(id) on delete cascade,
  user_id        uuid references public.users(id) on delete set null,
  guest_name     text,
  seed           int,
  bracket_status text not null default 'active'
                   check (bracket_status in ('active', 'losers', 'eliminated', 'champion')),
  joined_at      timestamptz not null default now(),
  constraint player_has_identity check (user_id is not null or guest_name is not null)
);

-- matches
create table public.matches (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references public.tournaments(id) on delete cascade,
  bracket        text not null check (bracket in ('winners', 'losers', 'grand_final')),
  round          int not null,
  position       int not null,
  player1_id     uuid references public.tournament_players(id),
  player2_id     uuid references public.tournament_players(id),
  status         text not null default 'pending'
                   check (status in ('pending', 'active', 'complete')),
  winner_id      uuid references public.tournament_players(id),
  created_at     timestamptz not null default now(),
  completed_at   timestamptz
);

-- scoring_events
create table public.scoring_events (
  id            uuid primary key default gen_random_uuid(),
  match_id      uuid not null references public.matches(id) on delete cascade,
  player_id     uuid not null references public.tournament_players(id),
  event_type    text not null
                  check (event_type in (
                    'touchdown', 'super_touchdown',
                    'extra_point_kick', 'extra_points_card',
                    'field_goal', 'super_field_goal',
                    'pick_six',
                    'negate_touchdown', 'negate_field_goal'
                  )),
  points        int not null,
  card_used     text,
  negates_event uuid references public.scoring_events(id),
  created_at    timestamptz not null default now()
);

-- indexes
create index on public.tournament_players (tournament_id);
create index on public.matches (tournament_id);
create index on public.scoring_events (match_id);
create index on public.scoring_events (player_id);

-- enable RLS on all tables
alter table public.users enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_players enable row level security;
alter table public.matches enable row level security;
alter table public.scoring_events enable row level security;

-- RLS: users
create policy "users: read own row"
  on public.users for select
  using (auth.uid() = id);

create policy "users: update own row"
  on public.users for update
  using (auth.uid() = id);

-- RLS: tournaments
create policy "tournaments: anyone authenticated can read"
  on public.tournaments for select
  to authenticated
  using (true);

create policy "tournaments: manager can insert"
  on public.tournaments for insert
  to authenticated
  with check (auth.uid() = manager_id);

create policy "tournaments: manager can update own"
  on public.tournaments for update
  using (auth.uid() = manager_id);

-- RLS: tournament_players
create policy "tournament_players: authenticated can read"
  on public.tournament_players for select
  to authenticated
  using (true);

create policy "tournament_players: authenticated can join"
  on public.tournament_players for insert
  to authenticated
  with check (auth.uid() = user_id);

-- RLS: matches
create policy "matches: authenticated can read"
  on public.matches for select
  to authenticated
  using (true);

create policy "matches: manager can insert/update"
  on public.matches for all
  using (
    exists (
      select 1 from public.tournaments t
      where t.id = tournament_id and t.manager_id = auth.uid()
    )
  );

-- RLS: scoring_events
create policy "scoring_events: authenticated can read"
  on public.scoring_events for select
  to authenticated
  using (true);

create policy "scoring_events: match participant can insert"
  on public.scoring_events for insert
  to authenticated
  with check (
    exists (
      select 1 from public.matches m
      join public.tournament_players tp
        on tp.id in (m.player1_id, m.player2_id)
      where m.id = match_id
        and tp.user_id = auth.uid()
    )
  );
