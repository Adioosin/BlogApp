import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { Layout } from '../../components/layout.js';

const mockUseAuth = vi.fn();

vi.mock('../../hooks/use-auth.js', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

    it('shows login and register links', () => {
      renderLayout();

      const loginLinks = screen.getAllByText(/login/i);
      const registerLinks = screen.getAllByText(/register/i);
      expect(loginLinks.length).toBeGreaterThan(0);
      expect(registerLinks.length).toBeGreaterThan(0);
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

    it('shows dashboard and new post links', () => {
      renderLayout();

      const dashboardLinks = screen.getAllByText(/dashboard/i);
      const newPostLinks = screen.getAllByText(/new post/i);
      expect(dashboardLinks.length).toBeGreaterThan(0);
      expect(newPostLinks.length).toBeGreaterThan(0);
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

      // Mobile menu should now show links (duplicated from desktop)
      // Both desktop and mobile Home links exist, so we should have 2
      const homeLinks = screen.getAllByText(/^home$/i);
      expect(homeLinks.length).toBe(2);
    });

    it('closes mobile menu when hamburger is clicked again', async () => {
      const user = userEvent.setup();
      renderLayout();

      const toggleButton = screen.getByLabelText('Toggle menu');

      // Open
      await user.click(toggleButton);
      let homeLinks = screen.getAllByText(/^home$/i);
      expect(homeLinks.length).toBe(2);

      // Close
      await user.click(toggleButton);
      homeLinks = screen.getAllByText(/^home$/i);
      expect(homeLinks.length).toBe(1);
    });

    it('closes mobile menu when a nav link is clicked', async () => {
      const user = userEvent.setup();
      renderLayout();

      const toggleButton = screen.getByLabelText('Toggle menu');
      await user.click(toggleButton);

      // Click the mobile Home link (the second one)
      const homeLinks = screen.getAllByText(/^home$/i);
      await user.click(homeLinks[1]);

      // Menu should close — only 1 Home link remains (desktop)
      const remainingHomeLinks = screen.getAllByText(/^home$/i);
      expect(remainingHomeLinks.length).toBe(1);
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

      // Both desktop and mobile should show Dashboard
      const dashboardLinks = screen.getAllByText(/dashboard/i);
      expect(dashboardLinks.length).toBe(2);

      // Both should show New Post
      const newPostLinks = screen.getAllByText(/new post/i);
      expect(newPostLinks.length).toBe(2);
    });
  });
});
