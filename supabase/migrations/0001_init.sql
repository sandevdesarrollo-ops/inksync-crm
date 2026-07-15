-- InkSync Phase 1 schema — multi-tenant, RLS-secured.
-- Run in the Supabase SQL editor (or `supabase db push`).

create extension if not exists "pgcrypto";

-- ---------- Tenancy ----------
create table studios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  address text,
  phone text,
  email text,
  currency text not null default 'EUR',
  open_time time not null default '10:00',
  close_time time not null default '20:00',
  default_session_minutes int not null default 120,
  deposit_percent int not null default 30,
  notifications jsonb not null default '{"appointmentReminders":true,"lowStock":true,"newClients":true}',
  created_at timestamptz not null default now()
);

-- Membership: which auth users belong to which studio, and their role.
create table memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  studio_id uuid not null references studios(id) on delete cascade,
  role text not null default 'artist' check (role in ('owner','artist','front_desk','apprentice')),
  primary key (user_id, studio_id)
);

create or replace function my_studio_ids() returns setof uuid
language sql stable security definer set search_path = public as
$$ select studio_id from memberships where user_id = auth.uid() $$;

-- ---------- Entities ----------
create table artists (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  user_id uuid references auth.users(id),
  name text not null,
  role text not null default 'artist' check (role in ('owner','artist','apprentice')),
  styles text[] not null default '{}',
  avatar text,
  phone text,
  email text,
  hourly_rate numeric(10,2),
  schedule jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  avatar text,
  join_date date not null default current_date,
  visits int not null default 0,
  total_spent numeric(12,2) not null default 0,
  preferred_artist_id uuid references artists(id),
  styles text[] not null default '{}',
  notes text,
  status text not null default 'new' check (status in ('new','active','vip','inactive')),
  last_visit date,
  created_at timestamptz not null default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  artist_id uuid references artists(id),
  title text not null,
  start_at timestamptz not null,
  duration_minutes int not null default 120,
  price numeric(12,2) not null default 0,
  deposit numeric(12,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  notes text,
  created_at timestamptz not null default now()
);
create index on appointments (studio_id, start_at);

create table designs (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  artist_id uuid references artists(id),
  title text not null,
  style text,
  body_part text,
  price numeric(12,2),
  image text, -- storage path or URL
  tags text[] not null default '{}',
  likes int not null default 0,
  created_at timestamptz not null default now()
);

create table inventory (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  name text not null,
  brand text,
  category text not null default 'supplies',
  stock int not null default 0,
  min_stock int not null default 0,
  price numeric(10,2),
  supplier text,
  created_at timestamptz not null default now()
);

create table proposals (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  artist_id uuid references artists(id),
  title text not null,
  amount numeric(12,2) not null,
  deposit numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','sent','deposit_paid','accepted','expired')),
  sent_at timestamptz,
  paid_at timestamptz,
  deposit_link text, -- Stripe Payment Link (Phase 2)
  notes text,
  created_at timestamptz not null default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  channel text not null check (channel in ('instagram','whatsapp','facebook','email')),
  unread int not null default 0,
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  studio_id uuid not null references studios(id) on delete cascade,
  sender text not null check (sender in ('client','studio')),
  body text not null,
  sent_at timestamptz not null default now()
);
create index on messages (conversation_id, sent_at);

create table activities (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  type text not null,
  priority text not null default 'low' check (priority in ('high','medium','low')),
  text text not null,
  link text,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table nurtures (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  name text not null,
  trigger text not null,
  channel text not null default 'email' check (channel in ('email','whatsapp','sms')),
  active boolean not null default true,
  sent int not null default 0,
  opened int not null default 0,
  template text,
  created_at timestamptz not null default now()
);

-- ---------- RLS: studios only see their own data ----------
do $$
declare t text;
begin
  foreach t in array array['studios','artists','clients','appointments','designs','inventory','proposals','conversations','messages','activities','nurtures']
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

alter table memberships enable row level security;
create policy "own memberships" on memberships for select using (user_id = auth.uid());

create policy "member read"  on studios for select using (id in (select my_studio_ids()));
create policy "owner update" on studios for update using (
  id in (select studio_id from memberships where user_id = auth.uid() and role = 'owner')
);

do $$
declare t text;
begin
  foreach t in array array['artists','clients','appointments','designs','inventory','proposals','conversations','messages','activities','nurtures']
  loop
    execute format('create policy "member all" on %I for all using (studio_id in (select my_studio_ids())) with check (studio_id in (select my_studio_ids()))', t);
  end loop;
end $$;

-- ---------- Signup bootstrap: new user gets a studio + owner membership ----------
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  insert into studios (name, email) values (coalesce(new.raw_user_meta_data->>'studio_name','My Studio'), new.email) returning id into sid;
  insert into memberships (user_id, studio_id, role) values (new.id, sid, 'owner');
  insert into artists (studio_id, user_id, name, role, email)
    values (sid, new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), 'owner', new.email);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
