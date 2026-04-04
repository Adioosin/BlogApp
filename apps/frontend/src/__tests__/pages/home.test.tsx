import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { HomePage } from '../../pages/home.js';

const mockList = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../../lib/api-client.js', () => ({
  postsApi: {
    list: (...args: unknown[]) => mockList(...args),
  },
}));

vi.mock('../../hooks/use-auth.js', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  const renderHome = () =>
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

  it('shows loading state initially', () => {
    mockList.mockReturnValue(new Promise(() => {}));
    renderHome();

    expect(screen.getByText(/loading posts/i)).toBeDefined();
  });

  it('renders posts when loaded', async () => {
    mockList.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: '1',
            title: 'Test Post',
            content: 'Test content for the post',
            isPublished: true,
            authorId: 'u1',
            createdAt: '2026-03-28T00:00:00Z',
            updatedAt: '2026-03-28T00:00:00Z',
            author: { id: 'u1', email: 'a@b.com', name: 'Author' },
          },
        ],
        meta: { page: 1, limit: 10, total: 1 },
      },
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeDefined();
    });

    // Author is shown as an Avatar (initial) + date — no "By {name}" text
    // Date rendering may vary by timezone (Mar 27 or Mar 28), just check year is present
    expect(screen.getByText(/2026/)).toBeDefined();
  });

  it('shows empty message when no posts', async () => {
    mockList.mockResolvedValueOnce({
      data: {
        data: [],
        meta: { page: 1, limit: 10, total: 0 },
      },
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText(/no posts published/i)).toBeDefined();
    });
  });

  it('shows error message on failure', async () => {
    mockList.mockRejectedValueOnce(new Error('Network error'));

    renderHome();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText(/failed to load posts/i)).toBeDefined();
    });
  });

  it('shows hero bio with BlogApp name when not authenticated', async () => {
    mockList.mockResolvedValueOnce({
      data: { data: [], meta: { page: 1, limit: 10, total: 0 } },
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('BlogApp')).toBeDefined();
    });
  });

  it('shows hero bio with user name when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Jane Doe', email: 'jane@example.com' },
      isAuthenticated: true,
      isLoading: false,
    });

    mockList.mockResolvedValueOnce({
      data: { data: [], meta: { page: 1, limit: 10, total: 0 } },
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeDefined();
    });
  });
});
