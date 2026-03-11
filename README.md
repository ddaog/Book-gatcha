# Book Gacha MVP

Production-ready MVP web app for a social book card-collecting game.

## Tech Stack

- Next.js 15 (App Router)
- React + TypeScript
- TailwindCSS
- shadcn/ui-style components
- Supabase (Postgres + Auth)
- Vercel OG image generation (`@vercel/og`)

## Features

- Supabase Auth (signup/login/session persistence)
- Protected routes (`/gacha`, `/collection`, `/profile`)
- Daily gacha pull limit: 5 pulls/day per user
- Rarity drop rates:
  - Rare 50%
  - Super Rare 28%
  - Hero 15%
  - Myth 5%
  - Legend 2%
- Card ownership statistics endpoint:
  - `GET /api/card-stats/[cardId]`
- Gacha endpoint:
  - `GET /api/gacha` (remaining pulls)
  - `POST /api/gacha` (perform pull)
- Social image endpoint (9:16):
  - `GET /api/card-image/[cardId]`
- Collection filtering by rarity
- Profile metrics (total pulls, rarest card, completion rate)
- Book import script from data4library + Aladin APIs

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATA4LIBRARY_API_KEY`
- `ALADIN_API_KEY`

Also required for import script:

- `SUPABASE_SERVICE_ROLE_KEY`

## Database Setup (Supabase SQL)

Run the SQL in:

`supabase/schema.sql`

This creates:

- `cards`
- `user_cards`
- `gacha_logs`
- `daily_gacha`

And includes:

- RLS policies
- `get_card_ownership_stats(uuid)` function

## Local Development

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

## Import Initial 1000 Books

```bash
npm run import:books
```

The script:

1. fetches books from `data4library loanItemSrch`
2. enriches cover/summary/category via Aladin OpenAPI
3. assigns rarity from loan count
4. upserts into `cards` by `isbn`

## Build & Lint

```bash
npm run lint
npm run build
```

## Deployment

Deploy to Vercel and set all environment variables in project settings.
