import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { HomePage } from '../../pages/home.js';

const mockList = vi.fn();

vi.mock('../../lib/api-client.js', () => ({
  postsApi: {
    list: (...args: unknown[]) => mockList(...args),
  },
  likesApi: {
    like: vi.fn().mockResolvedValue({}),
    unlike: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../hooks/use-auth.js', () => ({
  useAuth: () => ({ isAuthenticated: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
            likeCount: 0,
            likedByMe: false,
          },
        ],
        meta: { page: 1, limit: 10, total: 1 },
      },
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeDefined();
    });

    expect(screen.getByText(/by author/i)).toBeDefined();
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
});
