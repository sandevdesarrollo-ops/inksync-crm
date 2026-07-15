# InkSync — CRM for Tattoo Studios

Bookings, clients, designs (with try-on-skin preview), proposals + deposit links, unified social inbox, nurture campaigns, inventory, team and revenue — in one dark, studio-grade interface. English, Español, Български.

## Run locally

```bash
npm install
npm run dev   # http://localhost:3000
```

The app is **local-first**: all data lives in a persisted demo store (localStorage), seeded with realistic studio data. Reset it anytime in Settings → Danger zone.

## Deploy (Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsandevdesarrollo-ops%2Finksync-crm)

Or: import this repo at [vercel.com/new](https://vercel.com/new) — `vercel.json` already configures the Vite build and SPA rewrites. No env vars needed for the demo.

## Backend (Phase 1 — Supabase)

1. Create a project at [database.new](https://database.new) (EU region recommended for GDPR).
2. Open the SQL editor and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — multi-tenant schema with row-level security and signup bootstrap (each new user gets their own studio as owner).
3. Copy the project URL + anon key into `.env` (see `.env.example`) and into Vercel → Project → Environment Variables.

Full phased plan (Stripe deposits, Meta/WhatsApp inbox, public booking page): [ROADMAP.md](ROADMAP.md). Design system: [DESIGN.md](DESIGN.md).

## Stack

Vite · React 18 · Tailwind + shadcn/ui · zustand · react-router · recharts · date-fns · i18next
