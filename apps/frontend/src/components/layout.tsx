import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

import { useAuth } from '../hooks/use-auth.js';

export function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-surface-alt">
      <header className="bg-surface border-b border-border sticky top-0 z-50">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-text-primary hover:text-primary-600 no-underline">
            BlogApp
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-text-secondary hover:text-primary-600 no-underline">
              Home
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium text-text-secondary hover:text-primary-600 no-underline">
                  Dashboard
                </Link>
                <Link
                  to="/editor"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors no-underline"
                >
                  New Post
                </Link>
                <span className="text-sm text-text-muted">{user?.name}</span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-sm font-medium text-text-secondary hover:text-danger cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-text-secondary hover:text-primary-600 no-underline">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors no-underline"
                >
                  Register
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
          <div className="md:hidden border-t border-border bg-surface px-4 py-3 space-y-2">
            <Link
              to="/"
              className="block py-2 text-sm font-medium text-text-secondary hover:text-primary-600 no-underline"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="block py-2 text-sm font-medium text-text-secondary hover:text-primary-600 no-underline"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/editor"
                  className="block py-2 text-sm font-medium text-primary-600 hover:text-primary-700 no-underline"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  New Post
                </Link>
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-sm text-text-muted">{user?.name}</span>
                  <button
                    type="button"
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="text-sm font-medium text-danger cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 text-sm font-medium text-text-secondary hover:text-primary-600 no-underline"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block py-2 text-sm font-medium text-primary-600 hover:text-primary-700 no-underline"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
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
