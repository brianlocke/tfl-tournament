# Database Schema (Supabase / PostgreSQL)

## users

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
email         text UNIQUE
name          text NOT NULL
avatar_url    text
is_guest      boolean DEFAULT false
created_at    timestamptz DEFAULT now()
```

## tournaments

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
name          text NOT NULL
manager_id    uuid REFERENCES users(id)
status        text CHECK (status IN ('registration','active','complete'))
max_players   int CHECK (max_players IN (4,8,16,32))
join_code     text UNIQUE NOT NULL
created_at    timestamptz DEFAULT now()
```

## tournament_players

```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
tournament_id    uuid REFERENCES tournaments(id)
user_id          uuid REFERENCES users(id)   -- null for guests
guest_name       text                         -- used if user_id is null
seed             int
bracket_status   text CHECK (bracket_status IN ('active','losers','eliminated','champion'))
joined_at        timestamptz DEFAULT now()
```

## matches

```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
tournament_id    uuid REFERENCES tournaments(id)
bracket          text CHECK (bracket IN ('winners','losers','grand_final'))
round            int NOT NULL
position         int NOT NULL
player1_id       uuid REFERENCES tournament_players(id)
player2_id       uuid REFERENCES tournament_players(id)
status           text CHECK (status IN ('pending','active','complete'))
winner_id        uuid REFERENCES tournament_players(id)
created_at       timestamptz DEFAULT now()
completed_at     timestamptz
```

## scoring_events

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
match_id      uuid REFERENCES matches(id)
player_id     uuid REFERENCES tournament_players(id)
event_type    text NOT NULL
                   -- 'touchdown' | 'super_touchdown'
                   -- 'extra_point_kick' | 'extra_points_card'
                   -- 'field_goal' | 'super_field_goal'
                   -- 'pick_six' (if confirmed scoring; see card notes)
                   -- 'negate_touchdown' | 'negate_field_goal' (corrections, points 0 or negative)
points        int NOT NULL
card_used     text                -- 'Super Touchdown' | 'Extra Points' | 'Super Field Goal' | etc.
negates_event uuid REFERENCES scoring_events(id)  -- for Pick Six / Blocked FG
created_at    timestamptz DEFAULT now()
```

> **Why `card_used` and `negates_event` columns?**
> - `card_used` lets us audit which card produced an off-standard score (Super TD = 10 instead of 6)
> - `negates_event` lets a Blocked FG or Pick Six undo a prior scoring event cleanly via reference, so totals always reconcile

## Row Level Security (planned)

- All authenticated users can read tournaments
- Players can only INSERT scoring_events for matches they are participants in
- Managers can UPDATE their own tournaments
- Guests have session-scoped access tied to their tournament_player row
