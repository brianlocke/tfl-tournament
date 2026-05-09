# Double Elimination Bracket Logic

## Structure

- **Winners Bracket** — standard single-elim; losers drop to Losers Bracket
- **Losers Bracket** — second chance; one more loss = eliminated
- **Grand Final** — Winners Bracket champion vs Losers Bracket champion

## Progression Rules

```
Winners Bracket:
  Win  → advance in Winners Bracket
  Loss → drop to corresponding round in Losers Bracket

Losers Bracket:
  Win  → advance in Losers Bracket
  Loss → ELIMINATED

Grand Final:
  If Winners champion wins → Tournament over; they win
  If Losers champion wins → Grand Final Reset (true double elim)
  Reset match: both players have one loss; play one more game
```

## Player Counts

| Players | Winners Rounds | Losers Rounds | Total Matches |
|---|---|---|---|
| 4 | 2 | 2 | 6 |
| 8 | 3 | 4 | 14 |
| 16 | 4 | 6 | 30 |
| 32 | 5 | 8 | 62 |

## Seeding

- Manager assigns seeds 1–N before tournament starts (drag-to-reorder UI in lobby)
- Higher seed (1) plays lowest seed in Round 1
- Bye rounds auto-assigned if player count is not a power of 2 (top seeds get the byes)

## Bracket Auto-Advance Algorithm (pseudocode)

```
on match_complete(match):
  winner = match.winner_id
  loser  = match.loser_id

  if match.bracket == 'winners':
    loser.bracket_status = 'losers'
    assign loser to next losers bracket match
    assign winner to next winners bracket match

  if match.bracket == 'losers':
    loser.bracket_status = 'eliminated'
    assign winner to next losers bracket match

  if match.bracket == 'grand_final':
    if winner came from winners bracket all along:
      tournament.status = 'complete'
      champion = winner
    else:
      if grand_final.reset_played == false:
        create grand_final_reset match
      else:
        tournament.status = 'complete'
        champion = winner
```
