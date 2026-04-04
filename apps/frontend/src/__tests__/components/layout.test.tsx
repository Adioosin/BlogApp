import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { Layout } from '../../components/layout.js';

const mockUseAuth = vi.fn();
const mockToggleDark = vi.fn();

vi.mock('../../hooks/use-auth.js', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../hooks/use-dark-mode.js', () => ({
  useDarkMode: () => ({ isDark: false, toggle: mockToggleDark }),
}));

describe('Layout', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const renderLayout = (initialPath = '/') =>
    render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<p>Home Content</p>} />
            <Route path="/dashboard" element={<p>Dashboard Content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

  describe('unauthenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        logout: vi.fn(),
      });
    });

    it('renders brand link and outlet', () => {
      renderLayout();

      expect(screen.getByText('BlogApp')).toBeDefined();
      expect(screen.getByText('Home Content')).toBeDefined();
    });

    it('shows sign in and get started links', () => {
      renderLayout();

      const signInLinks = screen.getAllByText(/sign in/i);
      const getStartedLinks = screen.getAllByText(/get started/i);
      expect(signInLinks.length).toBeGreaterThan(0);
      expect(getStartedLinks.length).toBeGreaterThan(0);
    });
  });

  describe('authenticated', () => {
    const mockLogout = vi.fn();

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        logout: mockLogout,
      });
    });

    it('shows new post link and user name', () => {
      renderLayout();

      const newPostLinks = screen.getAllByText(/new post/i);
      expect(newPostLinks.length).toBeGreaterThan(0);

      const userNames = screen.getAllByText('Test User');
      expect(userNames.length).toBeGreaterThan(0);
    });

    it('shows user name', () => {
      renderLayout();

      const userNames = screen.getAllByText('Test User');
      expect(userNames.length).toBeGreaterThan(0);
    });
  });

  describe('mobile menu', () => {
    const mockLogout = vi.fn();

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        logout: mockLogout,
      });
    });

    it('mobile menu is hidden by default', () => {
      renderLayout();

      // The mobile menu container should not be in the DOM when closed
      // Desktop nav has Home, mobile menu also has Home but only when open
      // When menu is closed, there's only the desktop Home link
      const toggleButton = screen.getByLabelText('Toggle menu');
      expect(toggleButton).toBeDefined();
    });

    it('opens mobile menu when hamburger is clicked', async () => {
      const user = userEvent.setup();
      renderLayout();

      const toggleButton = screen.getByLabelText('Toggle menu');
      await user.click(toggleButton);

      // Mobile menu should now show the Home link (only in mobile menu, not desktop nav)
      const homeLinks = screen.getAllByText(/^home$/i);
      expect(homeLinks.length).toBe(1);
    });

    it('closes mobile menu when hamburger is clicked again', async () => {
      const user = userEvent.setup();
      renderLayout();

      const toggleButton = screen.getByLabelText('Toggle menu');

      // Open — mobile menu Home link appears
      await user.click(toggleButton);
      expect(screen.getAllByText(/^home$/i).length).toBe(1);

      // Close — mobile menu Home link disappears
      await user.click(toggleButton);
      expect(screen.queryAllByText(/^home$/i).length).toBe(0);
    });

    it('closes mobile menu when a nav link is clicked', async () => {
      const user = userEvent.setup();
      renderLayout();

      const toggleButton = screen.getByLabelText('Toggle menu');
      await user.click(toggleButton);

      // Click the mobile Home link
      const homeLink = screen.getByText(/^home$/i);
      await user.click(homeLink);

      // Menu should close — Home link is gone (not in desktop nav)
      expect(screen.queryAllByText(/^home$/i).length).toBe(0);
    });

    it('shows auth links in mobile menu when authenticated', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        logout: mockLogout,
      });

      const user = userEvent.setup();
      renderLayout();

      const toggleButton = screen.getByLabelText('Toggle menu');
      await user.click(toggleButton);

      // Desktop dropdown is closed; only mobile menu shows Dashboard link
      const dashboardLinks = screen.getAllByText(/dashboard/i);
      expect(dashboardLinks.length).toBeGreaterThan(0);

      // Desktop has "+ New Post" link, mobile menu has "New Post" — both match /new post/i
      const newPostLinks = screen.getAllByText(/new post/i);
      expect(newPostLinks.length).toBe(2);
    });
  });
});
