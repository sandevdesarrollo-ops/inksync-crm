import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { seed } from '@/lib/seed';
import { supabase, supabaseEnabled } from '@/lib/supabase';
import { COLLECTIONS, toDb, settingsToDb, fetchStudioData, seedRemote, wipeStudioData } from '@/lib/db';
import { toast } from '@/components/ui/use-toast';

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const onDbError = (error) => {
  console.error(error);
  toast({ title: 'Sync failed', description: String(error?.message || error), variant: 'destructive' });
};

// Two modes, one API. Remote (Supabase env present): optimistic local updates,
// write-through to Postgres, hydrated per-studio after login. Local (no env):
// the original persisted demo store. All 12 modules are mode-agnostic.
const creator = (set, get) => ({
  ...(supabaseEnabled ? { hydrated: false, studioId: null } : seed()),

  hydrate: async () => {
    if (!supabaseEnabled) return;
    let data;
    try {
      data = await fetchStudioData();
    } catch (e) {
      onDbError(e);
      return;
    }
    // Brand-new studio → fill it with demo content so nothing is empty.
    if (!data.clients.length && !data.appointments.length && !data.designs.length) {
      try {
        await seedRemote(data.studioId);
        data = await fetchStudioData();
      } catch (e) {
        onDbError(e);
      }
    }
    set({ ...data, hydrated: true });
  },

  add: (collection, item) => {
    const record = { id: uid(), createdAt: new Date().toISOString(), ...item };
    set((s) => ({ [collection]: [record, ...s[collection]] }));
    if (supabaseEnabled && COLLECTIONS[collection]) {
      supabase.from(COLLECTIONS[collection].table).insert(toDb(collection, record, get().studioId))
        .then(({ error }) => {
          if (error) {
            onDbError(error);
            set((s) => ({ [collection]: s[collection].filter((x) => x.id !== record.id) }));
          }
        });
    }
    return record;
  },

  update: (collection, id, patch) => {
    set((s) => ({ [collection]: s[collection].map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
    if (supabaseEnabled && COLLECTIONS[collection]) {
      const row = toDb(collection, patch, get().studioId);
      delete row.id;
      supabase.from(COLLECTIONS[collection].table).update(row).eq('id', id)
        .then(({ error }) => error && onDbError(error));
    }
  },

  remove: (collection, id) => {
    set((s) => ({ [collection]: s[collection].filter((x) => x.id !== id) }));
    if (supabaseEnabled && COLLECTIONS[collection]) {
      supabase.from(COLLECTIONS[collection].table).delete().eq('id', id)
        .then(({ error }) => error && onDbError(error));
    }
  },

  setSettings: (patch) => {
    set((s) => ({ settings: { ...s.settings, ...patch } }));
    if (supabaseEnabled) {
      supabase.from('studios').update(settingsToDb(patch)).eq('id', get().studioId)
        .then(({ error }) => error && onDbError(error));
    }
  },

  logActivity: ({ type, priority = 'low', text, link = null }) => {
    get().add('activities', { type, priority, text, link, time: new Date().toISOString(), done: false });
  },

  sendMessage: (conversationId, text) => {
    const msg = { id: uid(), from: 'studio', text, at: new Date().toISOString() };
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread: 0, messages: [...c.messages, msg] } : c
      ),
    }));
    if (supabaseEnabled) {
      supabase.from('messages')
        .insert({ id: msg.id, conversation_id: conversationId, studio_id: get().studioId, sender: 'studio', body: text, sent_at: msg.at })
        .then(({ error }) => error && onDbError(error));
      supabase.from('conversations').update({ unread: 0 }).eq('id', conversationId)
        .then(({ error }) => error && onDbError(error));
    }
  },

  resetDemo: async () => {
    if (!supabaseEnabled) {
      set(seed());
      return;
    }
    try {
      await wipeStudioData(get().studioId);
      await seedRemote(get().studioId);
      await get().hydrate();
    } catch (e) {
      onDbError(e);
    }
  },
});

// In remote mode nothing persists locally — Postgres is the source of truth.
export const useStore = supabaseEnabled
  ? create(creator)
  : create(persist(creator, { name: 'inksync-store', version: 1, storage: createJSONStorage(() => localStorage) }));

export const fmtMoney = (n, currency = 'EUR') =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n || 0);
