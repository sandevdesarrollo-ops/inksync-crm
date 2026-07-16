# Phase 1 module brief (read AGENT_BRIEF.md first — all its rules apply)

Extra context for Phase 1 modules. Project root: `/Users/alexsandev/Desktop/Claude Code/inksync-crm`.

## What Phase 1 is
Public client-facing studio site at `/s/:slug` + deposit-gated booking + studio-side variant management. Spec: `SPEC.md` §3.1–3.3, §3.12. Schema: `supabase/migrations/0002_*.sql` and `0003_*.sql`.

## Key files
- `src/lib/publicApi.js` — ALL public-site data access: `fetchPublicStudio(slug)` (bundle: `{studio, artists, designs, variants}`, snake_case fields), `fetchSlots`, `createHold`, `createBooking`, `submitIntake`, `submitTryonLead`, `downloadIcs`. Use these; do not write new supabase queries on public pages.
- `src/public/PublicSiteLayout.jsx` — loads the bundle, provides it via `useOutletContext()`. Child pages: `PublicHomePage.jsx`, `PublicArtistPage.jsx` (route `artists/:artistId`), `PublicBookingPage.jsx` (route `book`, query params `?design=&variant=&artist=`).
- Studio-side store: `useStore` now also has `variants` (app-shape: `{id, designId, sizeCm, placements[], price, durationMinutes, active}`) and `projects` collections; `settings` gained `slug, published, publicBio, instagramHandle, timezone`.

## Public-site rules
- The public site is what CLIENTS see — it must feel like the studio's own site, not an admin tool. Same dark-ink design system, but more editorial: bigger imagery, Fraunces headlines, generous whitespace.
- Public pages must NOT import `useStore` or anything auth-related. Bundle via `useOutletContext()`, actions via `publicApi`.
- i18n: create your OWN locale files (e.g. `publicHome.json`) with a unique top-level key, in all three languages. Do NOT edit `public.json` or `common.json` (shared, conflict risk).
- Currency: `fmtMoney` from `@/lib/store` is fine to import (pure function). Use `studio.currency`.
- Variants are the ONLY size/price options shown — never free-form size input. A design with no variants shows "consultation required" → intake form.
- Every lead-capture writes through publicApi and fails gracefully with a toast.

## Booking flow contract (PublicBookingPage)
1. Pre-select design/variant/artist from query params when present; otherwise let the client pick (variant picker shows size cm, placements, price, duration).
2. Artist select (only artists; if design has an artist_id, default to them) → date picker (next 30 days) → `fetchSlots({studioId, artistId, day: 'YYYY-MM-DD', durationMinutes})` → slot grid.
3. Slot chosen → `createHold(...)` (15-min hold; show a subtle countdown) → details form: name, email, phone, notes + REQUIRED policy-acknowledgment checkbox (text: deposit of `studio.deposit_percent`% due at confirmation, cancellation under 48h forfeits deposit).
4. `createBooking({holdId, ...})` → on `{ok: true}`: success screen with date/time, price + deposit (fmtMoney), "Add to calendar" button (`downloadIcs`), note that a confirmation email is on its way. On `{ok:false, error:'hold_expired'|'slot_taken'}`: friendly recovery back to slot picker.
5. Steps must work at 375px. No dead ends: every error state has a path back.

## Verify
`npx vite build --logLevel error --outDir .build-<module>` then remove the dir. Do NOT run the dev server; do NOT sign up test accounts.
