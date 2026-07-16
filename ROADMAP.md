# InkSync — Roadmap

> **The canonical product spec is [SPEC.md](SPEC.md)** — features, tiers, architecture, and risks live there. This file is just the phase tracker.

## Done
- **v1 app** — all 12 CRM modules, local-first, EN/ES/BG, live at https://inksync-crm.vercel.app
- **Infrastructure** — GitHub → Vercel auto-deploy; Supabase (eu-central-1) with migration 0001 (multi-tenant CRM schema + RLS + signup bootstrap) and migration 0002 (v2 booking platform schema: variants, holds + no-double-booking constraint, consent, intake, try-on leads, waitlist, flash drops, events, reviews, policies, payments, Instagram, locations, public-read RLS).

## Next (see SPEC.md §6 for detail)
- **Phase 0** — Auth + migrate app store from localStorage to Supabase; demo-studio seeding on signup.
- **Phase 1** — Design variants UI, booking engine (availability, holds), minimal public studio page, transactional email (Resend). *The demo that closes studios.*
- **Phase 2** — Stripe Connect deposits + application fee, no-show policy engine. *The no-show killer.*
- **Phase 3** — Consent forms (QR + encryption), custom-tattoo intake, try-on lead capture → nurture. *The "they get us" release.*
- **Phase 4** — Flash drops, events, waitlist/backfill, aftercare + review loop, Instagram insights. *The promotion engine.*
- **Phase 5** — Premium site customization, custom domains, multi-location, AR try-on, social posting automation.

## Launch checklist (unchanged)
Vercel + Supabase EU ✓ · GDPR privacy policy + DPA before real client data · pricing per SPEC.md §4 · marketing site with benefit-led copy · sales motion: live demo on an iPad, lead with the Instagram-inbox pain.
