# Action Cards Catalog

Pulled from the master print PDF (`ActionCards_Master_ActionSide_Print.pdf`). All 18 card slots across the 2-page print sheet are listed; duplicates noted.

## Card Type Color Coding

- 🔴 **DEFENSE** (red border)
- 🔵 **OFFENSE** (blue border)
- 🟢 **SPECIAL TEAMS** (green border)
- ⚫ **BENCHED** (black border, "Player Injury")

## Activation Rule (universal)

- A new Action Card can only be activated after crossing into the Red Zone (Opp 20-yard line)
- Active card stays in effect until resolved or replaced
- Cannot be played immediately after Extra Point or Field Goal — exception: Blocked Field Goal
- Each card used only one time, then discarded next turn

## OFFENSE Cards 🔵

| Card | Action | Use | Scoring Impact |
|---|---|---|---|
| **Double Flick** | Flick the football twice in a row | On Turn Only | Position only |
| **Bomb Pass** | Move football to opponent's 30-yard line and flick | On Turn Only | Position only |
| **Trick Play** | Move football to opponent's 30-yard line and flick | On Turn Only | Position only |
| **Field Goal** | Attempt FG from opponent's 30-yard line for 3 points if successful | On Turn Only | **+3 pts** (FG outside Red Zone) |
| **Super Field Goal** | Attempt FG from point of stop (player's choice when) for 10 points | On Turn Only | **+10 pts** (replaces standard 3 FG) |
| **Super Touchdown** | Player's next touchdown scores 10 points | On Turn Only | **+10 pts** (replaces standard 6 TD) |
| **Extra Points** | After touchdown, flick from opponent's 30 yard line for 3 points | After Own Touchdown | **+3 pts** (replaces standard 1 XP) |

## DEFENSE Cards 🔴

| Card | Action | Use | Scoring Impact |
|---|---|---|---|
| **Interception** | Move ball 40 yards from opponent's stop and flick football | On Turn Only | Position + turnover |
| **Fumble** | Opponent loses turn | On Turn Only | Turnover |
| **Pick Six** | Negates opponent's touchdown when played after touchdown. Ball turns over | Anytime | **Negates +6 (and any XP that followed)** |
| **Sack** | Moves opponent back to own 1-yard line when played | Anytime | Position only |

## SPECIAL TEAMS Cards 🟢

| Card | Action | Use | Scoring Impact |
|---|---|---|---|
| **Onside Kick** | After own TD and extra point attempt, retain possession and flick from opp 30-yard line | After Own Touchdown | Possession only |
| **Punt** | Football is moved back to opponent's 1-yard line | On Turn Only | Position only |
| **Blocked Field Goal** | Negates opponent's FG after FG attempt. Ball turns over | Anytime | **Negates +3** |

## BENCHED ⚫

| Card | Action | Use | Scoring Impact |
|---|---|---|---|
| **Player Injury** | No Action! No Play! | On Turn Only | Skip turn (printed twice in deck) |

## Cards That Affect The Scoring App Logic

The app needs UI affordances for these specifically:

**Player's own scoring modifiers** (visible on their side of the screen):
- Super Touchdown (arm before TD)
- Super Field Goal (arm before FG)
- Extra Points card (arm right after own TD)
- Field Goal card (allows FG attempt outside Red Zone)

**Defensive interrupts** (visible on opponent's side, briefly armed):
- Blocked Field Goal — appears when opponent attempts FG
- Pick Six — appears when opponent scores TD

All other cards (Double Flick, Bomb Pass, Punt, Sack, Fumble, Interception, Trick Play, Player Injury, Onside Kick) are positional or turn-control only and don't need scoring-app handling. Players resolve them physically on the table.

## Resolved Rule Clarifications

- **Pick Six** — only negates the opponent's TD. No points awarded to the defender. Ball turns over.
- **Field Goal card** — allows an on-demand FG attempt from anywhere (not restricted to Red Zone). Worth 3 points if successful.
