-- Public read access so the join page works for unauthenticated visitors
create policy "tournaments: anon can read"
  on public.tournaments for select
  to anon
  using (true);

create policy "tournament_players: anon can read"
  on public.tournament_players for select
  to anon
  using (true);

-- Allow anon to join a tournament as a guest
create policy "tournament_players: anon can join as guest"
  on public.tournament_players for insert
  to anon
  with check (
    user_id is null
    and guest_name is not null
    and exists (
      select 1 from public.tournaments t
      where t.id = tournament_id
        and t.status = 'registration'
        and (
          select count(*) from public.tournament_players tp
          where tp.tournament_id = t.id
        ) < t.max_players
    )
  );

-- Allow tournament manager to update player seeds
create policy "tournament_players: manager can update"
  on public.tournament_players for update
  using (
    exists (
      select 1 from public.tournaments t
      where t.id = tournament_id and t.manager_id = auth.uid()
    )
  );
