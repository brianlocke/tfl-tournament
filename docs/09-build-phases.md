# Build Phases

## Phase 1 — Foundation
- [ ] Supabase project setup (auth, schema, RLS)
- [ ] React + Vite + Tailwind scaffold
- [ ] PWA manifest + service worker
- [ ] Player registration and login
- [ ] Guest session support

## Phase 2 — Tournament Management
- [x] Manager dashboard mockup
- [x] Create tournament modal mockup
- [ ] Wire create tournament to Supabase
- [ ] Join link generation + QR code
- [ ] Tournament lobby (live player list via Realtime)
- [ ] Manager seeding UI (drag to reorder)
- [ ] Start tournament → generate bracket

## Phase 3 — Bracket
- [x] Bracket visual component (mockup)
- [ ] Double elimination bracket generator
- [ ] Match status indicators (pending / active / complete)
- [ ] Real-time bracket updates as matches finish

## Phase 4 — Live Scoring
- [ ] Two-player scoring screen UI
- [ ] Standard score buttons: TD +6, XP +1, FG +3
- [ ] **Card modifier panel** — Super TD, Super FG, Extra Points, FG card
- [ ] Modifier state machine (armed → consumed → reset)
- [ ] **Defensive interrupt buttons** — Block FG, Pick Six (timed window)
- [ ] **Card draw picker (v1)** — tap-to-select from 6 scoring cards
- [ ] Supabase Realtime subscription per match
- [ ] Undo (10-second window)
- [ ] Win confirmation flow at >30
- [ ] Bracket auto-advance on match complete

## Phase 5 — Stats & Leaderboard
- [ ] Player profile page
- [ ] Career stats aggregation (TDs, FGs, Super TDs, etc.)
- [ ] Tournament history
- [ ] Global leaderboard

## Phase 6 — Polish
- [ ] PWA install prompt
- [ ] Offline fallback screen
- [ ] Animations (score pop, bracket advance, card modifier glow)
- [ ] Error handling + loading states
- [ ] Mobile QA across iOS + Android

## Phase 7 — Launch
- [ ] Vercel deployment
- [ ] Custom domain
- [ ] Beta test with real TFL players
- [ ] Bug fixes from beta

## Phase 8 — v2 Card Production Upgrade
- [ ] Add QR codes to physical card prints (each card encodes its slug)
- [ ] In-app camera scan flow (replaces tap-to-select picker)
- [ ] Optional: batch scan all 3 cards in one frame
- [ ] Fallback: keep picker as backup for un-QR'd decks

## Current Status

Mockup phase 2 complete (manager UI). Next decision: build the player-side mockup OR jump to live scoring screen with card modifiers.
