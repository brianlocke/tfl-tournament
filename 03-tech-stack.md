# Tech Stack

## Frontend

- **React** — component framework
- **Tailwind CSS** — utility-first styling
- **Vite** — build tool and dev server
- **PWA plugin** — service worker, manifest, install prompt
- **React Router** — client-side routing

## Backend

- **Supabase** — all-in-one
  - PostgreSQL database
  - Row Level Security (RLS)
  - Supabase Auth (email/password + guest)
  - Supabase Realtime (live score sync)
  - Supabase Storage (avatars, optional)

## Hosting

- **Vercel** — frontend hosting + CI/CD from GitHub

## Key Libraries (planned)

| Library | Use |
|---|---|
| @supabase/supabase-js | Supabase client |
| react-query or swr | Data fetching + caching |
| zustand | Client-side state (match, score) |
| react-bracket or custom | Bracket visualization |
| qrcode.react | Join link QR code |
| lucide-react | Icons (used in current mockup) |

## Design Tokens (from current mockup)

- **Background**: `#0a1628` (deep navy)
- **Brand red**: `red-600` / `#dc2626`
- **Brand blue**: `blue-600` / `#2563eb`
- **Accent gold (champion)**: `amber-400`
- **Live indicator**: `emerald-400`
- **Display font**: Anton (athletic / broadcast)
- **Body font**: Saira
- **Mono / scoreboard**: JetBrains Mono
