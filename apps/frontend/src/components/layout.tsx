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
        className="sticky top-0 z-50 backdrop-blur border-b"
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
                  className="px-4 py-2 text-sm font-semibold text-white rounded-lg no-underline transition-colors hover:opacity-90"
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
