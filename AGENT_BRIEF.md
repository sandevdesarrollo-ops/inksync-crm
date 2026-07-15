# InkSync module build brief

You are building one module of InkSync, a premium CRM for tattoo studios.
Project root: `/Users/alexsandev/Desktop/Claude Code/inksync-crm` (Vite + React 18, plain JSX — NO TypeScript).

## Read these first (mandatory)
1. `DESIGN.md` — design system. Follow it exactly.
2. `src/lib/store.js` — zustand store API (`useStore`, `add/update/remove/setSettings/logActivity/sendMessage/resetDemo`, `fmtMoney`).
3. `src/lib/seed.js` — entity schemas and demo data. Your UI must match these field names.
4. `src/components/layout/PageHeader.jsx` — use it for every page header.
5. `src/i18n/locales/en/common.json` — reusable `common.*` keys.

## Available libraries
- shadcn components in `src/components/ui/` (button, card, dialog, input, label, select, tabs, table, badge, avatar, textarea, switch, dropdown-menu, tooltip, progress, separator, scroll-area, sheet, checkbox, slider…). Import like `@/components/ui/button`.
- `lucide-react` icons, `framer-motion`, `recharts`, `date-fns`, `clsx`/`cn` from `@/lib/utils`.
- Toasts: `import { useToast } from '@/components/ui/use-toast'` — Toaster is already mounted.

## Hard rules
- **Every user-facing string** goes through `useTranslation()` → `t('yourmodule.someKey')`. Create THREE locale files: `src/i18n/locales/en/<module>.json`, `.../es/<module>.json`, `.../bg/<module>.json`. Each must have ONE top-level key = your module name (e.g. `{ "clients": { ... } }`). Translate ES and BG properly (natural, not literal).
- **No dead buttons.** Every control reads/writes the store or opens something real. Persist via store actions (they auto-save to localStorage).
- Extra components go in `src/components/<module>/`. Do NOT edit shared files: `App.jsx`, `store.js`, `seed.js`, layout files, `common.json`, other modules' files.
- Money: `fmtMoney(n, settings.currency)`. Dates: `date-fns` `format`.
- Follow DESIGN.md: dark ink theme, gold accent only for primary actions, Fraunces via `font-display` for titles/KPIs, no nested cards, hover/focus states, empty states with icon + sentence + action, subtle framer-motion fades (150–300ms).
- Responsive: usable at 375px and 1440px.

## Verify before finishing
Run `npx vite build --logLevel error --outDir .build-<yourmodule>` from the project root; fix all errors; then `rm -rf .build-<yourmodule>`. Do not run the dev server.

## Return
A short summary: files created, features implemented, any deviations.
