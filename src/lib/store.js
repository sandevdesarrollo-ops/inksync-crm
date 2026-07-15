import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seed } from '@/lib/seed';

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Collections: clients, artists, appointments, designs, inventory,
// proposals, conversations, activities, nurtures. Plus `settings` object.
export const useStore = create(
  persist(
    (set, get) => ({
      ...seed(),

      add: (collection, item) => {
        const record = { id: uid(), createdAt: new Date().toISOString(), ...item };
        set((s) => ({ [collection]: [record, ...s[collection]] }));
        return record;
      },

      update: (collection, id, patch) =>
        set((s) => ({
          [collection]: s[collection].map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),

      remove: (collection, id) =>
        set((s) => ({ [collection]: s[collection].filter((x) => x.id !== id) })),

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      logActivity: ({ type, priority = 'low', text, link = null }) =>
        set((s) => ({
          activities: [
            { id: uid(), type, priority, text, link, time: new Date().toISOString(), done: false },
            ...s.activities,
          ],
        })),

      sendMessage: (conversationId, text) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, unread: 0, messages: [...c.messages, { id: uid(), from: 'studio', text, at: new Date().toISOString() }] }
              : c
          ),
        })),

      resetDemo: () => set(seed()),
    }),
    { name: 'inksync-store', version: 1 }
  )
);

export const fmtMoney = (n, currency = 'EUR') =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n || 0);
