-- InkSync v2 — booking platform, public site, consent, promotion engine.
-- See SPEC.md §3. Builds on 0001_init.sql.

create extension if not exists btree_gist;

-- ---------- Multi-location (Empire tier) ----------
create table locations (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  timezone text not null default 'Europe/Madrid',
  created_at timestamptz not null default now()
);
alter table artists add column location_id uuid references locations(id);
alter table appointments add column location_id uuid references locations(id);

-- ---------- Publishing (public studio site) ----------
alter table studios add column published boolean not null default false;
alter table studios add column public_bio text;
alter table studios add column instagram_handle text;
alter table studios add column plan text not null default 'solo' check (plan in ('solo','studio','empire'));
alter table artists add column published boolean not null default false;
alter table artists add column public_bio text;
alter table designs add column published boolean not null default false;

-- ---------- Design variants (constrained sizes/placements) ----------
create table design_variants (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  design_id uuid not null references designs(id) on delete cascade,
  size_cm numeric(5,1) not null,
  placements text[] not null default '{}',   -- artist-approved locations for this size
  price numeric(12,2) not null,
  duration_minutes int not null,             -- drives slot length in booking
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Booking engine ----------
-- Appointments gain booking metadata; time-range column powers the no-double-booking constraint.
alter table appointments add column variant_id uuid references design_variants(id);
alter table appointments add column source text not null default 'studio' check (source in ('studio','public','flash_drop','event','waitlist'));
alter table appointments add column policy_acknowledged_at timestamptz;
alter table appointments add column time_range tstzrange
  generated always as (tstzrange(start_at, start_at + make_interval(mins => duration_minutes))) stored;

-- An artist can never be double-booked (cancelled slots don't block).
alter table appointments add constraint no_artist_overlap
  exclude using gist (artist_id with =, time_range with &&)
  where (status in ('pending','confirmed') and artist_id is not null);

-- 15-minute checkout holds; expired holds are ignored by availability and reaped by a scheduled job.
create table booking_holds (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  artist_id uuid not null references artists(id) on delete cascade,
  variant_id uuid references design_variants(id),
  client_email text not null,
  start_at timestamptz not null,
  duration_minutes int not null,
  expires_at timestamptz not null default now() + interval '15 minutes',
  created_at timestamptz not null default now()
);
create index on booking_holds (artist_id, start_at) ;

-- ---------- No-show policy ----------
create table studio_policies (
  studio_id uuid primary key references studios(id) on delete cascade,
  policy_text jsonb not null default '{}',          -- {en: "...", es: "...", bg: "..."}
  forfeit_window_hours int not null default 48,     -- cancel closer than this → deposit kept
  free_reschedules int not null default 1,
  late_grace_minutes int not null default 15,
  updated_at timestamptz not null default now()
);

-- ---------- Payments (Stripe Connect) ----------
create table payments (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  proposal_id uuid references proposals(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  kind text not null default 'deposit' check (kind in ('deposit','balance','refund')),
  amount numeric(12,2) not null,
  application_fee numeric(12,2) not null default 0, -- InkSync platform cut
  currency text not null default 'EUR',
  stripe_payment_intent text,
  stripe_account text,
  status text not null default 'pending' check (status in ('pending','succeeded','refunded','failed')),
  created_at timestamptz not null default now()
);
alter table studios add column stripe_account_id text;

-- ---------- Consent forms ----------
create table consent_templates (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  title text not null,
  body jsonb not null,                 -- {en: markdown, es: ..., bg: ...}
  health_questions jsonb not null default '[]',
  version int not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table consent_signatures (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  template_id uuid not null references consent_templates(id),
  template_version int not null,
  client_id uuid not null references clients(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  signature_image text not null,           -- data-URL of signature pad stroke
  health_answers_encrypted text,           -- GDPR special-category: encrypted blob (Phase 3 finalizes scheme)
  signed_at timestamptz not null default now(),
  signer_ip inet,
  signed_via text not null default 'ipad' check (signed_via in ('ipad','qr','link')),
  pdf_path text                             -- rendered PDF in Storage
);

-- Client medical flags surfaced to artists (non-encrypted summary flags only, e.g. "nickel allergy").
alter table clients add column medical_flags text[] not null default '{}';

-- ---------- Custom tattoo intake ----------
create table intake_requests (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  artist_id uuid references artists(id) on delete set null,
  client_id uuid references clients(id) on delete set null,  -- linked if/when known
  name text not null,
  email text not null,
  phone text,
  placement text,
  approx_size_cm numeric(5,1),
  budget_min numeric(12,2),
  budget_max numeric(12,2),
  description text,
  reference_paths text[] not null default '{}',   -- Storage uploads
  status text not null default 'new' check (status in ('new','replied','quoted','booked','declined')),
  created_at timestamptz not null default now()
);

-- ---------- Try-on leads ----------
create table tryon_leads (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  design_id uuid references designs(id) on delete set null,
  email text not null,
  placement_hint text,
  preview_path text,                  -- saved composite (client opted in)
  client_id uuid references clients(id) on delete set null,
  nurture_stage text not null default 'new' check (nurture_stage in ('new','nurturing','booked','cold')),
  created_at timestamptz not null default now()
);

-- ---------- Waitlist + backfill ----------
create table waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  artist_id uuid references artists(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  -- explicit signup, or an existing far-out booking that opted into earlier slots
  kind text not null default 'signup' check (kind in ('signup','move_earlier')),
  appointment_id uuid references appointments(id) on delete cascade,  -- for move_earlier
  window_start date,
  window_end date,
  status text not null default 'waiting' check (status in ('waiting','offered','claimed','expired','cancelled')),
  offered_at timestamptz,
  offer_expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Flash drops + events ----------
create table flash_drops (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  design_id uuid not null references designs(id) on delete cascade,
  variant_id uuid not null references design_variants(id),
  artist_id uuid not null references artists(id),
  title text not null,
  slots_total int not null,
  slots_claimed int not null default 0,
  price numeric(12,2) not null,
  opens_at timestamptz not null,
  closes_at timestamptz,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  title text not null,
  kind text not null default 'guest_artist' check (kind in ('guest_artist','walk_in_day','convention','anniversary','other')),
  description jsonb not null default '{}',      -- {en:..., es:..., bg:...}
  starts_at timestamptz not null,
  ends_at timestamptz,
  artist_ids uuid[] not null default '{}',
  bookable boolean not null default false,
  published boolean not null default false,
  rsvp_count int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Reviews (aftercare loop) ----------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  artist_id uuid references artists(id) on delete set null,
  design_id uuid references designs(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  text text,
  healed_photo_path text,
  publish_permission boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Instagram insights ----------
create table instagram_accounts (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  artist_id uuid references artists(id) on delete cascade,  -- null = studio account
  ig_user_id text not null,
  username text not null,
  access_token_encrypted text not null,
  token_expires_at timestamptz,
  connected_at timestamptz not null default now()
);

create table instagram_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references instagram_accounts(id) on delete cascade,
  studio_id uuid not null references studios(id) on delete cascade,
  captured_on date not null,
  followers int,
  reach_7d int,
  engagement_rate numeric(6,3),
  top_posts jsonb not null default '[]',
  unique (account_id, captured_on)
);

-- ---------- RLS ----------
do $$
declare t text;
begin
  foreach t in array array['locations','design_variants','booking_holds','studio_policies','payments',
    'consent_templates','consent_signatures','intake_requests','tryon_leads','waitlist_entries',
    'flash_drops','events','reviews','instagram_accounts','instagram_snapshots']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "member all" on %I for all using (studio_id in (select my_studio_ids())) with check (studio_id in (select my_studio_ids()))', t);
  end loop;
end $$;

-- Public (anon) read for the client-facing site: published content only.
create policy "public studios"  on studios  for select using (published = true);
create policy "public artists"  on artists  for select using (published = true and active = true);
create policy "public designs"  on designs  for select using (published = true);
create policy "public variants" on design_variants for select using (
  active = true and design_id in (select id from designs where published = true)
);
create policy "public drops"    on flash_drops for select using (published = true);
create policy "public events"   on events for select using (published = true);
create policy "public reviews"  on reviews for select using (published = true and publish_permission = true);
create policy "public policy"   on studio_policies for select using (
  studio_id in (select id from studios where published = true)
);

-- Public inserts from the client-facing site (booking prerequisites; writes only, never reads).
create policy "public intake"  on intake_requests for insert with check (true);
create policy "public tryon"   on tryon_leads     for insert with check (true);
create policy "public hold"    on booking_holds   for insert with check (true);
