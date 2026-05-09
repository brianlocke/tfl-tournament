# TFL Tournament

Next.js app for running and playing Table Football League tournaments.

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Project Layout

- `src/` - Next.js app routes, components, and library code
- `public/` - static assets
- `supabase/` - local Supabase config and migrations
- `docs/` - product plans, rules, schema notes, and mockups

## Deploying

This repo is now structured as a standard Next.js project at the repository root.

In Vercel, set:

- Framework Preset: Next.js
- Root Directory: blank
- Build Command: `npm run build`
- Install Command: `npm install`
- Output Directory: blank

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
