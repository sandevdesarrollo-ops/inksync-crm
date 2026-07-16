# InkSync — Product Specification (v2)

> **Canonical reference.** This document is the single source of truth for what InkSync is, what's built, what's being built, and how it makes money. Written to be read by humans and AI assistants (Claude, GPT, etc.) — everything needed for full context is here or linked.
> Companion docs: [DESIGN.md](DESIGN.md) (visual system) · [ROADMAP.md](ROADMAP.md) (phasing) · [supabase/migrations/](supabase/migrations/) (schema).

## 1. Vision & positioning

**InkSync is the operating system for tattoo studios.** Not a generic booking tool with a tattoo skin — every feature is shaped by how studios actually work: deposits kill no-shows, designs have fixed sizes and placements, flash drops and events drive promotion, consent forms are legally required, and Instagram is where clients come from.

**Two-sided:** a studio-facing CRM (built, live) and a client-facing public site per studio (v2, this spec) that turns the CRM into a client-acquisition machine. The pitch: *"Your studio's booking site, in three languages, live in one afternoon — and it pays for itself the first time it recovers a cancelled slot."*

**Target user:** studio owners (1–15 artists), EU-first (GDPR as a feature), launching EN/ES/BG with more languages cheap to add.

## 2. Current state (shipped)

- **Live demo app:** https://inksync-crm.vercel.app — local-first (localStorage via zustand), all 12 CRM modules functional: Dashboard, Focus/Activity, Reports, Calendar, Clients, Designs (with 2D try-on overlay), Proposals + deposit links (simulated), Messages (unified inbox UI), Nurture, Inventory, Team, Settings.
- **Repo:** github.com/sandevdesarrollo-ops/inksync-crm (Vercel auto-deploys `main`).
- **Stack:** Vite + React 18 (JSX), Tailwind + shadcn/ui, zustand, react-router, recharts, date-fns, i18next (EN/ES/BG, per-module JSON locale files auto-merged).
- **Backend provisioned, not yet wired:** Supabase project `inksync` (ref `kpelksbqacdkfzgujyil`, eu-central-1). Migration 0001: 12 multi-tenant tables, RLS (studio members see only their studio), signup trigger (new user → own studio as owner). Env vars set on Vercel; keys in `.env.local` (gitignored).
- **Design system:** dark ink theme, gold accent, Fraunces display + Manrope UI — see DESIGN.md.

## 3. v2 feature set (agreed & committed)

### 3.1 Design variants (constrained sizes/placements)
Artists define per design 1–3 **variants**: exact size in cm, allowed placement(s), price, and session duration. Clients never enter free-form sizes — they pick a variant. Why: artists get exact prep measurements and predictable session lengths; clients see what's actually possible; the booking engine gets the slot duration it needs. Data: `design_variants(design_id, size_cm, placements[], price, duration_minutes, active)`.

### 3.2 Deposit-gated client self-booking
Public flow: pick design variant (or consult) → pick artist → pick open slot (computed from artist schedule + existing bookings + buffer) → **acknowledge no-show policy** → pay deposit (Stripe) → slot confirmed. Slot is **held for 15 minutes** during checkout (`booking_holds`, expired holds auto-released). Unpaid = never booked. Double-booking is impossible at the DB level (Postgres `EXCLUDE USING gist` on artist + time range).
On confirmation: client email (receipt + .ics calendar file + policy recap), artist email (date, design image, exact size/placement, client notes + medical flags from consent history).

### 3.3 Public studio site
Per studio at `inksync.studio/<slug>` (custom domain on Premium): home → design gallery (filter by style/artist) → artists directory (styles, portfolio) → artist detail page with their designs. Every design: **"Tattoo this"** (starts booking with that variant) or **"Custom Tattoo"** (structured intake form: placement, rough size, budget range, references upload, description → lands in InkSync inbox as `intake_requests` AND forwards to artist's connected channel). No raw "how much for a sleeve?" DMs. Public pages need SEO → server-rendered public site (Next.js or Astro) reading the same Supabase, separate from the SPA app. Multi-language from day one.

### 3.4 Client-facing try-on (lead engine)
Anonymous try-on of any published design (2D overlay: upload photo, drag/scale/rotate, watermarked). To **save** the try-on or book from it → email required → `tryon_leads` row → appears in studio CRM ("Sofia tried Koi Ascending on shoulder, Tues") → triggers nurture sequence. Future upgrade path: AR (MediaPipe/WebXR) as premium differentiator; 2D ships first.

### 3.5 Digital consent forms
Versioned per-studio templates (multi-language). Signing: studio iPad in person, or client phone via QR code. Signature pad + timestamp + document version + signer identity stored; rendered signed PDF in Supabase Storage; linked to client record forever. Health questions (allergies, medications, conditions) are **GDPR special-category data**: encrypted at rest (pgsodium/pgcrypto column encryption), access restricted to owner+assigned artist, configurable retention. Medical flags auto-populate the client profile (e.g. "allergic to nickel" visible before every future session). Compliance-by-design is a *selling point* for EU studios.

### 3.6 Waitlist + cancellation backfill
Two sources: (a) explicit waitlist signup for a full artist/period, (b) **existing clients booked 2+ weeks out who opted into "offer me earlier slots."** When a slot frees (cancellation/reschedule), the system offers it automatically (email/WhatsApp) in priority order, first-accept-wins with a short claim window. Recovered slots are tracked and shown on the dashboard ("InkSync recovered €480 this month" — the retention stat that sells renewals).

### 3.7 Flash drops + events (studio promotion engine)
- **Flash drops:** limited-quantity design releases (N slots, fixed variant + price, opens at a set time, first-come-first-served with the same hold+deposit flow). Countdown page, shareable link, auto-post assets.
- **Events:** guest artist visits, walk-in days, conventions, studio anniversaries. Each gets a public page (date, artists, bookable slots or walk-in info), shareable link + QR poster, RSVP/booking tracking, post-event stats.
Both feed the nurture engine (announce to matching clients by style preference) and are the core "studio grabber" for sales demos.

### 3.8 Aftercare + review loop
Chained automation post-session: Day 3 aftercare check-in (already modeled in nurture) → Day 21 "send a healed photo + leave a review." Reviews (rating + text + optional healed photo, client permission flag) attach to the artist and design; healed photos can be published to the artist's public portfolio. Review requests only after `completed` sessions.

### 3.9 No-show policy engine
Studio configures: deposit forfeiture window (e.g. <48h), free reschedule count, late-arrival grace. Policy text is **displayed and acknowledged before deposit payment** (checkbox, stored with the booking). Enforcement is automatic (deposit kept/refunded per policy). No awkward conversations.

### 3.10 Instagram insights (analytics only in this phase)
Studio/artist connects Instagram (Meta Graph API): follower growth, reach, engagement rate, top posts, best posting times — surfaced in Reports next to booking data ("your reel Tuesday → 4 try-ons → 1 booking"). **Posting + automation deferred** to a later phase (see roadmap); insights-only keeps the Meta app-review scope small (`instagram_basic`, `instagram_manage_insights`, `pages_read_engagement`).

### 3.11 Payments & platform revenue (Stripe Connect)
Stripe Connect (Standard) per studio. Deposits flow client → studio's Stripe with an **application fee** to InkSync on every transaction. Webhooks flip booking/proposal status (`deposit_paid`). Refunds follow the no-show policy engine. This is the primary revenue engine at scale — subscriptions are the floor, payment volume is the upside, multi-location studios are the whales.

## 4. Pricing tiers

| | **Solo — €39/mo** | **Studio — €89/mo** | **Empire — €149+/mo** |
|---|---|---|---|
| Artists | 1 | up to 5 | unlimited |
| Locations | 1 | 1 | multi-location |
| Full CRM (calendar, clients, inbox, inventory, reports) | ✓ | ✓ | ✓ |
| Public site + booking + try-on | ✓ InkSync-branded, standard layout | ✓ + logo/colors | ✓ customizable sections + custom domain |
| Stripe deposits (with platform fee) | — (manual confirm) | ✓ | ✓ |
| Consent forms | 1 template | unlimited + QR | unlimited + QR |
| Nurture, flash drops, events, waitlist | — | ✓ | ✓ |
| Instagram insights | — | ✓ | ✓ + per-artist |
| 14-day trial, demo data pre-seeded | ✓ | ✓ | ✓ |

Gate money features and brand — never cripple the core booking workflow (crippled Basic just churns). Online-payment volume makes multi-location customers the most valuable; sales effort concentrates there.

## 5. Architecture

- **App (studio-facing):** current Vite SPA, migrating store from localStorage → Supabase (collection-by-collection behind the existing `useStore` API; `src/lib/supabase.js` is the entry point). Auth: Supabase email/password + Google; roles owner/artist/front_desk mapped via `memberships`.
- **Public site (client-facing):** separate server-rendered app (Next.js on Vercel) for SEO, reading the same Supabase with anon-role RLS (`published = true` rows only). Booking/checkout runs here.
- **DB:** Supabase Postgres, eu-central-1. Migration 0001 = core CRM. Migration 0002 = v2 (variants, holds+booking constraints, consent, intake, try-on leads, waitlist, flash drops, events, reviews, policies, Instagram accounts, locations, payments). RLS everywhere; public read policies for published content; special-category (health) columns encrypted.
- **Async jobs:** Supabase Edge Functions + scheduled functions (hold expiry, waitlist offers, reminder emails 48h/3h, aftercare/review sequences, Instagram insights sync).
- **Email:** Resend (transactional + nurture). WhatsApp templates later via Meta Cloud API.
- **Payments:** Stripe Connect Standard + webhooks (Edge Function endpoint).
- **Integrations later (v3/v4):** WhatsApp/Instagram DM inbox sync, Google Calendar 2-way, social posting automation, AR try-on.

## 6. Build phases

- **Phase 0 (prereq):** Auth + migrate app store to Supabase. Seed → "demo studio" generator on signup.
- **Phase 1 — the demo that closes studios:** design variants, booking engine (holds + exclusion constraints + availability), minimal public studio page, transactional emails.
- **Phase 2 — the no-show killer:** Stripe Connect deposits + application fee, no-show policy engine, refund logic.
- **Phase 3 — the "they get us" release:** consent forms (+QR, encryption), intake requests, try-on lead capture + nurture triggers.
- **Phase 4 — the promotion engine:** flash drops, events, waitlist/backfill, aftercare+review loop, Instagram insights.
- **Phase 5 — premium & scale:** site customization, custom domains, multi-location, per-artist Instagram, AR try-on exploration, posting automation.

## 7. Key risks / open questions

- **E-sign validity:** simple electronic signature is sufficient for consent forms in most EU states (eIDAS) — confirm per launch market; keep signature + timestamp + IP + doc-version evidence trail.
- **Health data:** encryption approach (pgsodium vs app-layer) to be finalized in Phase 3; retention defaults per market.
- **Meta app review:** Instagram insights scopes require review — start the application early (weeks of lead time).
- **SEO architecture:** public site framework decision (Next.js default) locked at Phase 1 start.
- **Stripe Connect fees:** application fee % TBD (suggest 1–2% on deposits; free on Solo manual mode).

## 8. Operational facts

- GitHub: `sandevdesarrollo-ops/inksync-crm` (public) — Vercel `inksync-crm` project auto-deploys `main` (team alex-hivesourced).
- Live: https://inksync-crm.vercel.app
- Supabase: project `inksync`, ref `kpelksbqacdkfzgujyil`, eu-central-1. Secrets in `.env.local` (never committed) + Vercel env vars.
- Provisioning/pushes run through the owner's Composio MCP (GitHub/Vercel/Supabase connected); this machine has no local git credentials.
- i18n rule: every user-facing string through i18next; per-module JSON under `src/i18n/locales/<lng>/`.
- Design rules: DESIGN.md is binding — dark ink theme, gold accent for primary actions only, Fraunces/Manrope, no nested cards, no dead buttons.
