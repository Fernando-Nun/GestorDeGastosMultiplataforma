# Plan: Expense Manager App (Liquid Glass, Mobile-First)

## Context

The user wants a polished mobile-first cross-platform expense manager built as a React web app with a liquid glass (glassmorphism) design language. The app targets Android/iOS visual conventions rendered as a PWA-style web app inside Figma Make. The codebase is a blank React 19 + Vite + Tailwind v4 scaffold with no existing components.

**Key goals:**
- Supabase auth + database for persistence
- Liquid glass components throughout
- Splash screen with zoom transition into the app
- Smooth animated auth flow (Login ↔ Register ↔ ForgotPassword)
- Dashboard with color-coded expense reminders (green/yellow/red)
- USD→MXN real-time currency conversion
- Dark/light mode + settings screen
- Micro-animations throughout

---

## Aesthetic Stance

**Style:** Modern liquid glass (glassmorphism) — frosted transparent cards with `backdrop-filter: blur`, subtle white/translucent borders, soft inner shadows. Mobile-first viewport (390×844px max-width centered).

**Fonts (Google Fonts via CSS @import in index.css):**
- Display/Headings: **Outfit** (400, 600, 700)
- Body: **Inter** (400, 500, 600)

**Palette (dark mode default, light mode available):**
- Dark ground: deep indigo-near-black `#0a0a1a` with a subtle radial gradient mesh (purple/blue tones)
- Light ground: `#f0f2ff` with soft pastel mesh
- Glass cards: `rgba(255,255,255,0.08)` dark / `rgba(255,255,255,0.65)` light
- Primary accent: electric violet `#7c5cfc`
- Green (on-time): `#34d399`
- Yellow (warning): `#fbbf24`
- Red (urgent): `#f87171`
- Text: white / near-white on dark, `#1a1a2e` on light

---

## File Structure

```
src/
  components/
    auth/
      SplashScreen.tsx       # Logo + animated zoom-out transition
      AuthScreen.tsx         # Manages Login / Register / ForgotPassword tabs
      LoginForm.tsx
      RegisterForm.tsx
      ForgotPasswordForm.tsx
    dashboard/
      Dashboard.tsx          # Main expense list screen
      ExpenseCard.tsx        # Glass card with urgency color ring
      EmptyState.tsx
    expenses/
      ExpenseForm.tsx        # Shared Add / Edit form modal
      CurrencyConverter.tsx  # USD→MXN conversion display
    settings/
      SettingsScreen.tsx     # Theme toggle, notifications, profile
    ui/
      GlassCard.tsx          # Base frosted glass container
      GlassButton.tsx        # Primary / ghost glass buttons
      GlassInput.tsx         # Frosted text input
      GlassSelect.tsx        # Currency selector
      BottomNav.tsx          # Dashboard / Settings navigation bar
      UrgencyBadge.tsx       # Green / Yellow / Red status pill
      LogoPlaceholder.tsx    # Reserved logo+name slot
  contexts/
    AuthContext.tsx           # Supabase auth state + helpers
    ThemeContext.tsx          # Light/dark toggle, persisted to localStorage
    ExpensesContext.tsx       # Expenses CRUD + real-time subscription
  lib/
    supabase.ts               # createClient with env vars
    currency.ts               # fetchUSDtoMXN() using frankfurter.app
  App.tsx                     # Router / screen orchestration
  index.css                   # Tailwind @import, Google Fonts, CSS tokens
```

---

## Dependencies to Install

```bash
pnpm add @supabase/supabase-js framer-motion react-router-dom
```

- `@supabase/supabase-js` — auth + database
- `framer-motion` — all animations (splash zoom, form transitions, card animations)
- `react-router-dom` v6 — screen routing (Dashboard, Settings)

---

## Supabase Schema

**Table: `expenses`**
```sql
create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  service_name text not null,
  payment_day integer not null check (payment_day between 1 and 31),
  card_label text,
  amount numeric(10,2) not null,
  currency text not null default 'MXN',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table expenses enable row level security;

create policy "own expenses" on expenses
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

User will need to run this SQL in Supabase's SQL editor. The `supabase_connect` MCP tool will be called during implementation to prompt connection.

**Environment variables** (user must add to `.env.local`):
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## Currency Conversion

Use **frankfurter.app** — free, no API key needed:
```
GET https://api.frankfurter.app/latest?from=USD&to=MXN
```

Implemented in `src/lib/currency.ts`. The `ExpenseForm` fetches rate on mount and caches it for the session. When user selects USD, the form shows both `$X USD` and `≈ $Y MXN` below the amount input.

---

## Screen Flow & Navigation

```
App opens
  └── SplashScreen (framer-motion: logo scale in → page zoom-out)
        ├── user not logged in → AuthScreen
        │     ├── LoginForm
        │     ├── RegisterForm  (smooth slide/fade between forms)
        │     └── ForgotPasswordForm
        └── user logged in → Main App Shell
              ├── Route "/" → Dashboard
              └── Route "/settings" → SettingsScreen
                  └── BottomNav (persistent)
```

**AuthScreen transitions:** `AnimatePresence` + `motion.div` with `x` offset slide + opacity fade. Tab pills animate with a sliding underline indicator using `layoutId`.

---

## Urgency Logic

Computed in `ExpenseCard.tsx` from `payment_day` vs today's date:

```ts
function getUrgency(paymentDay: number): 'green' | 'yellow' | 'red' | 'paid' {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), paymentDay);
  if (thisMonth < today) thisMonth.setMonth(thisMonth.getMonth() + 1); // next month
  const daysUntil = Math.ceil((thisMonth.getTime() - today.getTime()) / 86400000);
  if (daysUntil <= 1) return 'red';
  if (daysUntil <= 3) return 'yellow';
  return 'green';
}
```

Cards sorted by urgency (red first). Color ring on left border of glass card.

---

## Animations Inventory

| Trigger | Animation |
|---|---|
| App open | Splash logo scales 0.6→1, then whole screen zooms to 1.08→1 + fade to app |
| Auth tab switch | Slide out left/right + fade in with `AnimatePresence` |
| Add expense | Modal slides up from bottom with spring |
| Expense added success | Card flies in from bottom + scale bounce |
| Delete expense | Card slides right + fades out + scale down |
| Settings toggle | Spring bounce on switch |
| Empty state | Gentle float loop on icon |

---

## Settings Screen Options

1. **Notifications** — Toggle: "Recordatorios silenciosos" (saved to localStorage + Supabase user_metadata)
2. **Tema** — Toggle: Light / Dark (ThemeContext)
3. **Moneda base** — Selector: MXN / USD (affects dashboard display default)
4. **Cuenta** — Email display, logout button
5. **Logo / Nombre App** — Prominent placeholder slot at the top (same LogoPlaceholder component)

---

## Password Recovery

ForgotPasswordForm calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: ... })`. Supabase handles email delivery via its built-in service (works out of the box without Resend). The plan note: Resend integration can be swapped in later via a Supabase Edge Function. The UI shows a success state with confirmation copy.

---

## CSS Design Tokens (src/index.css additions)

```css
/* Liquid glass utilities */
.glass-dark { background: rgba(255,255,255,0.07); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.12); }
.glass-light { background: rgba(255,255,255,0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.8); }

/* CSS custom properties for theming */
:root {
  --accent: #7c5cfc;
  --green: #34d399;
  --yellow: #fbbf24;
  --red: #f87171;
}
```

Tailwind v4 `@theme` block for custom tokens, dark mode via `.dark` class on `<html>`.

---

## Implementation Order

1. `index.css` — Google Fonts imports, CSS tokens, glass utilities, theme vars
2. `ThemeContext.tsx` — light/dark toggle, `<html>` class, localStorage persist
3. `lib/supabase.ts` + `AuthContext.tsx` — Supabase client, auth state
4. `lib/currency.ts` — frankfurter.app fetch
5. Glass UI primitives: `GlassCard`, `GlassButton`, `GlassInput`, `GlassSelect`, `LogoPlaceholder`
6. `SplashScreen.tsx` — logo + zoom transition
7. `AuthScreen.tsx` + forms — login, register, forgot password
8. `ExpensesContext.tsx` — CRUD with Supabase
9. `ExpenseCard.tsx` + `Dashboard.tsx` — list + urgency logic
10. `ExpenseForm.tsx` — add/edit modal with currency converter
11. `SettingsScreen.tsx` — theme, notifications, account
12. `BottomNav.tsx` + `App.tsx` routing — wire everything together

---

## Verification

1. Open preview — splash screen animates, transitions to auth
2. Register a new account → redirects to dashboard (empty state)
3. Add an expense in MXN → card appears with green/yellow/red ring
4. Add an expense in USD → conversion to MXN shown in form and card
5. Edit an expense → modal pre-fills, save updates card
6. Delete an expense → card animates away
7. Navigate to Settings → toggle dark/light mode, see theme update instantly
8. Forgot password → enter email, see success confirmation
9. Logout → returns to auth screen
