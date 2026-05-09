-- Broaden users read policy so tournament lobbies can display player names.
-- Players in the same tournament need to see each other's display names.
drop policy if exists "users: read own row" on public.users;

create policy "users: authenticated can read"
  on public.users for select
  to authenticated
  using (true);
