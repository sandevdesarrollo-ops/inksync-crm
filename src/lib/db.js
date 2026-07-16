// Mapping layer between the app's camelCase entities (see seed.js) and the
// Supabase schema (snake_case, see supabase/migrations/). The store keeps the
// app shapes; everything crossing the wire goes through toDb/fromDb.
import { supabase } from '@/lib/supabase';
import { seed } from '@/lib/seed';

// collection -> { table, same: [fields kept as-is], renames: { appField: db_field } }
export const COLLECTIONS = {
  clients: {
    table: 'clients',
    same: ['name', 'email', 'phone', 'avatar', 'visits', 'styles', 'notes', 'status'],
    renames: { joinDate: 'join_date', totalSpent: 'total_spent', preferredArtistId: 'preferred_artist_id', lastVisit: 'last_visit' },
  },
  artists: {
    table: 'artists',
    same: ['name', 'role', 'styles', 'avatar', 'phone', 'email', 'schedule', 'active', 'published'],
    renames: { hourlyRate: 'hourly_rate', publicBio: 'public_bio' },
  },
  appointments: {
    table: 'appointments',
    same: ['title', 'price', 'deposit', 'status', 'notes'],
    renames: { clientId: 'client_id', artistId: 'artist_id', start: 'start_at', durationMinutes: 'duration_minutes' },
  },
  designs: {
    table: 'designs',
    same: ['title', 'style', 'price', 'image', 'tags', 'likes', 'published'],
    renames: { artistId: 'artist_id', bodyPart: 'body_part' },
  },
  inventory: {
    table: 'inventory',
    same: ['name', 'brand', 'category', 'stock', 'price', 'supplier'],
    renames: { minStock: 'min_stock' },
  },
  proposals: {
    table: 'proposals',
    same: ['title', 'amount', 'deposit', 'status', 'notes'],
    renames: { clientId: 'client_id', artistId: 'artist_id', sentAt: 'sent_at', paidAt: 'paid_at', depositLink: 'deposit_link' },
  },
  activities: {
    table: 'activities',
    same: ['type', 'priority', 'text', 'link', 'done'],
    renames: { time: 'created_at' },
  },
  nurtures: {
    table: 'nurtures',
    same: ['name', 'trigger', 'channel', 'active', 'sent', 'opened', 'template'],
    renames: {},
  },
  variants: {
    table: 'design_variants',
    same: ['placements', 'price', 'active'],
    renames: { designId: 'design_id', sizeCm: 'size_cm', durationMinutes: 'duration_minutes' },
  },
  projects: {
    table: 'projects',
    same: ['title', 'status', 'notes'],
    renames: { clientId: 'client_id', artistId: 'artist_id' },
  },
  // messages are handled specially (sendMessage / fetchStudioData join);
  // this entry lets add/update/remove work on the conversation row itself.
  conversations: {
    table: 'conversations',
    same: ['channel', 'unread'],
    renames: { clientId: 'client_id' },
  },
};

export function toDb(collection, item, studioId) {
  const { same, renames } = COLLECTIONS[collection];
  const row = { studio_id: studioId };
  if (item.id) row.id = item.id;
  for (const f of same) if (item[f] !== undefined) row[f] = item[f];
  for (const [app, db] of Object.entries(renames)) if (item[app] !== undefined) row[db] = item[app];
  return row;
}

export function fromDb(collection, row) {
  const { same, renames } = COLLECTIONS[collection];
  const item = { id: row.id };
  for (const f of same) if (row[f] !== undefined) item[f] = row[f];
  for (const [app, db] of Object.entries(renames)) if (row[db] !== undefined) item[app] = row[db];
  return item;
}

const SETTINGS_MAP = {
  studioName: 'name', address: 'address', phone: 'phone', email: 'email', currency: 'currency',
  openTime: 'open_time', closeTime: 'close_time', defaultSessionMinutes: 'default_session_minutes',
  depositPercent: 'deposit_percent', notifications: 'notifications',
  slug: 'slug', published: 'published', publicBio: 'public_bio',
  instagramHandle: 'instagram_handle', timezone: 'timezone',
};

export function settingsToDb(patch) {
  const row = {};
  for (const [app, db] of Object.entries(SETTINGS_MAP)) if (patch[app] !== undefined) row[db] = patch[app];
  return row;
}

function settingsFromDb(row) {
  const s = {};
  for (const [app, db] of Object.entries(SETTINGS_MAP)) s[app] = row[db];
  // time columns come back as HH:MM:SS
  s.openTime = (s.openTime || '10:00').slice(0, 5);
  s.closeTime = (s.closeTime || '20:00').slice(0, 5);
  return s;
}

const msgFromDb = (m) => ({ id: m.id, from: m.sender, text: m.body, at: m.sent_at });

// Fetch every collection for the signed-in member's studio in one go.
export async function fetchStudioData() {
  const { data: studios, error } = await supabase.from('studios').select('*').limit(1);
  if (error) throw error;
  if (!studios?.length) throw new Error('no-studio');
  const studio = studios[0];

  const names = Object.keys(COLLECTIONS);
  const [collections, convs, msgs] = await Promise.all([
    Promise.all(names.map((c) => supabase.from(COLLECTIONS[c].table).select('*').order('created_at', { ascending: false }))),
    supabase.from('conversations').select('*'),
    supabase.from('messages').select('*').order('sent_at', { ascending: true }),
  ]);

  const state = { studioId: studio.id, settings: settingsFromDb(studio) };
  names.forEach((c, i) => {
    if (collections[i].error) throw collections[i].error;
    state[c] = collections[i].data.map((row) => fromDb(c, row));
  });

  const byConv = {};
  for (const m of msgs.data || []) (byConv[m.conversation_id] ??= []).push(msgFromDb(m));
  state.conversations = (convs.data || []).map((c) => ({
    id: c.id, clientId: c.client_id, channel: c.channel, unread: c.unread,
    messages: byConv[c.id] || [],
  }));

  return state;
}

// First-login experience: fill an empty studio with the demo dataset so every
// module has life in it. Regenerates all ids as UUIDs and remaps references.
export async function seedRemote(studioId) {
  const s = seed();
  const idMap = {};
  const uuid = () => crypto.randomUUID();
  const remap = (old) => (old ? (idMap[old] ??= uuid()) : old);

  const withRefs = (collection, items, refs, extra = {}) =>
    items.map((it) => {
      const copy = { ...it, ...extra, id: remap(it.id) };
      for (const r of refs) copy[r] = remap(copy[r]);
      return toDb(collection, copy, studioId);
    });

  // Demo variants: two artist-fixed size/placement options per design.
  const variantRows = s.designs.flatMap((d) => [
    { designId: d.id, sizeCm: 12, placements: [d.bodyPart || 'Forearm'], price: d.price, durationMinutes: 120 },
    { designId: d.id, sizeCm: 18, placements: [d.bodyPart || 'Forearm', 'Thigh'], price: Math.round(d.price * 1.5), durationMinutes: 180 },
  ]).filter((v) => v.price);

  const inserts = [
    ['artists', withRefs('artists', s.artists, [], { published: true })],
    ['clients', withRefs('clients', s.clients, ['preferredArtistId'])],
    ['appointments', withRefs('appointments', s.appointments, ['clientId', 'artistId'])],
    ['designs', withRefs('designs', s.designs, ['artistId'], { published: true })],
    ['variants', variantRows.map((v) => toDb('variants', { ...v, id: uuid(), designId: remap(v.designId) }, studioId))],
    ['projects', [toDb('projects', { id: uuid(), clientId: remap('c4'), artistId: remap('a3'), title: 'Full sleeve — dragon & koi', status: 'in_progress', notes: 'Session 6 of ~10. Shading phase.' }, studioId)]],
    ['inventory', withRefs('inventory', s.inventory, [])],
    ['proposals', withRefs('proposals', s.proposals, ['clientId', 'artistId'])],
    ['activities', s.activities.map((a) => toDb('activities', { ...a, id: uuid() }, studioId))],
    ['nurtures', s.nurtures.map((n) => toDb('nurtures', { ...n, id: uuid() }, studioId))],
  ];
  for (const [c, rows] of inserts) {
    const { error } = await supabase.from(COLLECTIONS[c].table).insert(rows);
    if (error) throw error;
  }

  const convRows = s.conversations.map((c) => ({ id: remap(c.id), studio_id: studioId, client_id: remap(c.clientId), channel: c.channel, unread: c.unread }));
  const { error: ce } = await supabase.from('conversations').insert(convRows);
  if (ce) throw ce;
  const msgRows = s.conversations.flatMap((c) =>
    c.messages.map((m) => ({ id: uuid(), conversation_id: idMap[c.id], studio_id: studioId, sender: m.from, body: m.text, sent_at: m.at }))
  );
  const { error: me } = await supabase.from('messages').insert(msgRows);
  if (me) throw me;

  // Business-rule defaults only — never overwrite the studio's own identity
  // (name/address/phone/email) chosen at signup.
  const { studioName, address, phone, email, ...rules } = s.settings;
  await supabase.from('studios').update(settingsToDb(rules)).eq('id', studioId);

  // Publish the public page with a slug derived from the studio's own name.
  const { data: studioRow } = await supabase.from('studios').select('name').eq('id', studioId).single();
  const base = (studioRow?.name || 'studio').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'studio';
  const { error: slugErr } = await supabase.from('studios').update({ slug: base, published: true }).eq('id', studioId);
  if (slugErr) {
    await supabase.from('studios').update({ slug: `${base}-${studioId.slice(0, 4)}`, published: true }).eq('id', studioId);
  }
}

export async function wipeStudioData(studioId) {
  // Order matters for FKs; messages/conversations first, artists last.
  const tables = ['messages', 'conversations', 'activities', 'nurtures', 'proposals', 'email_outbox', 'booking_holds', 'appointments', 'design_variants', 'designs', 'projects', 'inventory', 'clients', 'artists'];
  for (const t of tables) {
    const { error } = await supabase.from(t).delete().eq('studio_id', studioId);
    if (error) throw error;
  }
}
