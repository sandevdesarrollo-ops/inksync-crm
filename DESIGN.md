# InkSync — Design System

Premium CRM for tattoo studios. The UI should feel like a high-end studio: dark, confident, precise — never like a generic AI-generated admin template.

## Visual theme
- **Dark ink aesthetic by default.** Deep blue-tinted charcoal backgrounds — never pure black, never pure gray (always tinted).
- One reserved accent: **gold** (`--primary`, hsl(41 86% 56%)). Used ONLY for primary CTAs, active nav, key highlights. Everything else stays neutral.
- Status colors: success (green), warning (orange), destructive (red) — used for badges/status only, sparingly.
- No purple-to-blue gradients. No glassmorphism. No decorative gradients on cards.

## Typography
- **Display serif: "Fraunces"** — page titles, big numbers/KPIs, brand.
- **UI sans: "Manrope"** — everything else. Never Inter/Arial.
- Scale: 12px meta → 14px body → 16px emphasized → 22/28px section titles (Fraunces) → 36px+ KPI numbers (Fraunces).
- Tailwind: `font-display` = Fraunces, `font-sans` = Manrope.

## Layout & spacing
- Fixed sidebar (dark, flat — no gradient), content area max-w none, page padding `p-6 lg:p-8`.
- Page header pattern: Fraunces title + one-line muted description + primary action button on the right.
- **No nested cards.** Cards contain flat content; use dividers/spacing inside, not more cards.
- Tables for dense data, cards for visual data (designs, team). 8px spacing grid.

## Components & interaction
- Icons: lucide-react only. Never emoji-as-icons.
- Every interactive element: hover state (150–300ms transition), visible focus ring (gold), cursor-pointer, disabled = tinted neutral (not gray-400).
- No dead buttons — every control does something real against the store.
- Empty states: icon + one sentence + action button.
- Motion: fade/slide 150–300ms ease-out. No bounce/elastic. Respect `prefers-reduced-motion`.
- Charts (recharts): gold for the primary series, muted tints for the rest; no rainbow palettes; hide gridline clutter.

## Responsive
Works at 375 / 768 / 1024 / 1440. Sidebar collapses to sheet drawer below `lg`.

## Language
All user-facing strings via i18next `t()` keys (EN default, ES, BG). No hardcoded UI copy in components.
