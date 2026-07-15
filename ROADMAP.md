# InkSync — Product Roadmap to Launch

## Where we are (Phase 0 — done)
Fully working local-first CRM demo: all 12 modules functional against a persisted local store, EN/ES/BG i18n, premium dark design system (see DESIGN.md). Perfect for sales demos — every studio you pitch sees a live, clickable product with realistic data. `npm run dev` to run.

## Phase 1 — Real backend (make it multi-studio SaaS)
- **Supabase** (Postgres + Auth + Storage + Row-Level Security): one `studios` tenant table; every entity (clients, appointments, designs…) keyed by `studio_id` with RLS so studios only see their data. The store layer in `src/lib/store.js` is the single integration point — swap zustand-persist for Supabase queries collection by collection.
- Auth: email/password + Google login; roles (owner / artist / front-desk) mirroring `artists.role`.
- Design image uploads → Supabase Storage (the UI already supports file upload as dataURL).
- Realtime: Supabase channels for appointments + messages so front desk and artists stay in sync.

## Phase 2 — Money (deposits & proposals become real)
- **Stripe**: Payment Links or Checkout for proposal deposits — the `depositLink` field already models this; generate a real link on "Send", webhook flips status to `deposit_paid` automatically.
- Stripe Connect (Standard) later if you want per-studio payouts under your platform.
- Invoices/receipts via Stripe; revenue reports then read from real payment data.

## Phase 3 — Channels (the messaging center goes live)
- **WhatsApp Business Cloud API** + **Instagram Messaging API** + **Messenger** via Meta's Graph API (one Meta app, three products). Webhooks → `conversations` table.
- Nurture sends: **Resend** (email) + WhatsApp templates for aftercare/win-back/birthday — the campaign engine and templates already exist in the UI.
- Booking reminders: cron (Supabase Edge Functions scheduled) 48h + 3h before `start`.

## Phase 4 — Distribution & polish
- **Public booking page** per studio (`inksync.studio/<slug>`): gallery of designs + artist picker + request-a-slot form feeding `appointments` as pending. This is the #1 conversion feature to sell studios.
- Try-on-skin: current 2D overlay is the demo; later upgrade path is an AR view (e.g. MediaPipe/WebXR) — keep as differentiator messaging.
- Google Calendar 2-way sync per artist.
- PWA (installable on the front-desk iPad).

## Launch checklist
1. Domain + hosting: Vercel (frontend) + Supabase (EU region for GDPR).
2. GDPR: privacy policy, data-processing terms (you'll hold EU client PII), consent checkbox on booking page.
3. Pricing suggestion: €39/mo solo artist, €89/mo studio (≤5 artists), €149/mo unlimited + booking page. 14-day trial, demo data pre-seeded on signup (the seed already exists).
4. Marketing site: benefit-led copy ("Fewer no-shows. Faster deposits. Fuller books."), scroll-through studio hero (scroll-world skill), SEO targets: "tattoo studio software", "tattoo booking app", ES/BG equivalents.
5. Sales motion: walk into studios with the demo on an iPad; import their Instagram inbox pain first, price second.

## Suggested next session
Pick Phase 1: I can scaffold Supabase (schema + RLS + auth screens) and migrate the store in one go.
