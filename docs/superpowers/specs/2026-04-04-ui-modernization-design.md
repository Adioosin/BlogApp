# UI Modernization Design Spec

**Date:** 2026-04-04  
**Approach:** Option B — Design Token Refresh + Layout Upgrades for high-impact pages  
**Scope:** Purely visual — no backend changes, no new API calls, no data model changes

---

## Overview

A holistic visual refresh of the BlogApp frontend targeting a personal/portfolio blog for a tech/developer audience. The redesign introduces a new "Soft & Fresh" aesthetic (emerald green primary, light surfaces, soft gradients) with full dark mode support, improved typography, and layout upgrades on the two highest-traffic pages: homepage feed and post detail.

---

## 1. Design Token System

### Color Palette

All colors are CSS custom properties on `:root` and `[data-theme="dark"]` in `apps/frontend/src/index.css`. No hardcoded colors anywhere.

| Token | Light | Dark |
|---|---|---|
| `--color-primary` | `#10b981` | `#34d399` |
| `--color-primary-hover` | `#059669` | `#10b981` |
| `--color-primary-subtle` | `#ecfdf5` | `#052e16` |
| `--color-primary-subtle-border` | `#a7f3d0` | `#166534` |
| `--color-bg` | `#f8fafc` | `#0f172a` |
| `--color-surface` | `#ffffff` | `#1e293b` |
| `--color-surface-hover` | `#f8fafc` | `#273548` |
| `--color-border` | `#e2e8f0` | `#334155` |
| `--color-text` | `#111827` | `#f1f5f9` |
| `--color-text-muted` | `#6b7280` | `#94a3b8` |
| `--color-text-subtle` | `#9ca3af` | `#64748b` |
| `--color-danger` | `#ef4444` | `#f87171` |
| `--color-warning` | `#f59e0b` | `#fbbf24` |
| `--color-success` | `#10b981` | `#34d399` |

### Typography

- **Body font:** System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`) — no Google Fonts for body
- **Heading font:** Inter (CDN subset, headings only)
- **Base font size:** `16px` (up from ~14px)
- **Body line-height:** `1.75`
- **Heading letter-spacing:** `-0.02em` for h1/h2, `-0.03em` for display-size titles
- **Heading weights:** `700`–`800`

### Spacing & Shape

- **Card border-radius:** `10px`
- **Button border-radius:** `8px`
- **Card shadow (default):** `0 1px 3px rgba(0,0,0,0.06)`
- **Card shadow (hover):** `0 4px 16px rgba(0,0,0,0.08)`
- **Max content width:** `720px` (feed), `680px` (post detail)

---

## 2. Dark Mode

- Implemented via `data-theme="dark"` attribute on `<html>`
- On first load: respect `prefers-color-scheme` media query
- Manual toggle: sun/moon icon button in the header; persisted to `localStorage`
- All visual values are CSS variables — dark mode is a single attribute swap, zero duplication

---

## 3. Avatar / Initials Component

A reusable `<Avatar>` component replaces all plain placeholder circles throughout the app.

**Behavior:**
- Displays the first letter of the user's name (uppercase)
- Background: `linear-gradient(135deg, #10b981, #3b82f6)` — consistent across light and dark
- Text: white, bold
- Sizes: `sm` (22px, 11px font), `md` (34px, 14px font), `lg` (48px, 20px font)
- Used in: header dropdown, feed post rows (author line), post detail author row, comments

---

## 4. Header & Navigation

**File:** `apps/frontend/src/components/layout.tsx`

**Changes:**
- Sticky positioning with `backdrop-filter: blur(8px)` and a semi-transparent surface background (`rgba(255,255,255,0.85)` light / `rgba(15,23,42,0.85)` dark — defined as separate tokens `--color-header-bg-light` and `--color-header-bg-dark`)
- Left: logo — bold "BlogApp" text with a small `8px` green circle dot prefix
- Right (logged out): dark mode toggle → "Sign in" link → "Get started" green button
- Right (logged in): dark mode toggle → "+ New Post" green-subtle button → initials avatar with name + dropdown chevron
- Dropdown menu (logged in): Dashboard, New Post, Sign out — shown on click, dismissed on outside click
- Dark mode toggle: sun/moon SVG icon button, `32px` rounded square, calls toggle function
- Mobile: existing hamburger menu retained, restyled with new tokens

---

## 5. Homepage Feed — Layout Upgrade

**File:** `apps/frontend/src/pages/home-page.tsx`

**Hero bio section** (above post list):
- Author avatar (lg size) + display name + one-line bio
- Social links row (GitHub, Twitter, RSS) — rendered only if links are configured; for now, omit or leave as static placeholder
- Separated from post list by a bottom border

**Post row layout** (replaces current plain list):
- White card (`var(--color-surface)`), `10px` radius, `1px` border
- Left side: tag pill → title (16px, 700 weight, `-0.02em` tracking) → 2-line clamped excerpt → author row (sm avatar + date + read time)
- Right side: `80×80px` thumbnail, `8px` radius
  - Source: `post.coverImage` if present; otherwise a deterministic gradient placeholder based on tag name hash
- Hover: card shadow lifts, title color shifts to `var(--color-primary)`
- Gap between rows: `4px`

**Pagination:**
- "← Previous" (ghost button) and "Next →" (green filled button)
- Replaces current numbered pagination links

**No new API calls** — all data (`title`, `excerpt`, `author`, `createdAt`, `tags`, `coverImage`) already present in the existing list endpoint response.

---

## 6. Post Detail Page — Layout Upgrade

**File:** `apps/frontend/src/pages/post-detail-page.tsx`

**Layout:**
- Centered column, max-width `680px`, generous vertical padding (`48px` top)
- Tag pill + read time row above title
- Title: `2.25rem`, `800` weight, `-0.03em` tracking, `1.2` line-height
- Author row: md avatar + author name (bold) + date — below title, above cover image
- Cover image: full-width, `10px` radius, rendered only if `post.coverImage` is present
- Body: `17px`, `1.75` line-height, system font
- Code blocks: dark surface (`#1e293b`), monospace, `8px` radius, syntax-colored text (existing TipTap rendering — no change to editor, just token-driven styles)

**Comments section:**
- Separated by a top border, `48px` margin-top
- Comment author shown with sm avatar (initials)
- No structural changes — visual token refresh only

---

## 7. Remaining Pages — Token Refresh Only

No layout changes. Updated to use new CSS tokens and Avatar component.

| Page | File | Changes |
|---|---|---|
| Login | `apps/frontend/src/pages/login-page.tsx` | New border-radius, shadow, green primary button |
| Register | `apps/frontend/src/pages/register-page.tsx` | Same as login |
| Dashboard | `apps/frontend/src/pages/dashboard-page.tsx` | Badge colors, action button styles, avatar in post list |
| Editor | `apps/frontend/src/pages/editor-page.tsx` | Toolbar and container token colors |

---

## 8. Out of Scope

- No backend changes
- No new API endpoints or data fields
- No changes to auth flow or routing
- No animation library additions
- No font self-hosting (Inter loaded from CDN for headings only)
- No social link data model — bio section uses static/hardcoded placeholder for now
