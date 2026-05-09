# Scoring Logic

> ✅ **Status: FINALIZED** — full set of scoring options confirmed from action card master print.

## All Scoring Events

| Event | Points | Source | Notes |
|---|---|---|---|
| Touchdown | **6** | Standard | Football crosses goal line in bounds |
| Super Touchdown | **10** | Card | Played BEFORE next TD; replaces the 6 |
| Extra Point (kick) | **1** | Standard | Kick through uprights after TD |
| Extra Points (card) | **3** | Card | After own TD, flick from opp 30 instead of kick |
| Field Goal | **3** | Standard or Card | Standard: from Red Zone. Card: anytime per card rules |
| Super Field Goal | **10** | Card | From point of stop, player's choice when |
| Blocked Field Goal | **0** (negates) | Card | Negates opponent's FG; ball turns over |
| Pick Six | **0** (negates) | Card | Negates opponent's TD; ball turns over; no points awarded |

> Pick Six awards no points — confirmed by rules owner. Ball turns over only.

## Win Condition

- First player to **exceed 30 points** wins
- Score must be `> 30`, not `>= 30`
- After a score puts a player over 30, a confirmation step is required before the match closes

## Card Modifier State Machine

At any moment, each player has at most one **active scoring modifier**:

```
states: NONE | SUPER_TOUCHDOWN_ARMED | SUPER_FG_ARMED | EXTRA_POINTS_ARMED | FG_CARD_ARMED

Transitions:
  Tap "Activate Super Touchdown" → SUPER_TOUCHDOWN_ARMED
    Next TD scores 10 instead of 6, then → NONE
  
  Tap "Activate Super Field Goal" → SUPER_FG_ARMED
    Next FG scores 10 instead of 3, then → NONE
  
  Tap "Activate Extra Points card" → EXTRA_POINTS_ARMED
    (only valid right after own TD)
    Next extra-point attempt is worth 3 instead of 1, then → NONE
  
  Tap "Activate FG card" → FG_CARD_ARMED
    Allows a 3-pt FG from outside red zone; consumed on attempt → NONE
```

UI implication: scoring buttons should **show the modified value** when a modifier is armed (e.g. "TD +10" highlighted when Super TD is armed).

## Negation Events

Two cards undo a prior score by reference:

- **Blocked Field Goal** — opponent must have just attempted a FG. Inserts a `negate_field_goal` event linked via `negates_event` to the FG event. Both events kept in the log; net points = 0.
- **Pick Six** — opponent just scored a TD (and possibly XP). Inserts `negate_touchdown` linked to the TD event. The XP event (if any) is also negated.

UI implication: the opposing player's screen must show "Block FG" / "Pick Six" buttons that are armed only briefly after the relevant scoring event (10-second window matches our undo policy).

## Real-time Sync Architecture

```
Player taps score button (with modifier state if armed)
  → INSERT into scoring_events with correct points + card_used
    → Supabase Realtime broadcasts to both subscribed clients
      → Both UIs re-render with updated total
        → If total > 30 → show "Confirm Win?" on both devices
          → On confirm: PATCH match.status = 'complete', winner_id = player_id
            → Bracket auto-advance triggers
```

## Undo Logic

- Last scoring event can be deleted within 10 seconds (undo button visible to scorer)
- After 10 seconds, requires manager override
- Undo of a TD also undoes any XP that followed it (cascade)
- Negation events (Block FG / Pick Six) cannot be undone by the scorer; only by manager

## Total Computation

Player score is computed server-side as:

```sql
SELECT COALESCE(SUM(points), 0)
FROM scoring_events
WHERE match_id = :match_id
  AND player_id = :player_id
  AND id NOT IN (SELECT negates_event FROM scoring_events WHERE negates_event IS NOT NULL)
```

This excludes any scoring event that was negated by a later card play.
