-- Phase 1: multi-session projects, public availability + booking RPCs,
-- email outbox, publish backfill. See SPEC.md §3.1–3.3, §3.12.

-- ---------- Projects (multi-session pieces) ----------
create table projects (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  artist_id uuid references artists(id) on delete set null,
  title text not null,
  status text not null default 'planned' check (status in ('planned','in_progress','completed','paused')),
  notes text,
  created_at timestamptz not null default now()
);
alter table appointments add column project_id uuid references projects(id) on delete set null;
alter table projects enable row level security;
create policy "member all" on projects for all
  using (studio_id in (select my_studio_ids()))
  with check (studio_id in (select my_studio_ids()));

-- ---------- Studio timezone (slot math) ----------
alter table studios add column timezone text not null default 'Europe/Madrid';

-- ---------- Email outbox (rendered now, delivered when Resend is wired in P2) ----------
create table email_outbox (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  to_email text not null,
  subject text not null,
  body text not null,
  kind text not null default 'booking_client' check (kind in ('booking_client','booking_artist','generic')),
  related_id uuid,
  status text not null default 'queued' check (status in ('queued','sent','failed')),
  created_at timestamptz not null default now()
);
alter table email_outbox enable row level security;
create policy "member read" on email_outbox for select using (studio_id in (select my_studio_ids()));

-- ---------- Availability: open slots for an artist on a day ----------
-- security definer: computes from private rows without exposing them to anon.
create or replace function public_available_slots(p_studio uuid, p_artist uuid, p_day date, p_duration_minutes int default null)
returns table (slot_start timestamptz)
language plpgsql security definer stable set search_path = public as $$
declare
  st studios%rowtype;
  dur int;
  day_key text;
  works boolean;
  t time;
  slot timestamptz;
  slot_end timestamptz;
begin
  select * into st from studios where id = p_studio and published = true;
  if not found then return; end if;

  dur := coalesce(p_duration_minutes, st.default_session_minutes, 120);
  day_key := lower(to_char(p_day, 'dy'));  -- mon/tue/...

  select coalesce((schedule ->> day_key)::boolean, false) into works
  from artists where id = p_artist and studio_id = p_studio and active = true and published = true;
  if not coalesce(works, false) then return; end if;

  t := st.open_time;
  while t + make_interval(mins => dur) <= st.close_time loop
    slot := (p_day::text || ' ' || t::text)::timestamp at time zone st.timezone;
    slot_end := slot + make_interval(mins => dur);

    if slot > now() + interval '2 hours'
      and not exists (
        select 1 from appointments a
        where a.artist_id = p_artist
          and a.status in ('pending','confirmed')
          and tstzrange(a.start_at, a.end_at) && tstzrange(slot, slot_end)
      )
      and not exists (
        select 1 from booking_holds h
        where h.artist_id = p_artist
          and h.expires_at > now()
          and tstzrange(h.start_at, h.start_at + make_interval(mins => h.duration_minutes)) && tstzrange(slot, slot_end)
      )
    then
      slot_start := slot;
      return next;
    end if;

    t := t + interval '30 minutes';
  end loop;
end $$;

-- ---------- Public booking: hold -> pending appointment ----------
create or replace function create_public_booking(
  p_hold uuid,
  p_name text,
  p_email text,
  p_phone text default null,
  p_notes text default null,
  p_title text default null,
  p_variant uuid default null,
  p_design uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  h booking_holds%rowtype;
  st studios%rowtype;
  v design_variants%rowtype;
  cid uuid;
  price numeric := 0;
  dep numeric := 0;
  title text;
  appt_id uuid;
  artist_name text;
  artist_email text;
begin
  select * into h from booking_holds where id = p_hold and expires_at > now();
  if not found then
    return jsonb_build_object('ok', false, 'error', 'hold_expired');
  end if;

  select * into st from studios where id = h.studio_id and published = true;
  if not found then return jsonb_build_object('ok', false, 'error', 'studio_unpublished'); end if;

  if p_variant is not null then
    select * into v from design_variants where id = p_variant and studio_id = h.studio_id;
    if found then price := v.price; end if;
  end if;
  dep := round(price * coalesce(st.deposit_percent, 30) / 100.0, 2);
  title := coalesce(nullif(p_title, ''), 'Public booking');

  select id into cid from clients where studio_id = h.studio_id and lower(email) = lower(p_email) limit 1;
  if cid is null then
    insert into clients (studio_id, name, email, phone, status, avatar)
    values (h.studio_id, p_name, p_email, p_phone, 'new',
            'https://api.dicebear.com/9.x/notionists-neutral/svg?seed=' || replace(p_name, ' ', ''))
    returning id into cid;
  end if;

  begin
    insert into appointments (studio_id, client_id, artist_id, title, start_at, duration_minutes,
                              price, deposit, status, notes, source, variant_id, policy_acknowledged_at)
    values (h.studio_id, cid, h.artist_id, title, h.start_at, h.duration_minutes,
            price, dep, 'pending', p_notes, 'public', p_variant, now())
    returning id into appt_id;
  exception when exclusion_violation then
    return jsonb_build_object('ok', false, 'error', 'slot_taken');
  end;

  delete from booking_holds where id = p_hold;

  select name, email into artist_name, artist_email from artists where id = h.artist_id;

  insert into activities (studio_id, type, priority, text, link)
  values (h.studio_id, 'appointment', 'high',
          'New public booking: ' || p_name || ' — ' || title || ' with ' || coalesce(artist_name, 'studio') ||
          ' on ' || to_char(h.start_at at time zone st.timezone, 'DD Mon HH24:MI') || '. Confirm to lock it in.',
          '/calendar');

  insert into email_outbox (studio_id, to_email, subject, body, kind, related_id) values
    (h.studio_id, p_email,
     st.name || ' — booking request received',
     'Hi ' || p_name || ',' || chr(10) || chr(10) ||
     'We received your booking request: ' || title || ' with ' || coalesce(artist_name, 'our team') ||
     ' on ' || to_char(h.start_at at time zone st.timezone, 'DD Mon YYYY at HH24:MI') || '.' || chr(10) ||
     'Estimated price: ' || price || ' ' || st.currency || ' (deposit ' || dep || ' ' || st.currency || ' due at confirmation).' || chr(10) || chr(10) ||
     'The studio will confirm shortly. — ' || st.name,
     'booking_client', appt_id);

  if artist_email is not null then
    insert into email_outbox (studio_id, to_email, subject, body, kind, related_id) values
      (h.studio_id, artist_email,
       'New booking request: ' || title,
       'Client: ' || p_name || ' (' || p_email || coalesce(', ' || p_phone, '') || ')' || chr(10) ||
       'When: ' || to_char(h.start_at at time zone st.timezone, 'DD Mon YYYY at HH24:MI') || ' (' || h.duration_minutes || ' min)' || chr(10) ||
       'Price: ' || price || ' ' || st.currency || ' — deposit ' || dep || chr(10) ||
       'Notes: ' || coalesce(p_notes, '—'),
       'booking_artist', appt_id);
  end if;

  return jsonb_build_object('ok', true, 'appointment_id', appt_id, 'start_at', h.start_at,
                            'duration_minutes', h.duration_minutes, 'price', price, 'deposit', dep);
end $$;

grant execute on function public_available_slots(uuid, uuid, date, int) to anon, authenticated;
grant execute on function create_public_booking(uuid, text, text, text, text, text, uuid, uuid) to anon, authenticated;

-- ---------- Backfill existing (demo) studios ----------
update studios set
  slug = coalesce(slug, lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))),
  published = true;
update artists set published = true where active = true;
update designs set published = true;

-- Two sensible variants for every design that has none, derived from its price.
insert into design_variants (studio_id, design_id, size_cm, placements, price, duration_minutes)
select d.studio_id, d.id, 12, array[coalesce(d.body_part, 'Forearm')], d.price, 120
from designs d where d.price is not null
  and not exists (select 1 from design_variants v where v.design_id = d.id);
insert into design_variants (studio_id, design_id, size_cm, placements, price, duration_minutes)
select d.studio_id, d.id, 18, array[coalesce(d.body_part, 'Forearm'), 'Thigh'], round(d.price * 1.5), 180
from designs d where d.price is not null
  and (select count(*) from design_variants v where v.design_id = d.id) = 1;
