# Card Tracking Design

How the app knows what's in each player's hand.

## Strategy

**v1 (ship now):** Tap-to-select picker — visual grid of cards, player taps which one they drew.
**v2 (future):** QR codes on the back of physical cards — phone camera scans on draw.

## Scope: Only 6 Cards Tracked

Per design decision, the app only tracks the **scoring-relevant cards**. Positional cards (Bomb Pass, Sack, Punt, etc.) are resolved physically on the table and never enter the app's data model.

The 6 tracked cards:

| Card | Why Tracked | Affordance in App |
|---|---|---|
| Super Touchdown | Modifies TD value (6 → 10) | Armable card; updates TD button label |
| Super Field Goal | Modifies FG value (3 → 10) | Armable card; updates FG button label |
| Extra Points | Modifies XP value (1 → 3) | Armable card; only valid right after own TD |
| Field Goal (card) | Allows on-demand FG attempt | Armable card; treats next FG as standard 3-pt |
| Pick Six | Negates opponent's TD | Defensive interrupt; appears briefly after opponent's TD |
| Blocked FG | Negates opponent's FG | Defensive interrupt; appears briefly after opponent's FG attempt |

## v1 Flow: Tap-to-Select Picker

### Initial draw (match start)

```
1. Match opens → both players see 3 empty card slots labeled "DRAW"
2. Player taps DRAW → picker modal opens
3. Modal shows 6 cards as visual grid with name + effect description
4. Player taps the card matching the one they physically drew
5. Modal closes; card fills the slot
6. Repeat 2-5 until all 3 slots are filled
```

### Replacement draw (mid-match)

```
1. Player uses a card (it's consumed → slot becomes "DRAW" again)
2. Player physically draws next card from their deck
3. Tap DRAW → picker modal opens
4. Tap matching card → slot fills
```

### Edge cases

- **Duplicates allowed**: A player can have two Super TDs at once if they drew two from the deck. Picker doesn't disable any options.
- **Non-scoring card drawn**: If the player physically drew, say, Bomb Pass, they don't need to tell the app. They can leave the slot empty (or tap a "Drew non-scoring card" option that just leaves the slot empty until their next scoring-relevant draw). Open question — see below.
- **Mistake correction**: Long-press an in-hand card to remove/replace it. Or hit "Edit Hand" in player section.

### Non-scoring draws

When a player physically draws a non-scoring card (Bomb Pass, Sack, Punt, etc.), they don't tell the app — the slot stays empty. The app's hand size will not always match the physical hand of 3. This is intentional: the app only models cards it needs to act on, and players resolve everything else on the table.

Implication: a player might have all 3 app slots empty even mid-game, which is fine. They'll only see DRAW prompts as a passive option and only fill slots when a scoring-relevant card actually enters their hand.

## v2 Flow: QR Code Scan

### Card production change required

- Each printed action card gets a unique QR code on the back (or a small one in a corner of the front)
- QR encodes the card's slug (e.g. `tfl:super_touchdown`)

### In-app

```
1. Player taps DRAW slot (or auto-prompted)
2. Phone camera opens
3. Player holds card up; QR scans instantly
4. Slot fills automatically
5. Optional: scan all 3 cards in one frame at match start
```

### Benefits

- Zero typing or selection — fastest possible flow
- No misclicks
- Could enable future features: card-back animations, deck verification, anti-cheat

## Database Note

Hand state is stored per `tournament_player` in a session-scoped JSONB column or a `hand_cards` join table. Since only 6 card types matter and a hand has up to 3 slots, we can use a simple array column:

```sql
ALTER TABLE tournament_players
ADD COLUMN hand jsonb DEFAULT '[]'::jsonb;
-- Example value: ["super_td", "extra_points", null]
```

When a card is used, it's removed from `hand`. The `scoring_events.card_used` column already records which card produced the score.
