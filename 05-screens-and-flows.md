# App Screens & User Flows

## Screen List

| # | Screen | Who Sees It |
|---|---|---|
| 1 | Landing / Home | Everyone |
| 2 | Register / Login | New + returning users |
| 3 | Dashboard | Registered users |
| 4 | Create Tournament | Managers |
| 5 | Tournament Lobby | Manager + joined players |
| 6 | Bracket View | Everyone with join link |
| 7 | Live Scoring Screen | The two players in that match |
| 8 | Match Summary | Players after game |
| 9 | Player Profile | Registered users |
| 10 | Leaderboard | Everyone |

## Key Flows

### Guest Join Flow
1. Tap join link → land on Tournament Lobby
2. "Play as Guest" → enter display name
3. Joined; see bracket and upcoming match
4. When match starts → open Live Scoring Screen
5. After game → prompted: "Save your stats? Create an account"

### Player Registration Flow
1. Landing → Register
2. Enter email + password + display name
3. Verified → Dashboard
4. Browse or join tournaments via link

### Manager: Create Tournament Flow
1. Dashboard → "Create Tournament"
2. Enter name, select max players (4/8/16/32)
3. System generates join link + QR code
4. Share link; watch lobby fill
5. Seed players (drag to reorder) → "Start Tournament"
6. Bracket generates; Round 1 matches activated

### Live Scoring Flow
1. Both players open match link on their devices
   - **OR** a single phone is laid flat on the table between both players (Table Mode)
2. Scoring screen shows: Player A (top) vs Player B (bottom)
   - **In Table Mode, Player B's panel is rotated 180°** — the phone lies flat with the top edge pointing at P1 and the bottom edge at P2, so each player reads their own side naturally without picking up the phone
3. Each player taps their own scoring buttons:
   - **Touchdown (+6)**
   - **Extra Point (+1)**
   - **Field Goal (+3)**
   - **Card Modifier toggle** — opens panel with active cards (Super TD / Super FG / Extra Points card / FG card)
4. When card modifier is active, next applicable score uses card value
5. Defense buttons (visible to opponent):
   - **Block FG** (negates last FG attempt)
   - **Pick Six** (negates last TD)
6. Events write to `scoring_events` → Realtime fires → both screens update
7. When either score > 30 → "Confirm Win?" modal
8. Manager or winner confirms → match.status = complete → bracket auto-advances

### Table Mode Specifics
- **Layout:** P1 (the phone owner / typical phone-hold position) sits where the bottom edge of the phone is. Their panel renders at the **bottom of the screen in normal orientation**. P2 sits across the table — the top edge of the phone is on their side. Their panel renders at the **top of the screen rotated 180°** so it reads naturally from their viewpoint.
- Center divider is symmetric (two bars meeting in middle, neutral dot) so it reads acceptably from either end
- Card picker rotates to match the player who opened it
- Header (match info, undo, activity, close) is anchored to P1's orientation — manager-style controls
- Win modal is shared (both players will look together at end of match)
