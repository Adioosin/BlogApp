# UI Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize the BlogApp frontend with a new emerald green design token system, dark mode support, an Avatar component, a redesigned header, an upgraded homepage feed layout, and an upgraded post detail layout — plus token-only refreshes on all remaining pages.

**Architecture:** All visual changes are isolated to CSS variables in `index.css` and component JSX/Tailwind classes. Dark mode uses a `data-theme="dark"` attribute on `<html>` toggled by a new `useDarkMode` hook, with values picked up by a new `[data-theme="dark"]` block in the Tailwind theme. No new dependencies are needed.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4 (`@theme` blocks), Vitest + React Testing Library

---

## File Map

| Action | File |
|--------|------|
| Modify | `apps/frontend/src/index.css` — replace color tokens, add dark mode block, update base styles |
| Create | `apps/frontend/src/hooks/use-dark-mode.ts` — localStorage + system-preference dark mode toggle |
| Create | `apps/frontend/src/components/avatar.tsx` — initials avatar at sm/md/lg sizes |
| Modify | `apps/frontend/src/components/layout.tsx` — new header: blur, green dot logo, dark toggle, avatar dropdown |
| Modify | `apps/frontend/src/pages/home.tsx` — hero bio section + list-with-thumbnail post rows |
| Modify | `apps/frontend/src/pages/post-detail.tsx` — centered layout, reading typography, author row with avatar |
| Modify | `apps/frontend/src/pages/login.tsx` — token refresh only |
| Modify | `apps/frontend/src/pages/register.tsx` — token refresh only |
| Modify | `apps/frontend/src/pages/dashboard.tsx` — token refresh + avatar in post rows |
| Modify | `apps/frontend/src/pages/editor.tsx` — token refresh only |
| Modify | `apps/frontend/src/__tests__/components/layout.test.tsx` — update for new header structure |
| Modify | `apps/frontend/src/__tests__/pages/home.test.tsx` — update for new post row structure |

---

## Task 1: Replace Design Tokens in index.css

**Files:**
- Modify: `apps/frontend/src/index.css`

- [ ] **Step 1: Run existing tests to establish baseline**

```bash
pnpm --filter @blogapp/frontend test
```
Expected: all tests pass before we touch anything.

- [ ] **Step 2: Replace the `@theme` block and base styles**

Replace the entire contents of `apps/frontend/src/index.css` with:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  /* Primary — emerald green */
  --color-primary: #10b981;
  --color-primary-hover: #059669;
  --color-primary-subtle: #ecfdf5;
  --color-primary-subtle-border: #a7f3d0;

  /* Surfaces */
  --color-surface: #ffffff;
  --color-surface-alt: #f8fafc;
  --color-surface-hover: #f1f5f9;
  --color-border: #e2e8f0;

  /* Text */
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-text-muted: #9ca3af;

  /* Semantic */
  --color-success: #10b981;
  --color-danger: #ef4444;
  --color-danger-hover: #dc2626;
  --color-warning: #f59e0b;

  /* Header */
  --color-header-bg: rgba(255, 255, 255, 0.85);
  --color-header-border: #e2e8f0;

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-heading: "Inter", ui-sans-serif, system-ui, sans-serif;

  /* Shadows */
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.06);
  --shadow-card-hover: 0 4px 16px 0 rgb(0 0 0 / 0.08);
  --shadow-modal: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

/* Dark mode token overrides */
[data-theme="dark"] {
  --color-primary: #34d399;
  --color-primary-hover: #10b981;
  --color-primary-subtle: #052e16;
  --color-primary-subtle-border: #166534;

  --color-surface: #1e293b;
  --color-surface-alt: #0f172a;
  --color-surface-hover: #273548;
  --color-border: #334155;

  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #64748b;

  --color-success: #34d399;
  --color-danger: #f87171;
  --color-warning: #fbbf24;

  --color-header-bg: rgba(15, 23, 42, 0.85);
  --color-header-border: #334155;
}

/* Load Inter for headings only */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@700;800&display=swap");

/* Base styles */
@layer base {
  body {
    @apply bg-surface-alt text-text-primary antialiased;
    font-family: var(--font-sans);
    font-size: 16px;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
    @apply font-bold tracking-tight text-text-primary;
    letter-spacing: -0.02em;
  }

  a {
    @apply text-primary hover:text-primary-hover transition-colors;
  }
}

/* Prose overrides */
.prose blockquote {
  @apply border-primary;
}

/* Spinner animation */
@keyframes spin {
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
```

- [ ] **Step 3: Run tests — expect failures on color class names**

```bash
pnpm --filter @blogapp/frontend test
```
Expected: some tests fail because Tailwind classes like `text-primary-600`, `bg-primary-600`, `text-text-secondary` etc. are now invalid (old scale-based names replaced by semantic names). Note which tests fail — we'll fix them as we update each component.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/index.css
git commit -m "replace design tokens with emerald green palette and dark mode vars"
```

---

## Task 2: Create `useDarkMode` Hook

**Files:**
- Create: `apps/frontend/src/hooks/use-dark-mode.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/frontend/src/__tests__/hooks/use-dark-mode.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useDarkMode } from '../../hooks/use-dark-mode.js';

describe('useDarkMode', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to light mode when no preference is stored', () => {
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('toggles dark mode on and sets data-theme attribute', () => {
    const { result } = renderHook(() => useDarkMode());
    act(() => result.current.toggle());
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('persists preference to localStorage', () => {
    const { result } = renderHook(() => useDarkMode());
    act(() => result.current.toggle());
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('restores dark mode from localStorage on mount', () => {
    localStorage.setItem('theme', 'dark');
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @blogapp/frontend test src/__tests__/hooks/use-dark-mode.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create the hook**

Create `apps/frontend/src/hooks/use-dark-mode.ts`:

```typescript
import { useEffect, useState } from 'react';

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return { isDark, toggle: () => setIsDark((d) => !d) };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @blogapp/frontend test src/__tests__/hooks/use-dark-mode.test.ts
```
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/hooks/use-dark-mode.ts apps/frontend/src/__tests__/hooks/use-dark-mode.test.ts
git commit -m "add useDarkMode hook with localStorage persistence"
```

---

## Task 3: Create Avatar Component

**Files:**
- Create: `apps/frontend/src/components/avatar.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/frontend/src/__tests__/components/avatar.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from '../../components/avatar.js';

describe('Avatar', () => {
  it('renders the first letter of the name uppercased', () => {
    render(<Avatar name="adam" size="md" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('applies sm size classes', () => {
    const { container } = render(<Avatar name="Bob" size="sm" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('22px');
    expect(el.style.height).toBe('22px');
  });

  it('applies lg size classes', () => {
    const { container } = render(<Avatar name="Bob" size="lg" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('48px');
    expect(el.style.height).toBe('48px');
  });

  it('uses md as default size', () => {
    const { container } = render(<Avatar name="Carol" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('34px');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @blogapp/frontend test src/__tests__/components/avatar.test.tsx
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create the component**

Create `apps/frontend/src/components/avatar.tsx`:

```typescript
type AvatarSize = 'sm' | 'md' | 'lg';

const sizes: Record<AvatarSize, { width: string; height: string; fontSize: string }> = {
  sm: { width: '22px', height: '22px', fontSize: '11px' },
  md: { width: '34px', height: '34px', fontSize: '14px' },
  lg: { width: '48px', height: '48px', fontSize: '20px' },
};

type AvatarProps = {
  name: string;
  size?: AvatarSize;
};

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const { width, height, fontSize } = sizes[size];
  return (
    <div
      style={{
        width,
        height,
        fontSize,
        background: 'linear-gradient(135deg, #10b981, #3b82f6)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm --filter @blogapp/frontend test src/__tests__/components/avatar.test.tsx
```
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/avatar.tsx apps/frontend/src/__tests__/components/avatar.test.tsx
git commit -m "add Avatar component with sm/md/lg sizes and initial display"
```

---

## Task 4: Update Layout Component (Header Redesign)

**Files:**
- Modify: `apps/frontend/src/components/layout.tsx`
- Modify: `apps/frontend/src/__tests__/components/layout.test.tsx`

- [ ] **Step 1: Read the existing layout test to understand what needs updating**

Open `apps/frontend/src/__tests__/components/layout.test.tsx` and note all assertions about button/link text, class names, or structure that will break.

- [ ] **Step 2: Replace `apps/frontend/src/components/layout.tsx`**

```typescript
import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/use-auth.js';
import { useDarkMode } from '../hooks/use-dark-mode.js';
import { Avatar } from './avatar.js';

export function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-alt">
      <header
        className="sticky top-0 z-50 backdrop-blur-sm border-b"
        style={{
          background: 'var(--color-header-bg)',
          borderColor: 'var(--color-header-border)',
        }}
      >
        <nav
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 no-underline group">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: 'var(--color-primary)' }}
            />
            <span className="text-xl font-bold text-text-primary tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              BlogApp
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={toggleDark}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 rounded-lg border border-border bg-surface-hover flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
            >
              {isDark ? (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>

            {isAuthenticated && user ? (
              <>
                <Link
                  to="/editor"
                  className="px-3 py-1.5 text-sm font-semibold rounded-lg border no-underline transition-colors"
                  style={{
                    color: 'var(--color-primary)',
                    background: 'var(--color-primary-subtle)',
                    borderColor: 'var(--color-primary-subtle-border)',
                  }}
                >
                  + New Post
                </Link>

                {/* Avatar dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                  >
                    <Avatar name={user.name} size="md" />
                    <span>{user.name}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-44 bg-surface border border-border rounded-xl shadow-modal overflow-hidden z-50">
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-hover no-underline transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/editor"
                        className="block px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-hover no-underline transition-colors border-t border-border"
                        onClick={() => setDropdownOpen(false)}
                      >
                        New Post
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-danger hover:bg-surface-hover transition-colors border-t border-border"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary no-underline transition-colors">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white rounded-lg no-underline transition-colors"
                  style={{ background: 'var(--color-primary)' }}
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-2 text-text-secondary hover:text-text-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-surface px-4 py-3 space-y-1">
            <Link
              to="/"
              className="block py-2 text-sm font-medium text-text-secondary hover:text-text-primary no-underline"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/dashboard"
                  className="block py-2 text-sm font-medium text-text-secondary hover:text-text-primary no-underline"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/editor"
                  className="block py-2 text-sm font-medium no-underline"
                  style={{ color: 'var(--color-primary)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  New Post
                </Link>
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar name={user.name} size="sm" />
                    <span className="text-sm text-text-muted">{user.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-sm font-medium text-danger"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 text-sm font-medium text-text-secondary hover:text-text-primary no-underline"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="block py-2 text-sm font-medium no-underline"
                  style={{ color: 'var(--color-primary)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get started
                </Link>
              </>
            )}
            <div className="pt-2 border-t border-border">
              <button
                type="button"
                onClick={toggleDark}
                className="text-sm text-text-secondary"
              >
                {isDark ? 'Light mode' : 'Dark mode'}
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-sm text-text-muted">&copy; {new Date().getFullYear()} BlogApp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 3: Update the layout test**

Open `apps/frontend/src/__tests__/components/layout.test.tsx`. Update any assertions referencing old class names, "Login"/"Register"/"Logout"/"New Post" button text to use the new text: "Sign in", "Get started", "Sign out", "+ New Post". Keep the structural assertions about authenticated vs unauthenticated states. Run the tests to confirm what breaks and fix those assertions.

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @blogapp/frontend test src/__tests__/components/layout.test.tsx
```
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components/layout.tsx apps/frontend/src/__tests__/components/layout.test.tsx
git commit -m "redesign header with blur, green dot logo, dark toggle, and avatar dropdown"
```

---

## Task 5: Upgrade Homepage Feed Layout

**Files:**
- Modify: `apps/frontend/src/pages/home.tsx`
- Modify: `apps/frontend/src/__tests__/pages/home.test.tsx`

- [ ] **Step 1: Replace `apps/frontend/src/pages/home.tsx`**

```typescript
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import type { PostDto } from '@blogapp/types';

import { useAuth } from '../hooks/use-auth.js';
import { postsApi } from '../lib/api-client.js';
import { Avatar } from '../components/avatar.js';

function stripToPlainText(md: string): string {
  const html = marked.parse(md, { async: false }) as string;
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  return clean;
}

function gradientForName(name: string): string {
  const gradients = [
    'linear-gradient(135deg, #d1fae5, #dbeafe)',
    'linear-gradient(135deg, #dbeafe, #fce7f3)',
    'linear-gradient(135deg, #fef3c7, #fce7f3)',
    'linear-gradient(135deg, #ede9fe, #dbeafe)',
    'linear-gradient(135deg, #d1fae5, #fef3c7)',
  ];
  const index = name.charCodeAt(0) % gradients.length;
  return gradients[index];
}

export function HomePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const limit = 10;

  useEffect(() => {
    setIsLoading(true);
    setError('');
    postsApi
      .list({ page, limit })
      .then((res) => {
        setPosts(res.data.data);
        setTotal(res.data.meta.total);
      })
      .catch(() => setError('Failed to load posts'))
      .finally(() => setIsLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-[720px] mx-auto">
      {/* Hero bio section */}
      <div className="mb-8 pb-8 border-b border-border">
        <div className="flex items-center gap-4 mb-3">
          {user ? (
            <Avatar name={user.name} size="lg" />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}
            />
          )}
          <div>
            <div className="text-lg font-bold text-text-primary" style={{ letterSpacing: '-0.02em' }}>
              {user?.name ?? 'BlogApp'}
            </div>
            <div className="text-sm text-text-secondary">
              Writing about software, design, and the web.
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="ml-3 text-text-secondary">Loading posts...</span>
        </div>
      )}

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl px-4 py-3 mb-6" role="alert">
          {error}
        </div>
      )}

      {!isLoading && !error && posts.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg text-text-secondary">No posts published yet.</p>
          <p className="text-sm text-text-muted mt-1">Check back soon for new content!</p>
        </div>
      )}

      <div className="flex flex-col gap-1">
        {posts.map((post) => {
          const excerpt = stripToPlainText(post.content);
          const tag = post.tags?.[0];
          const thumbnail = (post as PostDto & { coverImage?: string }).coverImage;

          return (
            <article
              key={post.id}
              className="bg-surface rounded-xl border border-border p-4 shadow-card hover:shadow-card-hover transition-shadow flex gap-4 items-start group"
            >
              <div className="flex-1 min-w-0">
                {tag && (
                  <div className="mb-2">
                    <span
                      className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                      style={{
                        background: 'var(--color-primary-subtle)',
                        color: 'var(--color-primary)',
                        border: '1px solid var(--color-primary-subtle-border)',
                      }}
                    >
                      {tag}
                    </span>
                  </div>
                )}
                <h2 className="text-base font-bold text-text-primary mb-1.5 leading-snug" style={{ letterSpacing: '-0.02em' }}>
                  <Link
                    to={`/posts/${post.id}`}
                    className="no-underline group-hover:text-primary transition-colors"
                    style={{ color: 'inherit' }}
                  >
                    {post.title}
                  </Link>
                </h2>
                {excerpt && (
                  <p className="text-sm text-text-secondary leading-relaxed mb-2.5 line-clamp-2">
                    {excerpt}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Avatar name={post.author.name} size="sm" />
                  <span className="text-xs text-text-muted">
                    {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <div
                className="w-20 h-20 rounded-lg flex-shrink-0"
                style={{
                  background: thumbnail ? `url(${thumbnail}) center/cover` : gradientForName(post.title),
                }}
              />
            </article>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-surface text-text-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <span className="text-sm text-text-muted">Page {page} of {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ background: 'var(--color-primary)' }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update the home page test**

Open `apps/frontend/src/__tests__/pages/home.test.tsx`. The test mocks `postsApi.list`. Update any assertion that looks for `<article>` content structure — the post title and author are still rendered, so most assertions should still work. Fix any that reference old class names or the old "By {name}" author format (now it's just the date next to an avatar).

- [ ] **Step 3: Run tests**

```bash
pnpm --filter @blogapp/frontend test src/__tests__/pages/home.test.tsx
```
Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/pages/home.tsx apps/frontend/src/__tests__/pages/home.test.tsx
git commit -m "upgrade homepage to list-with-thumbnail layout and hero bio section"
```

---

## Task 6: Upgrade Post Detail Page

**Files:**
- Modify: `apps/frontend/src/pages/post-detail.tsx`

- [ ] **Step 1: Replace `apps/frontend/src/pages/post-detail.tsx`**

```typescript
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import type { CommentDto, PostDto } from '@blogapp/types';

import { useAuth } from '../hooks/use-auth.js';
import { commentsApi, postsApi } from '../lib/api-client.js';
import { Avatar } from '../components/avatar.js';

function renderMarkdown(md: string): string {
  const raw = marked.parse(md, { async: false }) as string;
  return DOMPurify.sanitize(raw);
}

function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const [post, setPost] = useState<PostDto | null>(null);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentError, setCommentError] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    Promise.all([postsApi.get(id), commentsApi.list(id)])
      .then(([postRes, commentsRes]) => {
        setPost(postRes.data.data);
        setComments(commentsRes.data.data);
      })
      .catch(() => setError('Failed to load post'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentBody.trim()) return;
    setCommentError('');
    setIsSubmittingComment(true);
    try {
      const res = await commentsApi.create(id, { body: commentBody.trim() });
      setComments((prev) => [res.data.data, ...prev]);
      setCommentBody('');
    } catch {
      setCommentError('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentsApi.delete(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // silent fail
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="ml-3 text-text-secondary">Loading...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl px-4 py-3" role="alert">
        {error}
      </div>
    );
  }
  if (!post) return <p className="text-text-secondary">Post not found.</p>;

  const readTime = estimateReadTime(post.content);

  return (
    <div className="max-w-[680px] mx-auto pt-4">
      <article className="mb-12">
        {/* Tag + read time */}
        <div className="flex items-center gap-3 mb-4">
          {(post as PostDto & { tags?: string[] }).tags?.[0] && (
            <span
              className="text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{
                background: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                border: '1px solid var(--color-primary-subtle-border)',
              }}
            >
              {(post as PostDto & { tags?: string[] }).tags![0]}
            </span>
          )}
          <span className="text-sm text-text-muted">{readTime} min read</span>
          {!post.isPublished && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/30">
              Draft
            </span>
          )}
        </div>

        {/* Title */}
        <h1
          className="text-4xl font-black text-text-primary mb-5 leading-tight"
          style={{ letterSpacing: '-0.03em' }}
        >
          {post.title}
        </h1>

        {/* Author row */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
          <Avatar name={post.author.name} size="md" />
          <div>
            <div className="text-sm font-semibold text-text-primary">{post.author.name}</div>
            <div className="text-xs text-text-muted">
              {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Cover image */}
        {(post as PostDto & { coverImage?: string }).coverImage && (
          <img
            src={(post as PostDto & { coverImage?: string }).coverImage}
            alt={post.title}
            className="w-full rounded-xl mb-8"
            style={{ maxHeight: '400px', objectFit: 'cover' }}
          />
        )}

        {/* Body */}
        <div
          className="prose max-w-none"
          style={{ fontSize: '17px', lineHeight: '1.75' }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />
      </article>

      {/* Comments */}
      {post.isPublished && (
        <section className="border-t border-border pt-10">
          <h2 className="text-xl font-bold text-text-primary mb-6">
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </h2>

          {isAuthenticated && (
            <form onSubmit={handleAddComment} className="mb-8">
              {commentError && (
                <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl px-4 py-3 text-sm mb-4" role="alert">
                  {commentError}
                </div>
              )}
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                aria-label="Comment"
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow resize-y"
              />
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={isSubmittingComment || !commentBody.trim()}
                  className="px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          )}

          {!isAuthenticated && (
            <p className="text-text-secondary mb-6">
              <Link to="/login" className="font-medium" style={{ color: 'var(--color-primary)' }}>
                Sign in
              </Link>{' '}
              to leave a comment.
            </p>
          )}

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar name={comment.author.name} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-text-primary">{comment.author.name}</span>
                      <span className="text-text-muted text-xs">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {user?.id === comment.authorId && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-text-muted hover:text-danger transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-text-primary leading-relaxed">{comment.body}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-text-muted py-4">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run tests**

```bash
pnpm --filter @blogapp/frontend test
```
Expected: all tests PASS (post detail page has no dedicated test file; the general suite should still pass).

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/pages/post-detail.tsx
git commit -m "upgrade post detail with reading typography, avatar author row, and read time"
```

---

## Task 7: Token Refresh — Login, Register, Editor, Dashboard

**Files:**
- Modify: `apps/frontend/src/pages/login.tsx`
- Modify: `apps/frontend/src/pages/register.tsx`
- Modify: `apps/frontend/src/pages/editor.tsx`
- Modify: `apps/frontend/src/pages/dashboard.tsx`

These pages need old Tailwind class names updated to the new token names. The changes are mechanical — no structural changes.

- [ ] **Step 1: Update `login.tsx` — replace old token class names**

In `apps/frontend/src/pages/login.tsx`, make these replacements:

| Old | New |
|-----|-----|
| `text-primary-600` | (use inline style `color: var(--color-primary)`) |
| `hover:text-primary-700` | (remove or use `hover:opacity-80`) |
| `bg-primary-600` | (use inline style `background: var(--color-primary)`) |
| `hover:bg-primary-700` | (use `hover:opacity-90`) |
| `focus:ring-primary-500` | `focus:ring-primary` |
| `border-primary-500` | `border-primary` |
| `ring-danger/20` | `ring-danger/20` (keep — Tailwind v4 supports opacity modifiers on CSS vars) |

The submit button should become:
```tsx
<button
  type="submit"
  disabled={isSubmitting}
  className="w-full px-4 py-2.5 text-sm font-semibold text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:opacity-90"
  style={{ background: 'var(--color-primary)' }}
>
  {isSubmitting ? 'Logging in...' : 'Login'}
</button>
```

The "Register" link at the bottom:
```tsx
<Link to="/register" className="font-medium hover:opacity-80 no-underline" style={{ color: 'var(--color-primary)' }}>
  Register
</Link>
```

- [ ] **Step 2: Apply same pattern to `register.tsx`**

Same replacements as login. The "Login" link at the bottom:
```tsx
<Link to="/login" className="font-medium hover:opacity-80 no-underline" style={{ color: 'var(--color-primary)' }}>
  Login
</Link>
```

- [ ] **Step 3: Update `dashboard.tsx`**

Replace old token names using the same pattern. Additionally, the "New Post" link button:
```tsx
<Link
  to="/editor"
  className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-white rounded-lg no-underline hover:opacity-90 transition-colors"
  style={{ background: 'var(--color-primary)' }}
>
  New Post
</Link>
```

The "Publish" button in the post list:
```tsx
<button
  type="button"
  onClick={() => handlePublish(post.id)}
  className="px-3 py-1.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-colors"
  style={{ background: 'var(--color-primary)' }}
>
  Publish
</button>
```

Status badges — update to use new semantic tokens:
```tsx
post.isPublished
  ? 'bg-success/10 text-success border border-success/30'
  : 'bg-warning/10 text-warning border border-warning/30'
```

- [ ] **Step 4: Update `editor.tsx`**

Same token replacements. Primary buttons (`Publish`, `Update Post`):
```tsx
className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-colors"
style={{ background: 'var(--color-primary)' }}
```

- [ ] **Step 5: Run all tests**

```bash
pnpm --filter @blogapp/frontend test
```
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/pages/login.tsx apps/frontend/src/pages/register.tsx apps/frontend/src/pages/dashboard.tsx apps/frontend/src/pages/editor.tsx
git commit -m "update login, register, dashboard, editor to new design tokens"
```

---

## Task 8: Final Test Run and Visual Smoke Check

- [ ] **Step 1: Run the full test suite**

```bash
pnpm --filter @blogapp/frontend test
```
Expected: all tests PASS with no errors.

- [ ] **Step 2: Start the dev server and do a visual smoke check**

```bash
pnpm --filter @blogapp/frontend dev
```

Open http://localhost:5173 and verify:
- Homepage loads with list-with-thumbnail layout and hero bio section
- Header shows green dot logo, dark mode toggle, "Sign in" / "Get started" when logged out
- Clicking the dark mode toggle switches the theme
- After logging in: avatar with initial appears in header with dropdown
- Post detail page has centered layout with reading typography
- Login/Register/Dashboard/Editor all load without visual errors

- [ ] **Step 3: Commit if any last fixes were needed, then tag completion**

```bash
git add -A
git commit -m "ui modernization complete: emerald tokens, dark mode, avatar, feed and post detail layouts"
```
