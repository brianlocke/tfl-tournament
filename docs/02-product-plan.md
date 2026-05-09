# Product Plan

## What We're Building

A full-stack PWA for managing TFL tournaments, from player registration through live in-game scoring.

## Who It's For

| User Type | Description |
|---|---|
| Players (Registered) | Create account, join tournaments, track career stats |
| Players (Guest) | Join via link, play with name only, prompted to register after |
| Tournament Managers | Create and manage tournaments, seed brackets, start games |

## Core Features

1. Player self-registration (or guest play)
2. Tournament creation with shareable join link + QR code
3. Double-elimination bracket generation and management
4. Live real-time in-game scoring (synced across two devices)
5. **Action card tracking** — players mark which scoring modifiers are active so the app applies the correct point values
6. Bracket auto-advance on match completion
7. Player stats and career history
8. Global leaderboard

## Key Decisions Made

| Decision | Choice | Notes |
|---|---|---|
| Platform | PWA (web + mobile) | Installable on iOS and Android |
| Bracket format | Double elimination | Two losses = eliminated |
| Auth | Supabase Auth + Guest mode | Guests prompted to register after game |
| Tournament access | Anyone with join link | No invite approval needed |
| Scoring | Real-time live scoring | Supabase Realtime; final confirmation advances bracket |
| Backend | Supabase | Auth + PostgreSQL + Realtime |
| Frontend | React + Tailwind | |
| Hosting | Vercel | |

## Out of Scope (v1)

- Video streaming
- In-app chat
- Payment / entry fees
- Spectator live view (v2 candidate)
- Action card simulation (the app tracks scoring impact only — players still play physical cards)
