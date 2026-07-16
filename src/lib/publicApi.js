// Anonymous data access for the client-facing site (/s/:slug).
// RLS only exposes published rows; writes go through insert policies
// (holds, intakes, try-on leads) or security-definer RPCs (slots, booking).
import { supabase } from '@/lib/supabase';

const uuid = () => crypto.randomUUID();

// One bundle for the whole public site: studio + published artists,
// designs and variants. Returns null when the slug doesn't resolve.
export async function fetchPublicStudio(slug) {
  const { data: studio, error } = await supabase
    .from('studios')
    .select('id, name, slug, public_bio, instagram_handle, address, phone, email, currency, open_time, close_time, deposit_percent, timezone')
    .eq('slug', slug).eq('published', true).maybeSingle();
  if (error || !studio) return null;

  const [artists, designs, variants] = await Promise.all([
    supabase.from('artists').select('id, name, styles, avatar, public_bio').eq('studio_id', studio.id).eq('published', true).eq('active', true),
    supabase.from('designs').select('id, artist_id, title, style, body_part, price, image, tags, likes').eq('studio_id', studio.id).eq('published', true),
    supabase.from('design_variants').select('id, design_id, size_cm, placements, price, duration_minutes').eq('studio_id', studio.id).eq('active', true),
  ]);

  return {
    studio,
    artists: artists.data || [],
    designs: designs.data || [],
    variants: variants.data || [],
  };
}

export async function fetchSlots({ studioId, artistId, day, durationMinutes }) {
  const { data, error } = await supabase.rpc('public_available_slots', {
    p_studio: studioId, p_artist: artistId, p_day: day, p_duration_minutes: durationMinutes ?? null,
  });
  if (error) throw error;
  return (data || []).map((r) => r.slot_start);
}

// Reserve the slot for 15 minutes while the client fills in details.
// Insert-only (no select policy for anon), so the id is generated here.
export async function createHold({ studioId, artistId, variantId, clientEmail, startAt, durationMinutes }) {
  const id = uuid();
  const { error } = await supabase.from('booking_holds').insert({
    id, studio_id: studioId, artist_id: artistId, variant_id: variantId ?? null,
    client_email: clientEmail || 'pending@hold', start_at: startAt, duration_minutes: durationMinutes,
  });
  if (error) throw error;
  return id;
}

export async function createBooking({ holdId, name, email, phone, notes, title, variantId, designId }) {
  const { data, error } = await supabase.rpc('create_public_booking', {
    p_hold: holdId, p_name: name, p_email: email, p_phone: phone ?? null,
    p_notes: notes ?? null, p_title: title ?? null, p_variant: variantId ?? null, p_design: designId ?? null,
  });
  if (error) throw error;
  return data; // { ok, appointment_id, start_at, duration_minutes, price, deposit } | { ok:false, error }
}

export async function submitIntake({ studioId, artistId, name, email, phone, placement, approxSizeCm, budgetMin, budgetMax, description }) {
  const { error } = await supabase.from('intake_requests').insert({
    studio_id: studioId, artist_id: artistId ?? null, name, email, phone: phone ?? null,
    placement: placement ?? null, approx_size_cm: approxSizeCm ?? null,
    budget_min: budgetMin ?? null, budget_max: budgetMax ?? null, description: description ?? null,
  });
  if (error) throw error;
}

export async function submitTryonLead({ studioId, designId, email, placementHint }) {
  const { error } = await supabase.from('tryon_leads').insert({
    studio_id: studioId, design_id: designId ?? null, email, placement_hint: placementHint ?? null,
  });
  if (error) throw error;
}

// Minimal .ics so the client can add the session to their calendar.
export function downloadIcs({ title, start, durationMinutes, studioName, address }) {
  const dt = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = new Date(new Date(start).getTime() + durationMinutes * 60000);
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//InkSync//EN', 'BEGIN:VEVENT',
    `UID:${uuid()}@inksync`, `DTSTAMP:${dt(new Date())}`, `DTSTART:${dt(start)}`, `DTEND:${dt(end)}`,
    `SUMMARY:${title} — ${studioName}`, address ? `LOCATION:${address}` : null,
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'inksync-booking.ics'; a.click();
  URL.revokeObjectURL(url);
}
