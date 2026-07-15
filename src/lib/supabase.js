// Phase 1 entry point (see ROADMAP.md). The app is local-first until these
// env vars are set; then store.js can be migrated collection-by-collection.
// Requires: npm install @supabase/supabase-js
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export async function getSupabase() {
  if (!supabaseEnabled) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
